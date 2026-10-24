const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const internalAuth = require('../middleware/internalAuth');
const {
  createCoupon,
  validateCoupon,
  useCoupon,
  getSellerCoupons,
  getAvailableCoupons,
  getAllCoupons,
  toggleCouponStatus
} = require('../controllers/couponController');

// Public routes
router.post('/validate', validateCoupon);

// Private routes
router.post('/', auth, createCoupon);
router.get('/seller', auth, getSellerCoupons);
router.get('/available', auth, getAvailableCoupons);
router.patch('/:id/toggle', auth, toggleCouponStatus);

// Internal routes
router.patch('/:id/use', internalAuth, useCoupon);

// Admin routes
router.get('/admin/all', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, getAllCoupons);

module.exports = router;