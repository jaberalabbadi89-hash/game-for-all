const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  getTrades,
  createTrade,
  updateTradeStatus,
  updateTrade, // backward-compat alias
} = require('../controllers/trade.controller');

const router = express.Router();

router.get('/',           authMiddleware, getTrades);
router.get('/my-trades',  authMiddleware, getTrades);
router.post('/',          authMiddleware, createTrade);

// Primary semantic route (Backend-Driven Authorization)
router.put('/:id/status', authMiddleware, updateTradeStatus);

// Backward-compatible PATCH alias
router.patch('/:id',      authMiddleware, updateTrade);

module.exports = router;
