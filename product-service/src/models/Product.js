const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: String,
  fileType: { 
    type: String, 
    enum: ['image', 'video', 'audio', 'file', 'other'], 
    default: 'file' 
  },
  thumbnail: { type: String, default: '' },
  images: [{ type: String, default: [] }],  // Gallery ảnh
  demoUrl: { type: String, default: '' },   // Link demo
  fileUrl: { type: String, default: '' },
  isPublished: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  salesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);