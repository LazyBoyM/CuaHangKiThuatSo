const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const internalAuth = require('../middleware/internalAuth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  approveProduct,
  getAllProductsForAdmin,
  incrementSales,
  getProductsByIds,
  toggleWishlist,
  checkWishlist,
  getWishlist,
  removeFromWishlistInternal
} = require('../controllers/productController');

// ==================== PUBLIC ROUTES ====================
router.get('/', getProducts);

// ==================== SPECIFIC ROUTES (PHẢI ĐẶT TRƯỚC /:id) ====================
router.get('/admin/all', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}, getAllProductsForAdmin);

router.get('/my/list', auth, getMyProducts);

router.get('/wishlist', auth, getWishlist);  

router.post('/by-ids', internalAuth, getProductsByIds);
router.post('/internal/remove-wishlist', internalAuth, removeFromWishlistInternal);

// ==================== DYNAMIC ROUTES (/:id) ====================
router.get('/:id', getProductById);
router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);
router.put('/:id/approve', auth, approveProduct);
router.patch('/:id/increment-sales', internalAuth, incrementSales);

// Wishlist routes với :id
router.post('/:id/wishlist', auth, toggleWishlist);
router.get('/:id/wishlist', auth, checkWishlist);

module.exports = router;