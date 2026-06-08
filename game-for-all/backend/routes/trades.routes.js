const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getTrades, createTrade, updateTrade } = require('../controllers/trade.controller');

const router = express.Router();

router.get('/', authMiddleware, getTrades);
router.get('/my-trades', authMiddleware, getTrades);
router.post('/', authMiddleware, createTrade);
router.patch('/:id', authMiddleware, updateTrade);

module.exports = router;
