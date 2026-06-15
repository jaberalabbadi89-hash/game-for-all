const { query } = require('../config/db');
const { sanitizeUser } = require('../utils/formatters');

async function getMessages(req, res, next) {
  console.log('1. Hit GET /api/messages');
  try {
    console.log('2. Current User:', req.user);

    // Always use the authenticated user from JWT.
    const authenticatedUserId = req.user.id;
    console.log('3. SQL Query Executed — searching messages for userId:', authenticatedUserId);

    const rows = await query(
      `
        SELECT
          m.id_message,
          m.sender_id,
          m.receiver_id,
          m.message_text,
          m.sent_at,
          sender.username AS sender_username,
          sender.email AS sender_email,
          sender.avatar AS sender_avatar,
          sender.role AS sender_role,
          sender.created_at AS sender_created_at,
          receiver.username AS receiver_username,
          receiver.email AS receiver_email,
          receiver.avatar AS receiver_avatar,
          receiver.role AS receiver_role,
          receiver.created_at AS receiver_created_at
        FROM Messages m
        INNER JOIN Users sender ON sender.id_user = m.sender_id
        INNER JOIN Users receiver ON receiver.id_user = m.receiver_id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.sent_at DESC
      `,
      [authenticatedUserId, authenticatedUserId]
    );
    console.log('4. Rows returned from DB:', rows.length);

    const messages = rows.map((row) => ({
      id: row.id_message,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      messageText: row.message_text,
      sentAt: row.sent_at,
      sender: sanitizeUser({
        id_user: row.sender_id,
        username: row.sender_username,
        email: row.sender_email,
        avatar: row.sender_avatar,
        role: row.sender_role,
        created_at: row.sender_created_at,
      }),
      receiver: sanitizeUser({
        id_user: row.receiver_id,
        username: row.receiver_username,
        email: row.receiver_email,
        avatar: row.receiver_avatar,
        role: row.receiver_role,
        created_at: row.receiver_created_at,
      }),
    }));

    return res.json(messages);
  } catch (error) {
    console.error('[DEBUG] getMessages ERROR:', error.message, '\nStack:', error.stack);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}

async function sendMessage(req, res, next) {
  try {
    const senderId = Number(req.body.sender_id ?? req.body.senderId ?? req.user.id);
    const receiverId = Number(req.body.receiver_id ?? req.body.receiverId);
    const messageText = req.body.message ?? req.body.messageText;

    if (!receiverId || !messageText) {
      return res.status(400).json({
        error: 'sender_id, receiver_id and message are required',
      });
    }

    if (senderId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: sender_id must match the authenticated user',
      });
    }

    if (!Number.isInteger(receiverId)) {
      return res.status(400).json({ error: 'receiver_id must be a valid number' });
    }

    const receivers = await query('SELECT id_user FROM Users WHERE id_user = ? LIMIT 1', [Number(receiverId)]);
    if (receivers.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const result = await query(
      'INSERT INTO Messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
      [senderId, receiverId, messageText]
    );

    const rows = await query(
      `
        SELECT
          m.id_message,
          m.sender_id,
          m.receiver_id,
          m.message_text,
          m.sent_at,
          sender.username AS sender_username,
          sender.email AS sender_email,
          sender.avatar AS sender_avatar,
          sender.role AS sender_role,
          sender.created_at AS sender_created_at,
          receiver.username AS receiver_username,
          receiver.email AS receiver_email,
          receiver.avatar AS receiver_avatar,
          receiver.role AS receiver_role,
          receiver.created_at AS receiver_created_at
        FROM Messages m
        INNER JOIN Users sender ON sender.id_user = m.sender_id
        INNER JOIN Users receiver ON receiver.id_user = m.receiver_id
        WHERE m.id_message = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    const row = rows[0];
    const savedMessage = {
      id: row.id_message,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      messageText: row.message_text,
      sentAt: row.sent_at,
      sender: sanitizeUser({
        id_user: row.sender_id,
        username: row.sender_username,
        email: row.sender_email,
        avatar: row.sender_avatar,
        role: row.sender_role,
        created_at: row.sender_created_at,
      }),
      receiver: sanitizeUser({
        id_user: row.receiver_id,
        username: row.receiver_username,
        email: row.receiver_email,
        avatar: row.receiver_avatar,
        role: row.receiver_role,
        created_at: row.receiver_created_at,
      }),
    };

    // ── Real-Time Delivery (Socket.io Private Room) ──────────────────────────
    // Step 1: DB save was confirmed above.
    // Step 2: Emit ONLY to receiver's private room — no broadcast to everyone.
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('receive_message', savedMessage);
      console.log(`[Socket.io] Message emitted to room: user_${receiverId}`);
    }

    return res.status(201).json(savedMessage);

  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMessages,
  sendMessage,
};
