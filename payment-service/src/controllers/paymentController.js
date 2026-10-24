const Payment = require('../models/Payment');
const { createMoMoPayment, verifyMoMoIPN } = require('../utils/momoHelper');
const axios = require('axios');

// @desc    Create MoMo payment request
// @route   POST /api/payments/create-momo
// @access  Private
exports.createMoMoPayment = async (req, res) => {
  try {
    const { productId, couponCode } = req.body;
    const user = req.user;
    const userId = user._id || user.id;

    // === CHẶN ADMIN MUA HÀNG ===
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Tài khoản Admin không thể mua hàng' });
    }
    if (user.role === 'seller') {
  return res.status(403).json({ message: 'Tài khoản Seller không thể mua hàng. Vui lòng dùng tài khoản Buyer.' });
  }

    // Gọi Product Service để lấy thông tin sản phẩm
    let product;
    try {
      const productUrl = `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}/api/products/${productId}`;
      console.log('Calling Product Service:', productUrl);
      const productRes = await axios.get(productUrl, { 
        timeout: 5000,
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      product = productRes.data;
    } catch (err) {
      console.error('Failed to fetch product:', err.message);
      return res.status(404).json({ message: 'Product not found or Product Service unavailable' });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isApproved) {
      return res.status(400).json({ message: 'Product is not approved yet' });
    }

    // === CHẶN MUA SẢN PHẨM CỦA CHÍNH MÌNH ===
    const productSellerId = product.seller?._id || product.seller;
    if (userId.toString() === productSellerId.toString()) {
      return res.status(403).json({ message: 'Bạn không thể mua sản phẩm của chính mình' });
    }

    // === TÍCH HỢP COUPON ===
    let discountPercent = 0;
    let couponId = null;
    let couponType = null;

    if (couponCode) {
      try {
        const couponRes = await axios.post(`${process.env.COUPON_SERVICE_URL || 'http://coupon-service:5006'}/api/coupons/validate`, {
          code: couponCode,
          productId
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        if (couponRes.data.valid) {
          discountPercent = couponRes.data.discountPercent;
          couponId = couponRes.data.couponId;
          couponType = couponRes.data.type;
          console.log(`Coupon applied: ${discountPercent}% discount, type: ${couponType}`);
        }
      } catch (err) {
        console.error('Coupon validation failed:', err.message);
      }
    }

    const originalAmount = Math.round(product.price);
    const discountedAmount = Math.round(originalAmount * (1 - discountPercent / 100));
    const amount = discountedAmount;

    const orderId = `${Date.now()}_${userId}_${productId}`;
    const orderInfo = `Thanh toan san pham: ${product.title}`;
    const extraData = Buffer.from(JSON.stringify({
      userId: userId.toString(),
      productId: productId.toString(),
      couponId: couponId ? couponId.toString() : null,
      couponType,
      discountPercent
    })).toString('base64');

    // Gọi MoMo API
    const momoResponse = await createMoMoPayment(amount, orderInfo, orderId, extraData);

    if (momoResponse && momoResponse.payUrl) {
      await Payment.create({
        user: userId,
        product: productId,
        amount: amount,
        originalAmount: originalAmount,
        discountPercent: discountPercent,
        couponId: couponId || null,
        couponType: couponType || null,
        currency: 'VND',
        momoOrderId: orderId,
        momoRequestId: momoResponse.requestId,
        status: 'pending'
      });

      res.json({
        payUrl: momoResponse.payUrl,
        orderId: orderId,
        originalAmount,
        discountedAmount: amount,
        discountPercent
      });
    } else {
      res.status(500).json({ message: 'Failed to create MoMo payment' });
    }
  } catch (err) {
    console.error('Create MoMo payment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    MoMo IPN (Instant Payment Notification)
// @route   POST /api/payments/momo/ipn
// @access  Public
exports.momoIPN = async (req, res) => {
  try {
    console.log('MoMo IPN Received:', JSON.stringify(req.body, null, 2));

    if (!verifyMoMoIPN(req.body)) {
      console.error('Invalid MoMo signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { orderId, resultCode, extraData, transId } = req.body;

    if (resultCode !== 0) {
      console.log(`Payment failed for order ${orderId}, resultCode: ${resultCode}`);
      return res.status(200).json({ message: 'Payment not successful' });
    }

    const payment = await Payment.findOne({ momoOrderId: orderId });
    if (!payment) {
      console.error('Payment record not found for orderId:', orderId);
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'succeeded') {
      return res.status(200).json({ message: 'Already processed' });
    }

    let userId, productId, couponId;
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
      userId = decoded.userId;
      productId = decoded.productId;
      couponId = decoded.couponId;
    } catch (err) {
      console.error('Error parsing extraData:', err);
      return res.status(400).json({ message: 'Invalid extraData' });
    }

    payment.status = 'succeeded';
    payment.momoTransId = transId;
    await payment.save();

    if (couponId) {
      try {
        await axios.patch(`${process.env.COUPON_SERVICE_URL || 'http://coupon-service:5006'}/api/coupons/${couponId}/use`, {}, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        console.log(`Coupon ${couponId} marked as used`);
      } catch (err) {
        console.error('Failed to mark coupon as used:', err.message);
      }
    }

    try {
      await axios.post(`${process.env.ORDER_SERVICE_URL || 'http://order-service:5003'}/api/orders`, {
        productId: productId,
        paymentId: payment._id,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        buyerId: userId,
        couponId: couponId || null,
        couponType: payment.couponType
      }, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      console.log(`Order created for user ${userId}, product ${productId}`);

      // === CALL NOTIFICATION SERVICE ===
      try {
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008'}/api/notifications/send`, {
          userId: userId,
          type: 'PAYMENT_SUCCESS',
          message: `Thanh toán thành công cho sản phẩm ${productId}. Bạn đã có thể truy cập sản phẩm.`
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        console.log('Notification sent for successful payment');
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr.message);
      }
    } catch (err) {
      console.error('Failed to create order:', err.message);
    }

    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('MoMo IPN error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get payment history of logged in user
// @route   GET /api/payments/my
// @access  Private
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Get my payments error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Test API - Giả lập IPN từ MoMo
// @route   POST /api/payments/test-momo-ipn
// @access  Public
exports.testMoMoIPN = async (req, res) => {
  try {
    const { orderId, resultCode = 0 } = req.body;
    console.log('Test MoMo IPN Received:', req.body);

    if (resultCode !== 0) {
      return res.status(200).json({ message: 'Payment failed simulation' });
    }

    const payment = await Payment.findOne({ momoOrderId: orderId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'succeeded') {
      return res.status(200).json({ message: 'Already processed' });
    }

    payment.status = 'succeeded';
    payment.momoTransId = `TEST_${Date.now()}`;
    await payment.save();

    if (payment.couponId) {
      try {
        await axios.patch(`${process.env.COUPON_SERVICE_URL || 'http://coupon-service:5006'}/api/coupons/${payment.couponId}/use`, {}, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
        console.log(`Test coupon ${payment.couponId} marked as used`);
      } catch (err) {
        console.error('Failed to mark test coupon as used:', err.message);
      }
    }

    let createdOrder = null;
    try {
      const orderRes = await axios.post(`${process.env.ORDER_SERVICE_URL || 'http://order-service:5003'}/api/orders`, {
        productId: payment.product,
        paymentId: payment._id,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        buyerId: payment.user,
        couponId: payment.couponId || null,
        couponType: payment.couponType
      }, {
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
      });
      createdOrder = orderRes.data;
      console.log(`Test order created for user ${payment.user}, product ${payment.product}`);

      // === CALL NOTIFICATION SERVICE (TEST MODE) ===
      try {
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008'}/api/notifications/send`, {
          userId: payment.user,
          type: 'PAYMENT_SUCCESS_TEST',
          message: `(Test) Thanh toán thành công. Đơn hàng: ${createdOrder?._id}`
        }, {
          headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
        });
      } catch (notifyErr) {
        console.error('Failed to send test notification:', notifyErr.message);
      }
    } catch (err) {
      console.error('Failed to create test order:', err.message);
    }

    res.json({
      message: 'Payment processed successfully (TEST MODE)',
      paymentId: payment._id,
      orderId: createdOrder?._id || null  
    });
  } catch (err) {
    console.error('Test MoMo IPN error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all payments (admin only)
// @route   GET /api/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Get all payments error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const userId = req.user._id || req.user.id;
    if (payment.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(payment);
  } catch (err) {
    console.error('Get payment by ID error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};