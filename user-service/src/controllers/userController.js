const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper lấy tên hiển thị (Shop Name cho seller, Name cho buyer)
const getDisplayName = (user) => {
  return (user.role === 'seller' && user.sellerProfile?.shopName) 
    ? user.sellerProfile.shopName 
    : user.name;
};

const generateToken = (id, role, name) => {
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  let finalRole = role;
  if (!['buyer', 'seller', 'admin'].includes(role)) {
    finalRole = 'buyer';
  }
  
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: finalRole
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role, user.name)
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (user.isBanned) return res.status(401).json({ message: 'Your account has been banned' });
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    
    const displayName = getDisplayName(user);
    
    res.json({
      _id: user._id,
      name: displayName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      sellerProfile: user.sellerProfile,
      token: generateToken(user._id, user.role, displayName)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.json({
      message: 'Password reset token generated (DEMO MODE)',
      resetToken: resetToken,
      resetUrl: `${clientUrl}/reset-password?token=${resetToken}`
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const resetReq = await PasswordReset.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!resetReq) return res.status(400).json({ message: 'Invalid or expired token' });
    
    const user = await User.findById(resetReq.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.password = password;
    await user.save();
    await resetReq.deleteOne();
    
    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) user.password = req.body.password;
    
    if (user.role === 'seller' && req.body.shopName !== undefined) {
      if (!user.sellerProfile) user.sellerProfile = {};
      user.sellerProfile.shopName = req.body.shopName;
    }
    
    const updatedUser = await user.save();
    const displayName = getDisplayName(updatedUser);
    
    res.json({
      _id: updatedUser._id,
      name: displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      sellerProfile: updatedUser.sellerProfile,
      token: generateToken(updatedUser._id, updatedUser.role, displayName)
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Toggle ban user (admin only)
exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban admin' });
    
    user.isBanned = !user.isBanned;
    await user.save();
    
    res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get user stats for admin
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const sellers = await User.countDocuments({ role: 'seller' });
    res.json({ totalUsers, newUsersThisMonth, sellers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get shop info by seller ID (public)
exports.getShopInfo = async (req, res) => {
  try {
    const seller = await User.findById(req.params.sellerId)
      .select('name email avatar sellerProfile createdAt role');
    if (!seller) return res.status(404).json({ message: 'User not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get basic display info (name + avatar) for any user — used by chat
exports.getUserDisplay = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar role sellerProfile');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const displayName = getDisplayName(user);
    res.json({ _id: user._id, name: displayName, avatar: user.avatar, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get multiple users display info by IDs
// @route   POST /api/users/internal/by-ids
// @access  Internal
exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs array required' });
    }
    
    // Convert to ObjectIds to be safe
    const mongoose = require('mongoose');
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))
                        .map(id => new mongoose.Types.ObjectId(id));
                        
    const users = await User.find({ _id: { $in: validIds } }).select('name avatar role sellerProfile');
    
    const results = users.map(user => ({
      _id: user._id,
      name: getDisplayName(user),
      avatar: user.avatar,
      sellerProfile: user.sellerProfile
    }));
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
    
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};