const Coupon = require('../models/Coupon');
const axios = require('axios');
const mongoose = require('mongoose');

// @desc    Create coupon (seller hoặc admin)
// @route   POST /api/coupons
// @access  Private (seller/admin)
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, maxUses, expiresAt, type, productIds } = req.body;
    const user = req.user;
    
    let couponType = 'seller';
    let sellerId = null;
    
    if (user.role === 'admin') {
      couponType = type || 'platform';
      if (couponType === 'seller') {
        // Nếu admin tạo mã cho shop, ưu tiên sellerId trong body, nếu không có thì lấy chính ID admin
        sellerId = req.body.sellerId || user._id || user.id;
      }
    } else {
      couponType = 'seller';
      sellerId = user._id || user.id;
    }
    
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent),
      maxUses: maxUses || 1,
      expiresAt: new Date(expiresAt),
      type: couponType,
      seller: sellerId,
      productIds: productIds || [],
    });
    
    res.status(201).json(coupon);
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Validate and apply coupon
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
  try {
    const { code, productId } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Coupon is inactive' });
    }
    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Coupon expired' });
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    
    // Kiểm tra sản phẩm có áp dụng được không
    if (coupon.type === 'seller') {
      try {
        const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${productId}`, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        const product = productRes.data;
        const sellerId = product.seller?._id || product.seller;
        
        if (sellerId.toString() !== coupon.seller.toString()) {
          return res.status(400).json({ message: 'Coupon not applicable to this product' });
        }
        
        if (coupon.productIds && coupon.productIds.length > 0) {
          if (!coupon.productIds.includes(productId)) {
            return res.status(400).json({ message: 'Coupon not applicable to this product' });
          }
        }
      } catch (err) {
        return res.status(400).json({ message: 'Product not found' });
      }
    }
    
    res.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      couponId: coupon._id,
      type: coupon.type
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark coupon as used (internal)
// @route   PATCH /api/coupons/:id/use
// @access  Internal
exports.useCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    coupon.usedCount += 1;
    if (coupon.usedCount >= coupon.maxUses) {
      coupon.isActive = false;
    }
    await coupon.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get coupons created by seller
// @route   GET /api/coupons/seller
// @access  Private (seller)
exports.getSellerCoupons = async (req, res) => {
  try {
    const sellerId = req.user._id || req.user.id;
    // Chỉ lấy mã của chính shop này và là loại 'seller'
    const coupons = await Coupon.find({ 
      seller: sellerId,
      type: 'seller' 
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get available coupons for buyer (theo sản phẩm)
// @route   GET /api/coupons/available
// @access  Private
exports.getAvailableCoupons = async (req, res) => {
  try {
    const { productId } = req.query;
    const now = new Date();
    
    // Mã của sàn (platform)
    const platformCoupons = await Coupon.find({
      type: 'platform',
      isActive: true,
      expiresAt: { $gt: now },
      $expr: { $lt: ['$usedCount', '$maxUses'] }
    }).select('code discountPercent type');
    
    let sellerCoupons = [];
    
    if (productId) {
      try {
        const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${productId}`, { 
          timeout: 5000,
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        const product = productRes.data;
        const sellerId = product.seller?._id || product.seller;
        
        sellerCoupons = await Coupon.find({
          type: 'seller',
          seller: new mongoose.Types.ObjectId(sellerId),
          isActive: true,
          expiresAt: { $gt: now },
          $expr: { $lt: ['$usedCount', '$maxUses'] },
          $or: [
            { productIds: { $size: 0 } },
            { productIds: new mongoose.Types.ObjectId(productId) }
          ]
        }).select('code discountPercent type');
      } catch (err) {
        console.error('Failed to fetch product:', err.message);
      }
    }
    
    const allCoupons = [...platformCoupons, ...sellerCoupons];
    res.json(allCoupons);
  } catch (err) {
    console.error('Get available coupons error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all coupons (admin only)
// @route   GET /api/coupons/admin/all
// @access  Private/Admin
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ type: 'platform' }).sort({ createdAt: -1 });
    // Bỏ populate vì không có model User
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Toggle coupon status (admin/seller)
// @route   PATCH /api/coupons/:id/toggle
// @access  Private
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    const userId = req.user._id || req.user.id;
    
    // Kiểm tra quyền
    if (req.user.role !== 'admin' && coupon.seller?.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.json({ message: 'Coupon status updated', isActive: coupon.isActive });
  } catch (err) {
    console.error('Toggle coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};