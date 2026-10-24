const Review = require('../models/Review');
const axios = require('axios');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const buyerId = req.user._id;

    // Kiểm tra đã mua chưa (gọi Order Service)
    try {
      const orderRes = await axios.get(`${process.env.ORDER_SERVICE_URL || 'http://order-service:5003'}/api/orders/check/${productId}`, {
        headers: { 
          Authorization: req.headers.authorization,
          'x-internal-secret': process.env.INTERNAL_SECRET
        }
      });
      if (!orderRes.data.purchased) {
        return res.status(403).json({ message: 'Bạn cần mua sản phẩm để đánh giá' });
      }
    } catch (err) {
      console.error('Check purchase error:', err.message);
    }

    const review = await Review.findOneAndUpdate(
      { product: productId, buyer: buyerId },
      { rating, comment },
      { upsert: true, new: true }
    );

    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get reviews by product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .sort({ createdAt: -1 });
    
    if (reviews.length === 0) return res.json([]);

    // Lấy thông tin người dùng từ User Service
    const buyerIds = [...new Set(reviews.map(r => r.buyer.toString()))];
    let buyersInfo = [];
    try {
      const userRes = await axios.post(`${process.env.USER_SERVICE_URL || 'http://user-service:5001'}/api/users/internal/by-ids`, {
        ids: buyerIds
      }, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      buyersInfo = userRes.data;
    } catch (err) {
      console.error('Failed to fetch buyers for reviews:', err.message);
    }

    const reviewsWithInfo = reviews.map(review => {
      const info = buyersInfo.find(b => b._id === review.buyer.toString());
      return {
        ...review.toObject(),
        buyer: info || { _id: review.buyer, name: 'Người dùng' }
      };
    });

    res.json(reviewsWithInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get average rating
// @route   GET /api/reviews/product/:productId/rating
// @access  Public
exports.getProductRating = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    res.json({ averageRating: avg, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get seller rating
// @route   GET /api/reviews/seller/:sellerId/rating
// @access  Public
exports.getSellerRating = async (req, res) => {
  try {
    // Gọi Product Service để lấy sản phẩm của seller
    const productsRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products?seller=${req.params.sellerId}&limit=1000`, {
      headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
    });
    const productIds = productsRes.data.products.map(p => p._id);
    
    if (productIds.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }
    
    const reviews = await Review.find({ product: { $in: productIds } });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    
    res.json({ averageRating: avg, totalReviews: reviews.length });
  } catch (err) {
    console.error('Get seller rating error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check if user reviewed product
// @route   GET /api/reviews/check/:productId
// @access  Private
exports.checkReviewed = async (req, res) => {
  try {
    const review = await Review.findOne({ 
      product: req.params.productId, 
      buyer: req.user._id 
    });
    res.json({ reviewed: !!review });
  } catch (err) {
    console.error('Check reviewed error:', err);
    res.status(500).json({ message: err.message });
  }
};