require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5008;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://notification-db:27017/notification-service';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB (Notification Service)'))
  .catch(err => console.error('MongoDB connection error:', err));

// Model
const NotificationSchema = new mongoose.Schema({
  userId: { type: String }, // ID người nhận cụ thể
  role: { type: String },   // Vai trò người nhận (vd: admin)
  type: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

// Store active users: userId -> socketId
const userSockets = new Map();
const roleSockets = new Map(); // role -> Set of socketIds

io.on('connection', (socket) => {
  console.log('A client connected to Notification Socket');
  
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded._id || decoded.id;
      const userRole = decoded.role;
      
      userSockets.set(userId, socket.id);
      
      if (userRole) {
        if (!roleSockets.has(userRole)) roleSockets.set(userRole, new Set());
        roleSockets.get(userRole).add(socket.id);
      }
      
      console.log(`User authenticated: ${userId} (Role: ${userRole})`);
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    for (let [role, sockets] of roleSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        break;
      }
    }
  });
});

const internalAuth = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret && secret === INTERNAL_SECRET) {
    next();
  } else {
    console.warn(`[Notification] Rejected internal call. Received secret: ${secret ? 'EXISTS' : 'MISSING'}`);
    res.status(403).json({ message: 'Forbidden' });
  }
};

const userAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// API: Get notifications (User gets their own + role-based ones like admin)
app.get('/api/notifications', userAuth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const userRole = req.user.role;
    
    // Tìm thông báo gửi riêng cho user HOẶC gửi cho role của user (nếu là admin)
    const query = {
      $or: [
        { userId: userId },
        { role: userRole }
      ]
    };
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/notifications/:id/read', userAuth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API: Mark all as read
app.patch('/api/notifications/read-all', userAuth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const userRole = req.user.role;
    const query = { $or: [{ userId }, { role: userRole }], isRead: false };
    await Notification.updateMany(query, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API: Delete all notifications
app.delete('/api/notifications/all', userAuth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const userRole = req.user.role;
    const query = { $or: [{ userId }, { role: userRole }] };
    await Notification.deleteMany(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API: Internal - Send notification
app.post('/api/notifications/send', internalAuth, async (req, res) => {
  try {
    const { userId, role, type, message } = req.body;
    
    // 1. Save to DB
    const notification = await Notification.create({ userId, role, type, message });
    
    // 2. Push real-time
    if (userId) {
      const socketId = userSockets.get(userId);
      if (socketId) io.to(socketId).emit('new_notification', notification);
    } 
    
    if (role) {
      const sockets = roleSockets.get(role);
      if (sockets) {
        sockets.forEach(socketId => {
          io.to(socketId).emit('new_notification', notification);
        });
      }
    }
    
    console.log(`[Notification] Saved and pushed (Target: ${userId || 'Role ' + role}): ${message}`);
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Notification Service (Role-aware) running on port ${PORT}`);
});
