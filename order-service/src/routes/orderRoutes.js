const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const internalAuth = require('../middleware/internalAuth');
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getDownloadUrl,
  getSellerStats,
  getAdminRevenueStats,
  getAdminAnalytics,
  checkPurchased,
  getOrderById
} = require('../controllers/orderController');

// Internal route
router.post('/', internalAuth, createOrder);

// Private routes
router.get('/my', auth, getMyOrders);
router.get('/seller', auth, getSellerOrders);
router.get('/seller/stats', auth, getSellerStats);
router.get('/check/:productId', auth, checkPurchased);

// Admin routes
router.get('/admin/stats', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}, getAdminRevenueStats);

router.get('/admin/analytics', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}, getAdminAnalytics);

// Dynamic routes (đặt sau cùng)
router.get('/:id', auth, getOrderById);
router.get('/:id/download', auth, getDownloadUrl);

module.exports = router;