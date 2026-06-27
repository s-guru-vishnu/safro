const express = require('express');
const router = express.Router();
const {
    createSplitFare,
    invitePassenger,
    respondToInvite,
    getSplitFare,
    payShare,
    joinByCode,
    removePassenger,
    getMySplits
} = require('../controllers/splitFareController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createSplitFare);
router.post('/invite', protect, invitePassenger);
router.post('/respond', protect, respondToInvite);
router.post('/pay', protect, payShare);
router.post('/join/:code', protect, joinByCode);
router.get('/my-splits', protect, getMySplits);
router.get('/:rideId', protect, getSplitFare);
router.delete('/:id/remove/:userId', protect, removePassenger);

module.exports = router;
