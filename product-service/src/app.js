const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => res.json({ status: 'Product Service OK' }));

module.exports = app;