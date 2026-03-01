const CrowdZone = require('../models/CrowdZone');

/**
 * mapController.js
 * Handles location-based logic like crowd zone detection
 */
exports.checkCrowdZones = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Coordinates required' });
        }

        // Find zones within 200m of the provided coordinates
        const zones = await CrowdZone.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: 200 // 200 meters
                }
            },
            active: true
        });

        if (zones.length > 0) {
            return res.status(200).json({
                inZone: true,
                message: 'You are near a high-demand pickup zone. We recommend moving to the Smart Pickup point for faster service.',
                zones: zones.map(z => ({
                    name: z.name,
                    coordinates: z.location.coordinates
                }))
            });
        }

        res.status(200).json({ inZone: false });
    } catch (error) {
        console.error('CrowdZone check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Admin: Add new crowd zone
 */
exports.addCrowdZone = async (req, res) => {
    try {
        const { name, coordinates, radius } = req.body;
        const zone = new CrowdZone({
            name,
            location: { type: 'Point', coordinates },
            radius
        });
        await zone.save();
        res.status(201).json(zone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
