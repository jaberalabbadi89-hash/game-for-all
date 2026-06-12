const { query } = require('../config/db');
const { mapTradeRow, sanitizeUser } = require('../utils/formatters');

async function buildTradePayload(row) {
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

  return {
    ...trade,
    requester,
    owner,
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

async function getTrades(req, res, next) {
  try {
    const trades = await query(
      `
        SELECT
          t.*,
          requester.id_user AS requester_id_user,
          requester.username AS requester_username,
          requester.email AS requester_email,
          requester.avatar AS requester_avatar,
          requester.role AS requester_role,
          requester.created_at AS requester_created_at,
          owner.id_user AS owner_id_user,
          owner.username AS owner_username,
          owner.email AS owner_email,
          owner.avatar AS owner_avatar,
          owner.role AS owner_role,
          owner.created_at AS owner_created_at
          , offered.id_game AS offered_game_id,
          offered.title AS offered_game_title,
          offered.platform AS offered_game_platform,
          offered.genre AS offered_game_genre,
          requested.id_game AS requested_game_id,
          requested.title AS requested_game_title,
          requested.platform AS requested_game_platform,
          requested.genre AS requested_game_genre
        FROM Trades t
        INNER JOIN Users requester ON requester.id_user = t.id_sender
        INNER JOIN Users owner ON owner.id_user = t.id_receiver
        INNER JOIN Games offered ON offered.id_game = t.id_game_offered
        INNER JOIN Games requested ON requested.id_game = t.id_game_requested
        WHERE  t.id_sender = ? OR t.id_receiver = ?
        ORDER BY t.created_at DESC
      `,
      [ req.user.id, req.user.id]
    );

    const payload = await Promise.all(trades.map((row) => buildTradePayload(row)));
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

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
      `
        INSERT INTO Trades (id_sender, id_receiver, id_game_offered, id_game_requested, status, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        requestedGame[0].id_owner,
        offeredGame[0].id_game,
        requestedGame[0].id_game,
        'pending',
        message || '',
      ]
    );

    const rows = await query(
      `
        SELECT
          t.*,
          requester.id_user AS requester_id_user,
          requester.username AS requester_username,
          requester.email AS requester_email,
          requester.avatar AS requester_avatar,
          requester.role AS requester_role,
          requester.created_at AS requester_created_at,
          owner.id_user AS owner_id_user,
          owner.username AS owner_username,
          owner.email AS owner_email,
          owner.avatar AS owner_avatar,
          owner.role AS owner_role,
          owner.created_at AS owner_created_at
          , offered.id_game AS offered_game_id,
          offered.title AS offered_game_title,
          offered.platform AS offered_game_platform,
          offered.genre AS offered_game_genre,
          requested.id_game AS requested_game_id,
          requested.title AS requested_game_title,
          requested.platform AS requested_game_platform,
          requested.genre AS requested_game_genre
        FROM Trades t
        INNER JOIN Users requester ON requester.id_user = t.id_sender
        INNER JOIN Users owner ON owner.id_user = t.id_receiver
        INNER JOIN Games offered ON offered.id_game = t.id_game_offered
        INNER JOIN Games requested ON requested.id_game = t.id_game_requested
        WHERE t.id_trade = ?
        LIMIT 1
      `,
      [tradeResult.insertId]
    );

    const payload = await buildTradePayload(rows[0]);
    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
}

async function updateTrade(req, res, next) {
  try {
    const tradeId = Number(req.params.id);
    const { status } = req.body;

    const trades = await query('SELECT * FROM Trades WHERE id_trade = ? LIMIT 1', [tradeId]);

    if (trades.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = trades[0];
    const canEdit =
      req.user.role === 'admin' ||
      trade.id_receiver === req.user.id ||
      trade.id_sender === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (trade.status === 'completed' || trade.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot update a completed or cancelled trade' });
    }

    const allowedStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status) {
      await query('UPDATE Trades SET status = ? WHERE id_trade = ?', [status, tradeId]);
    }

    const updatedRows = await query(
      `
        SELECT
          t.*,
          requester.id_user AS requester_id_user,
          requester.username AS requester_username,
          requester.email AS requester_email,
          requester.avatar AS requester_avatar,
          requester.role AS requester_role,
          requester.created_at AS requester_created_at,
          owner.id_user AS owner_id_user,
          owner.username AS owner_username,
          owner.email AS owner_email,
          owner.avatar AS owner_avatar,
          owner.role AS owner_role,
          owner.created_at AS owner_created_at
          , offered.id_game AS offered_game_id,
          offered.title AS offered_game_title,
          offered.platform AS offered_game_platform,
          offered.genre AS offered_game_genre,
          requested.id_game AS requested_game_id,
          requested.title AS requested_game_title,
          requested.platform AS requested_game_platform,
          requested.genre AS requested_game_genre
        FROM Trades t
        INNER JOIN Users requester ON requester.id_user = t.id_sender
        INNER JOIN Users owner ON owner.id_user = t.id_receiver
        INNER JOIN Games offered ON offered.id_game = t.id_game_offered
        INNER JOIN Games requested ON requested.id_game = t.id_game_requested
        WHERE t.id_trade = ?
        LIMIT 1
      `,
      [tradeId]
    );

    const payload = await buildTradePayload(updatedRows[0]);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTrades,
  createTrade,
  updateTrade,
};
