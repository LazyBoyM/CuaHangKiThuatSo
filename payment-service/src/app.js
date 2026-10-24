const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

const app = express();
connectDB();

// IPN endpoint cần raw body (MoMo gửi JSON)
app.use('/api/payments/momo/ipn', express.json());

app.use(cors());
app.use(express.json());

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => res.json({ status: 'Payment Service OK' }));

module.exports = app;