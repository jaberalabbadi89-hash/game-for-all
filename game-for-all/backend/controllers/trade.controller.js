const { query } = require('../config/db');
const { mapTradeRow, sanitizeUser } = require('../utils/formatters');

/**
 * Builds the full trade payload for a given DB row.
 * @param {object} row      - Raw DB row with JOINed user/game fields.
 * @param {number} currentUserId - The authenticated user's ID, used to compute
 *                                 Backend-Driven authorization fields.
 */
async function buildTradePayload(row, currentUserId) {
  const trade = mapTradeRow(row);

  const requester = sanitizeUser({
    id_user: row.requester_id_user,
    username: row.requester_username,
    email: row.requester_email,
    avatar: row.requester_avatar,
    role: row.requester_role,
    created_at: row.requester_created_at,
  });

  const owner = sanitizeUser({
    id_user: row.owner_id_user,
    username: row.owner_username,
    email: row.owner_email,
    avatar: row.owner_avatar,
    role: row.owner_role,
    created_at: row.owner_created_at,
  });

  // ── Backend-Driven Authorization (Computed Fields) ────────────────────────
  // The Frontend must NEVER compute these by comparing IDs.
  // It must only read these fields to decide what to render.
  const isReceiver = Number(row.owner_id_user) === Number(currentUserId);
  const canTakeAction = isReceiver && trade.status === 'pending';

  return {
    ...trade,
    requester,
    owner,
    // Computed authorization fields
    is_receiver: isReceiver,
    can_take_action: canTakeAction,
    offeredGame: {
      id: row.offered_game_id,
      title: row.offered_game_title,
      platform: row.offered_game_platform,
      genre: row.offered_game_genre,
    },
    requestedGame: {
      id: row.requested_game_id,
      title: row.requested_game_title,
      platform: row.requested_game_platform,
      genre: row.requested_game_genre,
    },
  };
}

