const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Product' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Đảm bảo mỗi user chỉ yêu thích 1 sản phẩm 1 lần
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);