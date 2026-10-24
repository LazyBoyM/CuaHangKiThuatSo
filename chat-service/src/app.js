const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'chat-service' });
});

app.use('/api/chat', chatRoutes);

module.exports = app;
