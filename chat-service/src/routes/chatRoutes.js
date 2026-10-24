const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/conversations', auth, chatController.getConversations);
router.get('/messages/:receiverId', auth, chatController.getMessages);

module.exports = router;
