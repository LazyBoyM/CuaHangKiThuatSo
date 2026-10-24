const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createInternalNotification
} = require('../controllers/notificationController');

// Internal route for other microservices
router.post('/internal', createInternalNotification);

// User routes
router.get('/', auth, getNotifications);
router.put('/read-all', auth, markAllAsRead);
router.put('/:id/read', auth, markAsRead);

module.exports = router;
