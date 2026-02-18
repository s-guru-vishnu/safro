const Review = require('../models/Review');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// @desc    Submit a review
// @route   POST /api/reviews
const submitReview = async (req, res, next) => {
    try {
        const { rideId, rating, comment } = req.body;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.riderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this ride' });
        }

        if (ride.status !== 'completed') {
            return res.status(400).json({ message: 'Ride must be completed to submit a review' });
        }

        const existingReview = await Review.findOne({ rideId });
        if (existingReview) {
            return res.status(400).json({ message: 'Review already submitted for this ride' });
        }

        const review = await Review.create({
            riderId: req.user._id,
            driverId: ride.driverId,
            rideId,
            rating,
            comment
        });

        // Recalculate Driver Average Rating
        const stats = await Review.aggregate([
            { $match: { driverId: ride.driverId } },
            { $group: { _id: '$driverId', averageRating: { $avg: '$rating' } } }
        ]);

        if (stats.length > 0) {
            await Driver.findOneAndUpdate(
                { userId: ride.driverId },
                { rating: parseFloat(stats[0].averageRating.toFixed(1)) }
            );
        }

        res.status(201).json(review);
    } catch (error) {
        next(error);
    }
};

// @desc    Get driver reviews
// @route   GET /api/reviews/driver/:driverId
const getDriverReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ driverId: req.params.driverId })
            .populate('riderId', 'name')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitReview,
    getDriverReviews
};
