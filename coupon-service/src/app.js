const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const couponRoutes = require('./routes/couponRoutes');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/coupons', couponRoutes);
app.get('/health', (req, res) => res.json({ status: 'Coupon Service OK' }));

module.exports = app;