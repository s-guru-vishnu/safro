const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { processPayment, getPaymentHistory } = require('../controllers/paymentController');

// POST /api/payments/pay
router.post('/pay', protect, processPayment);

// GET /api/payments/history
router.get('/history', protect, getPaymentHistory);

module.exports = router;
