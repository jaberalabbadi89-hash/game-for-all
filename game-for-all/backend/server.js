const express = require('express');
const http    = require('http');
const cors    = require('cors');
const helmet  = require('helmet');
const dotenv  = require('dotenv');
const { Server } = require('socket.io');

dotenv.config({ override: true });

const authRoutes      = require('./routes/auth.routes');
const gameRoutes      = require('./routes/games.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const messagesRoutes  = require('./routes/messages.routes');
const ratingsRoutes   = require('./routes/ratings.routes');
const tradeRoutes     = require('./routes/trades.routes');
const { connectDB, query }   = require('./config/db');
const { sanitizeUser } = require('./utils/formatters');

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.io ───────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://game-for-all-steel.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in all controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Each user joins their own private room identified by userId.
  // The frontend emits this event right after connecting.
  socket.on('join_room', (userId) => {
    if (!userId) return;
    const room = `user_${userId}`;
    socket.join(room);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
  });

  // Real-time Chat send_message handler
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, messageText } = data;
      if (!senderId || !receiverId || !messageText) {
        console.warn('[Socket.io] send_message: missing fields', data);
        return;
      }

      // 1. Insert into database
      const result = await query(
        'INSERT INTO Messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
        [Number(senderId), Number(receiverId), messageText]
      );

      // 2. Fetch sender and receiver user details to format the savedMessage correctly
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

      if (rows.length === 0) return;
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

      // 3. Emit receive_message to sender's and receiver's rooms
      io.to(`user_${senderId}`).emit('receive_message', savedMessage);
      io.to(`user_${receiverId}`).emit('receive_message', savedMessage);
      console.log(`[Socket.io] Message ${savedMessage.id} sent from user_${senderId} to user_${receiverId}`);
    } catch (err) {
      console.error('[Socket.io] Error in send_message listener:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ── Express Middleware ───────────────────────────────────────────────────────
let dbStatus = {
  connected: false,
  message: 'Database connection not tested yet',
};

app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Game For All API',
    status: 'running',
    database: dbStatus,
    architecture: '3-tier',
    stack: ['Node.js', 'Express', 'Socket.io', 'JWT', 'Helmet', 'MySQL'],
    realtime: 'Socket.io Private Rooms',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), database: dbStatus });
});

app.use('/api/auth',      authRoutes);
app.use('/api/games',     gameRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/messages',  messagesRoutes);
app.use('/api/ratings',   ratingsRoutes);
app.use('/api/trades',    tradeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    dbStatus = await connectDB();
  } catch (error) {
    dbStatus = { connected: false, message: error.message };
    console.warn('MySQL unavailable, starting API in degraded mode:', error.message);
  }

  httpServer.listen(PORT, () => {
    console.log(`Game For All API running on http://localhost:${PORT}`);
    console.log(`Socket.io listening on same port (Private Rooms enabled)`);
  });
}

startServer();


