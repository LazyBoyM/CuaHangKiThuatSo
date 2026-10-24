const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  amount: { type: Number, required: true },
  originalAmount: { type: Number },
  discountPercent: { type: Number, default: 0 },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponType: { type: String, enum: ['platform', 'seller', null], default: null },
  currency: { type: String, default: 'VND' },
  momoOrderId: { type: String, required: true, unique: true },
  momoRequestId: { type: String },
  momoTransId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);