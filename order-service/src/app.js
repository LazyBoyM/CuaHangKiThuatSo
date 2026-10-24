const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => res.json({ status: 'Order Service OK' }));

module.exports = app;