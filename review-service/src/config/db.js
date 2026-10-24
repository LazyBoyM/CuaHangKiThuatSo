const mongoose = require('mongoose');
module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Review DB connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};