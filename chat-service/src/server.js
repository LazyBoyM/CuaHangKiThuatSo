require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const axios = require('axios');

const PORT = process.env.PORT || 5007;
console.log('>>> CHAT SERVICE STARTING WITH NOTIFICATION LOGIC INTEGRATED <<<');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://chat-db:27017/chat-service';

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB (Chat Service)'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware for Socket Authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token missing'));
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Store active users: userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
  const userId = socket.user._id || socket.user.id;
  console.log(`User connected: ${userId} (Socket: ${socket.id})`);
  
  userSockets.set(userId, socket.id);

  socket.on('send_message', async (data) => {
    const { receiverId, text } = data;
    console.log(`[Chat] Received send_message from ${userId} to ${receiverId}: "${text}"`);
    try {
      
      // 1. Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, receiverId]
        });
      }

      // 2. Save message
      const message = await Message.create({
        conversationId: conversation._id,
        sender: userId,
        text
      });

      // 3. Update last message in conversation
      conversation.lastMessage = message._id;
      await conversation.save();

      // 4. Emit to sender and receiver
      const receiverSocketId = userSockets.get(receiverId);
      
      const payload = {
        _id: message._id,
        conversationId: conversation._id,
        sender: userId,
        senderName: socket.user.name || 'Người dùng',
        text,
        createdAt: message.createdAt
      };

      // Emit back to sender (for confirmation)
      socket.emit('receive_message', payload);

      // Emit to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', payload);
      } else {
        // === CALL NOTIFICATION SERVICE IF RECEIVER IS OFFLINE ===
        try {
          console.log(`Target user ${receiverId} is OFFLINE. Attempting to notify via service...`);
          const notifyUrl = `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008'}/api/notifications/send`;
          
          await axios.post(notifyUrl, {
            userId: receiverId,
            type: 'NEW_MESSAGE',
            message: `Bạn có tin nhắn mới từ ${socket.user.name || 'Người dùng'}`
          }, {
            headers: { 'x-internal-secret': process.env.INTERNAL_SECRET }
          });
          console.log(`>>> SUCCESS: Offline notification sent to user ${receiverId}`);
        } catch (notifyErr) {
          console.error('>>> ERROR calling Notification Service:', notifyErr.message);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    userSockets.delete(userId);
  });
});

server.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`);
});
