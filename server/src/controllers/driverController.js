const Driver = require('../models/Driver');
const driverMatchingService = require('../services/driverMatchingService');

// @desc    Update driver location
// @route   PUT /api/drivers/location
const updateLocation = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const driver = await Driver.findOneAndUpdate(
            { userId: req.user._id },
            {
                currentLocation: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('driverLocationUpdate', {
                driverId: req.user._id,
                location: { latitude, longitude }
            });
        }

        res.json({ location: driver.currentLocation });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available drivers nearby
// @route   GET /api/drivers/available
const getAvailableDrivers = async (req, res, next) => {
    try {
        const { latitude, longitude, maxDistance = 10000, vehicleType } = req.query;

        if (latitude && longitude) {
            const drivers = await driverMatchingService.findNearbyDrivers(
                parseFloat(longitude),
                parseFloat(latitude),
                vehicleType || null,
                parseInt(maxDistance)
            );
            return res.json({ drivers });
        }

        // Fallback: get all available drivers without location filter
        const query = { isAvailable: true };
        if (vehicleType) query.vehicleType = vehicleType;

        const drivers = await Driver.find(query)
            .populate('userId', 'name phone')
            .limit(20);

        res.json({ drivers });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle driver availability
// @route   PUT /api/drivers/toggle-availability
const toggleAvailability = async (req, res, next) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        driver.isAvailable = !driver.isAvailable;
        await driver.save();

        res.json({ isAvailable: driver.isAvailable });
    } catch (error) {
        next(error);
    }
};

// @desc    Get driver stats (dynamically from DB)
// @route   GET /api/drivers/stats
const getDriverStats = async (req, res, next) => {
    try {
        const Review = require('../models/Review');

        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        // Dynamically compute rating from reviews
        const reviewStats = await Review.aggregate([
            { $match: { driverId: req.user._id } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewCount = reviewStats.length > 0 ? reviewStats[0].count : 0;
        const liveRating = reviewStats.length > 0
            ? parseFloat(reviewStats[0].avgRating.toFixed(1))
            : driver.rating;

        res.json({
            totalRides: driver.totalRides || 0,
            totalEarnings: driver.totalEarnings || 0,
            rating: liveRating,
            reviewCount,
            isAvailable: driver.isAvailable,
            vehicleType: driver.vehicleType,
            vehicleNumber: driver.vehicleNumber
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateLocation,
    getAvailableDrivers,
    toggleAvailability,
    getDriverStats
};
