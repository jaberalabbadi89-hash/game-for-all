const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favorites.controller');

const router = express.Router();

router.get('/', authMiddleware, getFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/:gameId', authMiddleware, removeFavorite);

module.exports = router;
