const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  token: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);