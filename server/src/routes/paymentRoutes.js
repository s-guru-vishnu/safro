const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    payWithWallet,
    initiateCashPayment,
    confirmCashPayment,
    confirmPayment,
    getPaymentHistory,
    getWalletTransactions,
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
router.post('/initiate-cash', initiateCashPayment);
router.post('/confirm-cash', confirmCashPayment);
router.post('/confirm-payment', confirmPayment);

// history
router.get('/history', getPaymentHistory);
router.get('/transactions', getWalletTransactions);

module.exports = router;
