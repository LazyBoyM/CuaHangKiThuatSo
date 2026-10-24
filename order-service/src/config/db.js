const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Order DB connected');
  } catch (err) {
    console.error('Order DB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;