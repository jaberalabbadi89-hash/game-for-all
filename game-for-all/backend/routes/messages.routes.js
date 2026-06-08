const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getMessages, sendMessage } = require('../controllers/messages.controller');

const router = express.Router();

router.get('/', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

module.exports = router;
