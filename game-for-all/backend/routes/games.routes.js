const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const {
  getGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
} = require('../controllers/game.controller');

const router = express.Router();

router.get('/', getGames);
router.get('/:id', getGameById);
router.post('/', authMiddleware, createGame);
router.patch('/:id', authMiddleware, updateGame);
router.delete('/:id', authMiddleware, adminMiddleware, deleteGame);

module.exports = router;
