const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gọi User Service để lấy thông tin đầy đủ của user
    try {
      const userRes = await axios.get(`http://user-service:5001/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      req.user = userRes.data;
    } catch (err) {
      console.error('Failed to fetch user from User Service:', err.message);
      // Fallback: dùng thông tin từ token
      req.user = { 
        id: decoded.id, 
        role: decoded.role || 'user' 
      };
    }
    
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};