const Driver = require('../models/Driver');

// @desc Update driver location
// @route PUT /api/drivers/location
const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

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
        res.status(500).json({ message: 'Error updating location' });
    }
};

// @desc Get available drivers nearby
// @route GET /api/drivers/available
const getAvailableDrivers = async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 10000, vehicleType } = req.query;

        const query = { isAvailable: true };

        if (vehicleType) {
            query.vehicleType = vehicleType;
        }

        if (latitude && longitude) {
            query.currentLocation = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            };
        }

        const drivers = await Driver.find(query)
            .populate('userId', 'name phone')
            .limit(20);

        res.json({ drivers });
    } catch (error) {
        res.status(500).json({ message: 'Error finding drivers' });
    }
};

// @desc Toggle driver availability
// @route PUT /api/drivers/toggle-availability
const toggleAvailability = async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        driver.isAvailable = !driver.isAvailable;
        await driver.save();

        res.json({ isAvailable: driver.isAvailable });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling availability' });
    }
};

// @desc Get driver stats
// @route GET /api/drivers/stats
const getDriverStats = async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        res.json({
            totalRides: driver.totalRides,
            totalEarnings: driver.totalEarnings,
            rating: driver.rating,
            isAvailable: driver.isAvailable,
            vehicleType: driver.vehicleType,
            vehicleNumber: driver.vehicleNumber
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

module.exports = {
    updateLocation,
    getAvailableDrivers,
    toggleAvailability,
    getDriverStats
};
