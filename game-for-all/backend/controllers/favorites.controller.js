const { query } = require('../config/db');
const { mapGameRow, sanitizeUser } = require('../utils/formatters');

async function getFavorites(req, res, next) {
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
          u.created_at AS owner_created_at,
          f.created_at AS favorite_created_at
        FROM Favorites f
        INNER JOIN Games g ON g.id_game = f.id_game
        INNER JOIN Users u ON u.id_user = g.id_owner
        WHERE f.id_user = ?
        ORDER BY f.created_at DESC
      `,
      [req.user.id]
    );

    const favorites = rows.map((row) => {
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
        favoriteCreatedAt: row.favorite_created_at,
      };
    });

    return res.json(favorites);
  } catch (error) {
    return next(error);
  }
}

async function addFavorite(req, res, next) {
  try {
    const gameId = Number(req.body.gameId);

    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    const games = await query('SELECT id_game FROM Games WHERE id_game = ? LIMIT 1', [gameId]);
    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    await query(
      'INSERT IGNORE INTO Favorites (id_user, id_game) VALUES (?, ?)',
      [req.user.id, gameId]
    );

    return res.status(201).json({ message: 'Favorite saved' });
  } catch (error) {
    return next(error);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const gameId = Number(req.params.gameId);

    await query('DELETE FROM Favorites WHERE id_user = ? AND id_game = ?', [req.user.id, gameId]);

    return res.json({ message: 'Favorite removed' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