/** Shared SELECT query to avoid repetition. */
const TRADE_SELECT = `
  SELECT
    t.*,
    requester.id_user  AS requester_id_user,
    requester.username AS requester_username,
    requester.email    AS requester_email,
    requester.avatar   AS requester_avatar,
    requester.role     AS requester_role,
    requester.created_at AS requester_created_at,
    owner.id_user      AS owner_id_user,
    owner.username     AS owner_username,
    owner.email        AS owner_email,
    owner.avatar       AS owner_avatar,
    owner.role         AS owner_role,
    owner.created_at   AS owner_created_at,
    offered.id_game    AS offered_game_id,
    offered.title      AS offered_game_title,
    offered.platform   AS offered_game_platform,
    offered.genre      AS offered_game_genre,
    requested.id_game  AS requested_game_id,
    requested.title    AS requested_game_title,
    requested.platform AS requested_game_platform,
    requested.genre    AS requested_game_genre
  FROM Trades t
  INNER JOIN Users requester ON requester.id_user = t.id_sender
  INNER JOIN Users owner     ON owner.id_user     = t.id_receiver
  INNER JOIN Games offered   ON offered.id_game   = t.id_game_offered
  INNER JOIN Games requested ON requested.id_game = t.id_game_requested
`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trades
// Returns only trades where the authenticated user is sender OR receiver.
// Each trade includes Backend-computed authorization fields.
// ─────────────────────────────────────────────────────────────────────────────
async function getTrades(req, res, next) {
  console.log('1. Hit GET /api/trades (or /api/trades/my-trades)');
  try {
    console.log('2. Current User:', req.user);

    const userId = req.user.id;

    console.log('3. SQL Query Executed — searching trades for userId:', userId);
    const rows = await query(
      `${TRADE_SELECT}
        WHERE t.id_sender = ? OR t.id_receiver = ?
        ORDER BY t.created_at DESC
      `,
      [userId, userId]
    );
    console.log('4. Rows returned from DB:', rows.length);

    const payload = await Promise.all(
      rows.map((row) => buildTradePayload(row, userId))
    );
    return res.json(payload);
  } catch (error) {
    console.error('[DEBUG] getTrades ERROR:', error.message, '\nStack:', error.stack);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trades
// Creates a new trade request (status: pending).
// ─────────────────────────────────────────────────────────────────────────────
async function createTrade(req, res, next) {
  try {
    const { offeredGameId, requestedGameId, message } = req.body;

    if (!offeredGameId || !requestedGameId) {
      return res
        .status(400)
        .json({ error: 'offeredGameId and requestedGameId are required' });
    }

    const [offeredGame, requestedGame] = await Promise.all([
      query('SELECT id_game, id_owner FROM Games WHERE id_game = ? LIMIT 1', [Number(offeredGameId)]),
      query('SELECT id_game, id_owner FROM Games WHERE id_game = ? LIMIT 1', [Number(requestedGameId)]),
    ]);

    if (offeredGame.length === 0 || requestedGame.length === 0) {
      return res.status(404).json({ error: 'One or more games were not found' });
    }

    const tradeResult = await query(
      `INSERT INTO Trades (id_sender, id_receiver, id_game_offered, id_game_requested, status, message)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [
        req.user.id,
        requestedGame[0].id_owner,
        offeredGame[0].id_game,
        requestedGame[0].id_game,
        message || '',
      ]
    );

    const rows = await query(
      `${TRADE_SELECT} WHERE t.id_trade = ? LIMIT 1`,
      [tradeResult.insertId]
    );

    const payload = await buildTradePayload(rows[0], req.user.id);
    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/trades/:id/status
// Updates trade status. Authorization rules:
//   - 'accepted' / 'rejected' → only the RECEIVER (or admin) can decide.
//   - 'cancelled'             → only the SENDER (or admin) can cancel.
// ─────────────────────────────────────────────────────────────────────────────
async function updateTradeStatus(req, res, next) {
  try {
    const tradeId = Number(req.params.id);
    const { status, rejection_reason } = req.body;

    const allowed = ['accepted', 'rejected', 'cancelled', 'completed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }

    const trades = await query(
      'SELECT * FROM Trades WHERE id_trade = ? LIMIT 1',
      [tradeId]
    );
    if (trades.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = trades[0];
    const isAdmin    = req.user.role === 'admin';
    const isReceiver = trade.id_receiver === req.user.id;
    const isSender   = trade.id_sender   === req.user.id;

    // Immutable terminal states
    if (['completed', 'cancelled', 'rejected'].includes(trade.status)) {
      return res.status(400).json({
        error: `Cannot update a trade that is already '${trade.status}'`,
      });
    }

    // ── Permission matrix ────────────────────────────────────────────────────
    if (status === 'accepted' || status === 'rejected') {
      if (!isReceiver && !isAdmin) {
        return res.status(403).json({
          error: 'Only the trade receiver can accept or reject a trade request',
        });
      }
    }
    if (status === 'cancelled') {
      if (!isSender && !isAdmin) {
        return res.status(403).json({
          error: 'Only the trade sender can cancel their own trade request',
        });
      }
    }
    if (status === 'completed') {
      if (!isReceiver && !isAdmin) {
        return res.status(403).json({
          error: 'Only the trade receiver can mark a trade as completed',
        });
      }
    }

    // Store rejection reason in the message field (reuses existing column)
    const messageUpdate =
      status === 'rejected' && rejection_reason
        ? rejection_reason
        : trade.message;

    await query(
      'UPDATE Trades SET status = ?, message = ? WHERE id_trade = ?',
      [status, messageUpdate, tradeId]
    );

    const updatedRows = await query(
      `${TRADE_SELECT} WHERE t.id_trade = ? LIMIT 1`,
      [tradeId]
    );

    const payload = await buildTradePayload(updatedRows[0], req.user.id);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

// Keep old PATCH handler as an alias for backward-compatibility
const updateTrade = updateTradeStatus;

module.exports = {
  getTrades,
  createTrade,
  updateTradeStatus,
  updateTrade, // backward-compat alias
};
