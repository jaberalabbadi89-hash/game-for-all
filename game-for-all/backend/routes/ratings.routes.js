const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getRatings, createOrUpdateRating } = require('../controllers/ratings.controller');

const router = express.Router();

router.get('/', authMiddleware, getRatings);
router.post('/', authMiddleware, createOrUpdateRating);

module.exports = router;
