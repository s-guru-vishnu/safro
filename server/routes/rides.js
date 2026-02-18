const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    bookRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    getRideHistory,
    getActiveRide
} = require('../controllers/rideController');

router.post('/book', auth, authorize('rider'), bookRide);
router.put('/accept/:id', auth, authorize('driver'), acceptRide);
router.put('/start/:id', auth, authorize('driver'), startRide);
router.put('/complete/:id', auth, completeRide);
router.put('/cancel/:id', auth, cancelRide);
router.get('/history', auth, getRideHistory);
router.get('/active', auth, getActiveRide);

module.exports = router;
