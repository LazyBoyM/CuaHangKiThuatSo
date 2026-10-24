const Order = require('../models/Order');
const axios = require('axios');
const crypto = require('crypto');
const sendNotification = require('../utils/sendNotification');

const generateDownloadToken = () => crypto.randomBytes(16).toString('hex');

// @desc    Create order after successful payment
// @route   POST /api/orders
// @access  Internal
exports.createOrder = async (req, res) => {
  try {
    const { productId, paymentId, amount, buyerId, couponId } = req.body;
    
    // === KIỂM TRA ORDER ĐÃ TỒN TẠI CHƯA ===
    const existingOrder = await Order.findOne({ paymentId });
    if (existingOrder) {
      console.log('Order already exists for payment:', paymentId);
      return res.status(200).json({ 
        message: 'Order already exists', 
        order: existingOrder 
      });
    }
    
    // Gọi Product Service để lấy thông tin sản phẩm
    let product;
    try {
      const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${productId}`, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      product = productRes.data;
    } catch (err) {
      console.error('Failed to fetch product:', err.message);
      return res.status(500).json({ message: 'Failed to fetch product' });
    }
    
    const feePercent = process.env.PLATFORM_FEE_PERCENT || 5; // Mặc định 5%
    let platformFee = 0;
    let sellerAmount = 0;
    
    // Nếu dùng mã toàn sàn, shop nhận đủ tiền dựa trên giá gốc, sàn chịu khoản giảm giá
    if (req.body.couponType === 'platform') {
      const originalAmount = req.body.originalAmount || amount;
      const originalFee = Math.round(originalAmount * (feePercent / 100));
      sellerAmount = originalAmount - originalFee;
      // Phí sàn thu được sẽ trừ đi phần đã trợ giá cho người dùng
      platformFee = amount - sellerAmount;
    } else {
      // Nếu dùng mã của shop (hoặc không mã), shop tự chịu giảm giá, sàn thu phí trên giá đã giảm
      platformFee = Math.round(amount * (feePercent / 100));
      sellerAmount = amount - platformFee;
    }

    const order = await Order.create({
      buyer: buyerId,
      product: productId,
      seller: product.seller,
      amount,
      originalAmount: req.body.originalAmount,
      platformFee,
      sellerAmount,
      couponId: couponId || null,
      couponType: req.body.couponType || null,
      paymentId,
      downloadToken: generateDownloadToken(),
      status: 'completed'
    });
    
    // Cập nhật salesCount cho product
    try {
      await axios.patch(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${productId}/increment-sales`, {}, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
    } catch (err) {
      console.error('Failed to increment sales:', err.message);
    }
    
    // Xóa sản phẩm khỏi wishlist của người mua
    try {
      console.log(`Calling Product Service to remove product ${productId} from user ${buyerId} wishlist`);
      const wishlistRes = await axios.post(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/internal/remove-wishlist`, 
        { userId: buyerId, productId: productId },
        { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
      );
      console.log('Wishlist removal response:', wishlistRes.data);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err.message);
    }
    
    // Lấy tên buyer để gửi thông báo có tên
    let buyerName = 'Khách hàng';
    try {
      const buyerRes = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:5001'}/api/users/shop/${buyerId}`);
      buyerName = buyerRes.data?.name || 'Khách hàng';
    } catch (err) {
      console.error('Failed to fetch buyer info:', err.message);
    }
    
    const productName = product.title || 'sản phẩm';
    const sellerName = product.seller?.sellerProfile?.shopName || product.seller?.name || 'Shop';
    const sellerIdStr = (product.seller?._id || product.seller).toString();
    
    // Notify Buyer
    sendNotification({
      recipient: buyerId.toString(),
      role: 'user',
      title: 'Đặt hàng thành công! 🎉',
      message: `Bạn đã mua thành công "${productName}" từ shop "${sellerName}". Vào Đơn mua để tải file ngay!`,
      type: 'success',
      relatedId: order._id.toString()
    });
    
    // Notify Seller
    sendNotification({
      recipient: sellerIdStr,
      role: 'user',
      title: 'Có đơn hàng mới! 💰',
      message: `"${buyerName}" vừa mua sản phẩm "${productName}" của bạn - ${Number(amount).toLocaleString('vi-VN')}đ.`,
      type: 'success',
      relatedId: order._id.toString()
    });
    
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get orders made by logged in user (as buyer)
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ buyer: userId }).sort({ createdAt: -1 });
    
    // Lấy thông tin sản phẩm từ Product Service
    const productIds = [...new Set(orders.map(o => o.product.toString()))];
    let productsInfo = [];
    
    if (productIds.length > 0) {
      try {
        const productRes = await axios.post(
          `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/by-ids`,
          { ids: productIds },
          { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET } }
        );
        productsInfo = productRes.data;
      } catch (err) {
        console.error('Failed to fetch products for my orders:', err.message);
      }
    }
    
    // Thêm trường product
    const ordersWithInfo = orders.map(order => {
      const info = productsInfo.find(p => p._id === order.product.toString());
      return {
        ...order.toObject(),
        product: info ? {
          _id: info._id,
          title: info.title,
          price: info.price,
          thumbnail: info.thumbnail,
          seller: info.seller
        } : {
          _id: order.product,
          title: 'Sản phẩm không còn tồn tại',
          price: order.amount,
          thumbnail: '',
          seller: order.seller
        }
      };
    });
    
    res.json(ordersWithInfo);
  } catch (err) {
    console.error('Get my orders error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get orders received by logged in user (as seller)
// @route   GET /api/orders/seller
// @access  Private
exports.getSellerOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ seller: userId })
      .sort({ createdAt: -1 });

    if (orders.length === 0) return res.json([]);

    // Lấy thông tin sản phẩm từ Product Service
    const productIds = [...new Set(orders.map(o => o.product.toString()))];
    let productsInfo = [];
    if (productIds.length > 0) {
      try {
        const productRes = await axios.post(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/by-ids`, {
          ids: productIds
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        productsInfo = productRes.data;
      } catch (err) {
        console.error('Failed to fetch products for seller orders:', err.message);
      }
    }

    // Lấy thông tin người mua từ User Service
    const buyerIds = [...new Set(orders.map(o => o.buyer.toString()))];
    let buyersInfo = [];
    if (buyerIds.length > 0) {
      try {
        const userRes = await axios.post(`${process.env.USER_SERVICE_URL || 'http://user-service:5001'}/api/users/internal/by-ids`, {
          ids: buyerIds
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        buyersInfo = userRes.data;
      } catch (err) {
        console.error('Failed to fetch buyers for seller orders:', err.message);
      }
    }

    const ordersWithInfo = orders.map(order => {
      const pInfo = productsInfo.find(p => p._id === order.product.toString());
      const bInfo = buyersInfo.find(b => b._id === order.buyer.toString());
      return {
        ...order.toObject(),
        product: pInfo || { _id: order.product, title: 'Sản phẩm đã xóa' },
        buyer: bInfo || { _id: order.buyer, name: 'Khách hàng' }
      };
    });

    res.json(ordersWithInfo);
  } catch (err) {
    console.error('Get seller orders error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get download URL for purchased product
// @route   GET /api/orders/:id/download
// @access  Private (buyer only)
exports.getDownloadUrl = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const userId = req.user._id || req.user.id;
    if (order.buyer.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Gọi Product Service lấy fileUrl
    let fileUrl = '';
    try {
      const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${order.product}`, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      fileUrl = productRes.data.fileUrl || '';
    } catch (err) {
      console.error('Failed to fetch product file:', err.message);
    }
    
    res.json({ downloadUrl: fileUrl, token: order.downloadToken });
  } catch (err) {
    console.error('Get download URL error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get seller statistics
// @route   GET /api/orders/seller/stats
// @access  Private
exports.getSellerStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ seller: userId, status: 'completed' });
    
    const totalSales = orders.length;
    const totalGrossRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalPlatformFee = orders.reduce((sum, order) => sum + (order.platformFee || 0), 0);
    const totalNetRevenue = orders.reduce((sum, order) => sum + (order.sellerAmount || order.amount), 0);
    
    res.json({ 
      totalSales, 
      totalRevenue: totalNetRevenue, // Ưu tiên trả về tiền thực nhận
      totalGrossRevenue,
      totalPlatformFee,
      orders 
    });
  } catch (err) {
    console.error('Get seller stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get admin dashboard stats (Revenue)
// @route   GET /api/orders/admin/stats
// @access  Admin
exports.getAdminRevenueStats = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalOrders = await Order.countDocuments({ status: 'completed' });

    const revenueByDay = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders: totalOrders,
      revenueByDay
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get admin analytics
// @route   GET /api/orders/admin/analytics
// @access  Admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    // 1. Doanh thu 7 ngày qua
    const revenueByDay = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          platformFee: { $sum: '$platformFee' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    // 2. Top 5 sản phẩm bán chạy
    const topProducts = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$product',
          totalSold: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Lấy thông tin sản phẩm từ Product Service
    const productIds = topProducts.map(p => p._id.toString());
    let productsInfo = [];
    
    if (productIds.length > 0) {
      try {
        // Gọi API by-ids
        const productRes = await axios.post(
          `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/by-ids`,
          { ids: productIds },
          { 
            timeout: 5000,
            headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
          }
        );
        productsInfo = productRes.data;
      } catch (err) {
        console.error('Failed to fetch products:', err.message);
      }
    }

    // Ghép thông tin sản phẩm
    const topProductsWithInfo = topProducts.map(p => {
      const pIdStr = p._id.toString();
      const info = productsInfo.find(prod => (prod._id || prod.id).toString() === pIdStr);
      
      console.log(`Mapping product ${pIdStr}: Found info? ${!!info}, Thumbnail: ${info?.thumbnail || 'NONE'}`);
      
      return {
        _id: p._id,
        totalSold: p.totalSold,
        revenue: p.revenue,
        title: info?.title || `Sản phẩm #${pIdStr.slice(-6)}`,
        price: info?.price || 0,
        thumbnail: info?.thumbnail || ''
      };
    });

    // 3. Top 5 Seller theo doanh thu
    const topSellers = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$seller',
          totalOrders: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Lấy thông tin người dùng từ User Service cho Top Sellers
    const sellerIds = topSellers.map(s => s._id.toString());
    let sellersInfo = [];
    if (sellerIds.length > 0) {
      try {
        const userRes = await axios.post(`${process.env.USER_SERVICE_URL || 'http://user-service:5001'}/api/users/internal/by-ids`, {
          ids: sellerIds
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        sellersInfo = userRes.data;
      } catch (err) {
        console.error('Failed to fetch seller names for analytics:', err.message);
      }
    }

    const topSellersWithNames = topSellers.map(s => {
      const info = sellersInfo.find(u => u._id === s._id.toString());
      return {
        ...s,
        name: info ? info.name : `Seller #${s._id.toString().slice(-6)}`
      };
    });

    const totalPlatformEarnings = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } }
    ]);

    res.json({
      revenueByDay: revenueByDay.reverse(),
      topProducts: topProductsWithInfo,
      topSellers: topSellersWithNames,
      totalPlatformEarnings: totalPlatformEarnings[0]?.total || 0
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check if user has purchased product
// @route   GET /api/orders/check/:productId
// @access  Private
exports.checkPurchased = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;
    
    // Kiểm tra productId hợp lệ
    if (!productId || productId === 'undefined' || productId === 'null') {
      return res.status(400).json({ purchased: false, message: 'Invalid product ID' });
    }
    
    const order = await Order.findOne({ 
      buyer: userId, 
      product: productId,
      status: 'completed' 
    });
    
    res.json({ purchased: !!order });
  } catch (err) {
    console.error('Check purchased error:', err);
    res.status(500).json({ purchased: false, message: err.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner only)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const userId = req.user._id || req.user.id;
    if (order.buyer.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Fetch product details
    let productInfo = {
      _id: order.product,
      title: 'Sản phẩm không còn tồn tại',
      price: order.amount,
      thumbnail: '',
      fileUrl: ''
    };
    
    try {
      const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${order.product}`, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      productInfo = productRes.data;
    } catch (err) {
      console.error('Failed to fetch product for order detail:', err.message);
    }
    
    res.json({
      ...order.toObject(),
      product: productInfo
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};