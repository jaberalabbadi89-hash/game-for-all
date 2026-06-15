const { query } = require('../config/db');
const { games: mockGames, users: mockUsers } = require('../data/mockData');
const { mapGameRow, sanitizeUser } = require('../utils/formatters');

function buildMockGamePayload(game) {
  const owner = mockUsers.find((user) => user.id === game.ownerId) || null;

  return {
    id: game.id,
    id_owner: game.ownerId,
    title: game.title,
    description: game.description,
    platform: game.platform,
    genre: game.genre,
    condition: game.condition,
    state: game.condition,
    image: game.image,
    createdAt: game.createdAt,
    owner: owner
      ? sanitizeUser({
          id_user: owner.id,
          username: owner.username,
          email: owner.email,
          avatar: owner.avatar,
          role: owner.role,
          created_at: game.createdAt,
        })
      : null,
  };
}

async function getGames(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        ORDER BY g.created_at DESC
      `
    );

    const enrichedGames = rows.map((row) => {
      const game = mapGameRow(row);
      const owner = sanitizeUser({
        id_user: row.owner_id_user,
        username: row.owner_username,
        email: row.owner_email,
        avatar: row.owner_avatar,
        role: row.owner_role,
        created_at: row.owner_created_at,
      });

      return {
        ...game,
        owner,
      };
    });

    return res.json(enrichedGames);
  } catch (error) {
    const fallbackGames = mockGames.map(buildMockGamePayload);
    return res.json(fallbackGames);
  }
}

async function getGameById(req, res, next) {
  const gameId = Number(req.params.id);

  try {
    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_game = ?
        LIMIT 1
      `,
      [gameId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const row = rows[0];
    const game = mapGameRow(row);
    const owner = sanitizeUser({
      id_user: row.owner_id_user,
      username: row.owner_username,
      email: row.owner_email,
      avatar: row.owner_avatar,
      role: row.owner_role,
      created_at: row.owner_created_at,
    });

    return res.json({
      ...game,
      owner,
    });
  } catch (error) {
    const game = mockGames.find((item) => item.id === gameId);

    if (!game) {
      return next(error);
    }

    return res.json(buildMockGamePayload(game));
  }
}

async function createGame(req, res, next) {
  try {
    const { title, platform, genre, condition, state, image, description } = req.body;

    if (!title || !platform || !genre) {
      return res.status(400).json({ error: 'title, platform and genre are required' });
    }

    const gameState = state || condition || 'used';
    const result = await query(
      `
        INSERT INTO Games (title, description, platform, genre, state, image, id_owner)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || '',
        platform,
        genre,
        gameState,
        image || null,
        req.user.id,
      ]
    );

    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_game = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    const row = rows[0];
    const game = mapGameRow(row);
    const owner = sanitizeUser({
      id_user: row.owner_id_user,
      username: row.owner_username,
      email: row.owner_email,
      avatar: row.owner_avatar,
      role: row.owner_role,
      created_at: row.owner_created_at,
    });

    return res.status(201).json({
      ...game,
      owner,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateGame(req, res, next) {
  try {
    const gameId = Number(req.params.id);
    const { title, platform, genre, condition, state, image, description } = req.body;

    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_game = ?
        LIMIT 1
      `,
      [gameId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const existingGame = rows[0];
    const canEdit =
      req.user.role === 'admin' || Number(existingGame.id_owner) === Number(req.user.id);

    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const nextTitle = title ?? existingGame.title;
    const nextPlatform = platform ?? existingGame.platform;
    const nextGenre = genre ?? existingGame.genre;
    const nextDescription = description ?? existingGame.description ?? '';
    const nextState = state || condition || existingGame.state;
    const nextImage = image ?? existingGame.image;

    if (!nextTitle || !nextPlatform || !nextGenre) {
      return res.status(400).json({ error: 'title, platform and genre are required' });
    }

    await query(
      `
        UPDATE Games
        SET title = ?, description = ?, platform = ?, genre = ?, state = ?, image = ?
        WHERE id_game = ?
      `,
      [
        nextTitle,
        nextDescription,
        nextPlatform,
        nextGenre,
        nextState,
        nextImage || null,
        gameId,
      ]
    );

    const updatedRows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_game = ?
        LIMIT 1
      `,
      [gameId]
    );

    const row = updatedRows[0];
    const game = mapGameRow(row);
    const owner = sanitizeUser({
      id_user: row.owner_id_user,
      username: row.owner_username,
      email: row.owner_email,
      avatar: row.owner_avatar,
      role: row.owner_role,
      created_at: row.owner_created_at,
    });

    return res.json({
      ...game,
      owner,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteGame(req, res, next) {
  try {
    const gameId = Number(req.params.id);

    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_game = ?
        LIMIT 1
      `,
      [gameId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const existingGame = rows[0];
    const canDelete =
      req.user.role === 'admin' || Number(existingGame.id_owner) === Number(req.user.id);

    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await query('DELETE FROM Games WHERE id_game = ?', [gameId]);

    return res.json({
      message: 'Game deleted successfully',
      deletedGame: {
        id: gameId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyGames(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await query(
      `
        SELECT
          g.*,
          u.id_user AS owner_id_user,
          u.username AS owner_username,
          u.email AS owner_email,
          u.avatar AS owner_avatar,
          u.role AS owner_role,
          u.created_at AS owner_created_at
        FROM Games g
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE g.id_owner = ?
        ORDER BY g.created_at DESC
      `,
      [userId]
    );

    const enrichedGames = rows.map((row) => {
      const game = mapGameRow(row);
      const owner = sanitizeUser({
        id_user: row.owner_id_user,
        username: row.owner_username,
        email: row.owner_email,
        avatar: row.owner_avatar,
        role: row.owner_role,
        created_at: row.owner_created_at,
      });
      return { ...game, owner };
    });

    return res.json(enrichedGames);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGames,
  getGameById,
  getMyGames,
  createGame,
  updateGame,
  deleteGame,
};
