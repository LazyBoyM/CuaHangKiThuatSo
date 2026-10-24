const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // If null, it means it's for all admins
  },
  role: {
    type: String, // 'admin' or 'user'
    default: 'user'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // 'info', 'success', 'warning'
  relatedId: { type: String, default: '' }, // Could be productId, orderId, etc.
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
