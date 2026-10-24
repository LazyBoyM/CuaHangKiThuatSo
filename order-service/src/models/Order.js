const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true }, // Tổng tiền người mua trả
  originalAmount: { type: Number }, // Giá gốc của sản phẩm
  platformFee: { type: Number, default: 0 }, // Phí sàn thu
  sellerAmount: { type: Number, default: 0 }, // Tiền thực nhận của seller
  couponId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Mã giảm giá đã dùng
  couponType: { type: String, enum: ['platform', 'seller', null], default: null }, // Loại mã giảm giá
  paymentId: { type: mongoose.Schema.Types.ObjectId },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'completed' 
  },
  downloadToken: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);