const express = require('express');
const router = express.Router();
const { submitReview, getDriverReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitReview);
router.get('/driver/:driverId', protect, getDriverReviews);

module.exports = router;
