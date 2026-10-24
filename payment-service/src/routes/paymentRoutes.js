const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createMoMoPayment, momoIPN, testMoMoIPN, getMyPayments } = require('../controllers/paymentController');

router.post('/momo/ipn', momoIPN);
router.post('/test-momo-ipn', testMoMoIPN);
router.post('/create-momo', auth, createMoMoPayment);
router.get('/my', auth, getMyPayments);

module.exports = router;