const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    payWithWallet,
    confirmCashPayment,
    getPaymentHistory,
    handleRazorpayWebhook
} = require('../controllers/paymentController');

/**
 * PRODUCTION SECURE: Webhook (Signature verified in controller)
 * MUST be placed before express.json() in app.js and use raw body.
 */
router.post('/webhook', handleRazorpayWebhook);

// All other payment routes are protected
router.use(protect);

// Razorpay Flows
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

// Wallet Flow
router.post('/pay-wallet', payWithWallet);

// Cash Flow
router.post('/confirm-cash', confirmCashPayment);

// history
router.get('/history', getPaymentHistory);

module.exports = router;
