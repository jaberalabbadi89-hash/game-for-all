const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/games.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const messagesRoutes = require('./routes/messages.routes');
const ratingsRoutes = require('./routes/ratings.routes');
const tradeRoutes = require('./routes/trades.routes');
const { connectDB } = require('./config/db');

const app = express();
let dbStatus = {
  connected: false,
  message: 'Database connection not tested yet',
};

app.use(helmet());
app.use(cors({
  origin: ['https://game-for-all-steel.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Game For All API',
    status: 'running',
    database: dbStatus,
    architecture: '3-tier',
    stack: ['Node.js', 'Express', 'JWT', 'Helmet', 'MySQL'],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), database: dbStatus });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/trades', tradeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    dbStatus = await connectDB();
  } catch (error) {
    dbStatus = {
      connected: false,
      message: error.message,
    };
    console.warn('MySQL unavailable, starting API in degraded mode:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Game For All API running on http://localhost:${PORT}`);
  });

  // Forzar reinicio de nodemon para leer el .env actualizado
  // Reinicio número 2
}

startServer();
