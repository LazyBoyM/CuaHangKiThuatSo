const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const axios = require('axios');
const mongoose = require('mongoose');
const sendNotification = require('../utils/sendNotification');

// Helper function to populate seller info from user-service
const populateSellers = async (products) => {
  if (!products) return products;
  
  const isArray = Array.isArray(products);
  let productsArray = isArray ? products : [products];
  
  // Filter out nulls and get unique seller IDs
  const sellerIds = [...new Set(productsArray.filter(p => p && p.seller).map(p => p.seller.toString()))];
  
  if (sellerIds.length === 0) return products;
  
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5001';
    const internalSecret = process.env.INTERNAL_SECRET || 'internal_service_secret_2024';
    
    let res;
    try {
      res = await axios.post(`${userServiceUrl}/api/users/internal/by-ids`, {
        ids: sellerIds
      }, {
        headers: { 'x-internal-secret': internalSecret },
        timeout: 2000
      });
    } catch (err) {
      // Fallback to localhost if service name is not reachable (for local dev without docker)
      res = await axios.post(`http://localhost:5001/api/users/internal/by-ids`, {
        ids: sellerIds
      }, {
        headers: { 'x-internal-secret': internalSecret },
        timeout: 2000
      });
    }
    
    const sellersMap = res.data.reduce((acc, seller) => {
      acc[seller._id.toString()] = seller;
      return acc;
    }, {});
    
    const results = productsArray.map(p => {
      if (!p) return p;
      const productObj = p.toObject ? p.toObject() : JSON.parse(JSON.stringify(p));
      
      const sId = productObj.seller ? (productObj.seller._id || productObj.seller).toString() : null;
      
      if (sId) {
        productObj.seller = sellersMap[sId] || { 
          _id: sId, 
          name: `Người bán #${sId.slice(-5)}`,
          avatar: '' 
        };
      } else {
        productObj.seller = { name: 'N/A' };
      }
      return productObj;
    });
    
    return isArray ? results : results[0];
  } catch (err) {
    console.error('Populate sellers error:', err.message);
    return isArray ? productsArray.map(p => p.toObject ? p.toObject() : p) : (products.toObject ? products.toObject() : products);
  }
};

