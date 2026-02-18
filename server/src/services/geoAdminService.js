/**
 * Geo-Based Admin Assignment Service
 * Finds nearest admin for driver verification based on location
 */
const User = require('../models/User');

/**
 * Find the nearest admin within a radius of driver's home location
 * @param {Object} driverCoords - { lat, lng } of driver's home
 * @returns {Object|null} Admin user document or null
 */
const findNearestAdmin = async (driverCoords) => {
    if (!driverCoords?.lat || !driverCoords?.lng) {
        return findCentralAdmin();
    }

    try {
        // Find admins with adminRegion set, sorted by distance
        const admins = await User.find({
            role: 'admin',
            'adminRegion.center': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [driverCoords.lng, driverCoords.lat] // GeoJSON: [lng, lat]
                    },
                    $maxDistance: 50000 // 50km radius
                }
            }
        }).limit(1);

        if (admins.length > 0) {
            return admins[0];
        }

        // No admin within 50km — fall back to central admin
        return findCentralAdmin();
    } catch (error) {
        console.error('Geo admin lookup error:', error.message);
        return findCentralAdmin();
    }
};

/**
 * Get the central/fallback admin
 * Returns the first admin in the system (by creation date)
 */
const findCentralAdmin = async () => {
    try {
        const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        return admin;
    } catch (error) {
        console.error('Central admin lookup error:', error.message);
        return null;
    }
};

module.exports = { findNearestAdmin, findCentralAdmin };
