const express = require('express');
const router = express.Router();
const {
    requestRide,
    getAvailableRides,
    getRide,
    confirmRide,
    startRide,
    completeRide,
    cancelRide,
    failNegotiation,
    getRideHistory,
    getAIFare,
    getActiveRide
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestRide);
router.get('/available', protect, getAvailableRides);
router.get('/active', protect, getActiveRide);
router.get('/history', protect, getRideHistory);
router.get('/:id/ai-fare', protect, getAIFare);
router.get('/:id', protect, getRide);
router.put('/:id/confirm', protect, confirmRide);
router.put('/:id/start', protect, startRide);
router.put('/:id/complete', protect, completeRide);
router.put('/:id/cancel', protect, cancelRide);
router.put('/:id/fail-negotiation', protect, failNegotiation);

module.exports = router;
