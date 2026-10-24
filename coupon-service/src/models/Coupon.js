const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true 
  },
  discountPercent: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 99
  },
  maxUses: { 
    type: Number, 
    default: 1 
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  
  // Phân biệt loại mã giảm giá
  type: { 
    type: String, 
    enum: ['platform', 'seller'],
    default: 'seller'
  },
  
  // Nếu type = 'seller' thì mới có seller
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  
  // Giới hạn sản phẩm áp dụng (rỗng = tất cả sản phẩm của seller)
  productIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});


module.exports = mongoose.model('Coupon', couponSchema);