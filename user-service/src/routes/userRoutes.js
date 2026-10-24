const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  getAllUsers,
  toggleBanUser,
  deleteUser,
  getUserStats,
  getShopInfo,
  getUserDisplay,
  getUsersByIds
} = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/shop/:sellerId', getShopInfo);
router.get('/:id/display', getUserDisplay);
router.post('/by-ids', getUserDisplay); // Fallback or separate
router.post('/internal/by-ids', getUsersByIds); // New internal route

// Private routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// Admin routes
router.get('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, getAllUsers);

router.put('/:id/ban', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, toggleBanUser);

router.delete('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, deleteUser);

router.get('/admin/stats', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, getUserStats);

module.exports = router;