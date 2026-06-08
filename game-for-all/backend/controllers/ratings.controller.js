const { query } = require('../config/db');
const { sanitizeUser } = require('../utils/formatters');

async function getRatings(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          r.id_rating,
          r.id_voter,
          r.id_reviewed,
          r.stars,
          r.comment,
          r.created_at,
          voter.username AS voter_username,
          voter.email AS voter_email,
          voter.avatar AS voter_avatar,
          voter.role AS voter_role,
          voter.created_at AS voter_created_at,
          reviewed.username AS reviewed_username,
          reviewed.email AS reviewed_email,
          reviewed.avatar AS reviewed_avatar,
          reviewed.role AS reviewed_role,
          reviewed.created_at AS reviewed_created_at
        FROM Ratings r
        INNER JOIN Users voter ON voter.id_user = r.id_voter
        INNER JOIN Users reviewed ON reviewed.id_user = r.id_reviewed
        WHERE r.id_voter = ? OR r.id_reviewed = ?
        ORDER BY r.created_at DESC
      `,
      [req.user.id, req.user.id]
    );

    const ratings = rows.map((row) => ({
      id: row.id_rating,
      voterId: row.id_voter,
      reviewedId: row.id_reviewed,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.created_at,
      voter: sanitizeUser({
        id_user: row.id_voter,
        username: row.voter_username,
        email: row.voter_email,
        avatar: row.voter_avatar,
        role: row.voter_role,
        created_at: row.voter_created_at,
      }),
      reviewed: sanitizeUser({
        id_user: row.id_reviewed,
        username: row.reviewed_username,
        email: row.reviewed_email,
        avatar: row.reviewed_avatar,
        role: row.reviewed_role,
        created_at: row.reviewed_created_at,
      }),
    }));

    return res.json(ratings);
  } catch (error) {
    return next(error);
  }
}

async function createOrUpdateRating(req, res, next) {
  try {
    const { reviewedId, stars, comment } = req.body;

    if (!reviewedId || !stars) {
      return res.status(400).json({ error: 'reviewedId and stars are required' });
    }

    const ratingValue = Number(stars);
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'stars must be between 1 and 5' });
    }

    const users = await query('SELECT id_user FROM Users WHERE id_user = ? LIMIT 1', [Number(reviewedId)]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Reviewed user not found' });
    }

    await query(
      `
        INSERT INTO Ratings (id_voter, id_reviewed, stars, comment)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          stars = VALUES(stars),
          comment = VALUES(comment),
          created_at = CURRENT_TIMESTAMP
      `,
      [req.user.id, Number(reviewedId), ratingValue, comment || null]
    );

    const rows = await query(
      `
        SELECT
          r.id_rating,
          r.id_voter,
          r.id_reviewed,
          r.stars,
          r.comment,
          r.created_at,
          voter.username AS voter_username,
          voter.email AS voter_email,
          voter.avatar AS voter_avatar,
          voter.role AS voter_role,
          voter.created_at AS voter_created_at,
          reviewed.username AS reviewed_username,
          reviewed.email AS reviewed_email,
          reviewed.avatar AS reviewed_avatar,
          reviewed.role AS reviewed_role,
          reviewed.created_at AS reviewed_created_at
        FROM Ratings r
        INNER JOIN Users voter ON voter.id_user = r.id_voter
        INNER JOIN Users reviewed ON reviewed.id_user = r.id_reviewed
        WHERE r.id_voter = ? AND r.id_reviewed = ?
        LIMIT 1
      `,
      [req.user.id, Number(reviewedId)]
    );

    const row = rows[0];
    return res.status(201).json({
      id: row.id_rating,
      voterId: row.id_voter,
      reviewedId: row.id_reviewed,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.created_at,
      voter: sanitizeUser({
        id_user: row.id_voter,
        username: row.voter_username,
        email: row.voter_email,
        avatar: row.voter_avatar,
        role: row.voter_role,
        created_at: row.voter_created_at,
      }),
      reviewed: sanitizeUser({
        id_user: row.id_reviewed,
        username: row.reviewed_username,
        email: row.reviewed_email,
        avatar: row.reviewed_avatar,
        role: row.reviewed_role,
        created_at: row.reviewed_created_at,
      }),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getRatings,
  createOrUpdateRating,
};