// ==================== PUBLIC APIs ====================

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, seller, page = 1, limit = 10 } = req.query;
    
    const filter = { isPublished: true, isApproved: true };
    if (category) filter.category = category;
    if (seller) filter.seller = seller;
    
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    
    const populatedProducts = await populateSellers(products);
    
    res.json({
      products: populatedProducts,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product = await populateSellers(product);
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==================== SELLER APIs ====================

exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only sellers can create products.' 
      });
    }
    
    const { 
      title, description, price, category, fileType,
      thumbnail, images, demoUrl, fileUrl 
    } = req.body;
    
    const sellerId = req.user._id || req.user.id;
    
    const product = await Product.create({
      title,
      description,
      price,
      category,
      fileType: fileType || 'file',
      thumbnail: thumbnail || '',
      images: images || [],
      demoUrl: demoUrl || '',
      fileUrl: fileUrl || '',
      seller: sellerId,
      isPublished: true,
      isApproved: false
    });
    
    res.status(201).json(product);
    
    // Notify admin
    const sellerName = req.user.name || 'Shop';
    sendNotification({
      role: 'admin',
      title: 'Sản phẩm mới cần duyệt',
      message: `Shop "${sellerName}" vừa đăng sản phẩm "${title}" - ${Number(price).toLocaleString('vi-VN')}đ. Vui lòng kiểm duyệt.`,
      type: 'info',
      relatedId: product._id.toString()
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const userId = req.user._id || req.user.id;
    if (product.seller.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { 
      title, description, price, category, fileType,
      thumbnail, images, demoUrl, fileUrl, isPublished 
    } = req.body;
    
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    if (fileType) product.fileType = fileType;
    if (thumbnail !== undefined) product.thumbnail = thumbnail;
    if (images !== undefined) product.images = images;
    if (demoUrl !== undefined) product.demoUrl = demoUrl;
    if (fileUrl !== undefined) product.fileUrl = fileUrl;
    if (isPublished !== undefined) product.isPublished = isPublished;
    
    // Nếu seller tự update, chuyển trạng thái về chưa duyệt
    let needsApproval = false;
    if (req.user.role !== 'admin') {
      product.isApproved = false;
      needsApproval = true;
    }
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
    
    if (needsApproval) {
      const sellerName = req.user.name || 'Shop';
      sendNotification({
        role: 'admin',
        title: 'Sản phẩm cần duyệt lại',
        message: `Shop "${sellerName}" vừa cập nhật sản phẩm "${product.title}". Vui lòng kiểm duyệt lại.`,
        type: 'warning',
        relatedId: product._id.toString()
      });
    }
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (owner or admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const userId = req.user._id || req.user.id;
    if (product.seller.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get products created by logged in user
// @route   GET /api/products/my/list
// @access  Private
exports.getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const products = await Product.find({ seller: userId.toString() }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Get my products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==================== ADMIN APIs ====================

// @desc    Approve a product
// @route   PUT /api/products/:id/approve
// @access  Private/Admin
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.isApproved = true;
    await product.save();
    
    res.json({ message: 'Product approved successfully', product });
    
    sendNotification({
      recipient: product.seller.toString(),
      role: 'user',
      title: 'Đã duyệt sản phẩm',
      message: `Sản phẩm "${product.title}" của bạn đã được duyệt và hiển thị công khai!`,
      type: 'success',
      relatedId: product._id.toString()
    });
  } catch (err) {
    console.error('Approve product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get ALL products (admin only - including unapproved)
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAllProductsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.seller) filter.seller = req.query.seller;
    
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    
    const populatedProducts = await populateSellers(products);
    
    res.json({ products: populatedProducts, page: Number(page), pages: Math.ceil(count / Number(limit)), total: count });
  } catch (err) {
    console.error('Get all products admin error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==================== INTERNAL APIs ====================

// @desc    Increment sales count
// @route   PATCH /api/products/:id/increment-sales
// @access  Internal
exports.incrementSales = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.salesCount += 1;
    await product.save();
    console.log(`Sales count incremented for product ${req.params.id}: ${product.salesCount}`);
    
    res.json({ message: 'Sales count incremented', salesCount: product.salesCount });
  } catch (err) {
    console.error('Increment sales error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get products by IDs
// @route   POST /api/products/by-ids
// @access  Internal
exports.getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } })
      .select('title price thumbnail seller');
    
    const populatedProducts = await populateSellers(products);
    res.json(populatedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Remove from wishlist internal
// @route   POST /api/products/internal/remove-wishlist
// @access  Internal
exports.removeFromWishlistInternal = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    console.log(`Internal: Removing product ${productId} from user ${userId} wishlist`);
    
    const result = await Wishlist.deleteOne({ 
      user: new mongoose.Types.ObjectId(userId), 
      product: new mongoose.Types.ObjectId(productId) 
    });
    
    console.log(`Internal: Wishlist removal result:`, result);
    res.json({ message: 'Removed from wishlist', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Internal Wishlist Removal Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ==================== WISHLIST APIs ====================

// @desc    Toggle wishlist (add/remove)
// @route   POST /api/products/:id/wishlist
// @access  Private
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const existing = await Wishlist.findOne({ user: userId, product: productId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ inWishlist: false, message: 'Đã xóa khỏi yêu thích' });
    }
    
    await Wishlist.create({ user: userId, product: productId });
    res.json({ inWishlist: true, message: 'Đã thêm vào yêu thích' });
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/products/:id/wishlist
// @access  Private
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const existing = await Wishlist.findOne({ user: userId, product: req.params.id });
    res.json({ inWishlist: !!existing });
  } catch (err) {
    console.error('Check wishlist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get user wishlist
// @route   GET /api/products/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const wishlist = await Wishlist.find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 });
    
    let products = wishlist.map(item => item.product).filter(p => p);
    products = await populateSellers(products);
    
    res.json(products);
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};