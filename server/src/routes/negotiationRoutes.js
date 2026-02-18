const express = require('express');
const router = express.Router();
const {
    makeOffer,
    getNegotiations,
    acceptOffer
} = require('../controllers/negotiationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/offer', protect, makeOffer);
router.get('/:rideId', protect, getNegotiations);
router.put('/accept/:id', protect, acceptOffer);

module.exports = router;
