const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/reviews', reviewRoutes);

app.get('/health', (req, res) => res.json({ status: 'Review Service OK' }));

module.exports = app;