const Driver = require('../models/Driver');

/**
 * Driver Matching Service
 * Finds the nearest available driver using GeoJSON queries
 */
const driverMatchingService = {
    /**
     * Find nearest available driver
     * @param {number} longitude - Pickup longitude
     * @param {number} latitude - Pickup latitude
     * @param {string} vehicleType - Required vehicle type
     * @param {number} maxDistance - Max search radius in meters (default: 10km)
     * @returns {Object|null} Best matching driver or null
     */
    findNearestDriver: async (longitude, latitude, vehicleType = null, maxDistance = 10000) => {
        try {
            const query = {
                isAvailable: true,
                currentLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                }
            };

            if (vehicleType) {
                query.vehicleType = vehicleType;
            }

            // MongoDB $near already sorts by distance (nearest first)
            const drivers = await Driver.find(query)
                .populate('userId', 'name phone rating')
                .limit(10);

            if (drivers.length === 0) {
                return null;
            }

            // Return the best match (nearest driver)
            return drivers[0];
        } catch (error) {
            console.error('Driver matching error:', error);
            throw new Error('Error finding nearest driver');
        }
    },

    /**
     * Find multiple nearby drivers
     * @param {number} longitude - Pickup longitude
     * @param {number} latitude - Pickup latitude
     * @param {string} vehicleType - Required vehicle type
     * @param {number} maxDistance - Max search radius in meters
     * @param {number} limit - Maximum number of drivers to return
     * @returns {Array} Array of nearby available drivers sorted by distance
     */
    findNearbyDrivers: async (longitude, latitude, vehicleType = null, maxDistance = 10000, limit = 10) => {
        try {
            const query = {
                isAvailable: true,
                currentLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                }
            };

            if (vehicleType) {
                query.vehicleType = vehicleType;
            }

            const drivers = await Driver.find(query)
                .populate('userId', 'name phone')
                .limit(limit);

            return drivers;
        } catch (error) {
            console.error('Find nearby drivers error:', error);
            throw new Error('Error finding nearby drivers');
        }
    }
};

module.exports = driverMatchingService;
