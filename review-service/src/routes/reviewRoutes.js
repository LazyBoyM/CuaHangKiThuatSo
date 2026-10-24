const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createReview, getProductReviews, getProductRating, 
    getSellerRating, checkReviewed
  } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/rating', getProductRating);
router.get('/seller/:sellerId/rating', getSellerRating);  
router.get('/check/:productId', auth, checkReviewed); 

module.exports = router;