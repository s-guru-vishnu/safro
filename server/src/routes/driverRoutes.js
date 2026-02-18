const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    updateLocation,
    getAvailableDrivers,
    toggleAvailability,
    getDriverStats
} = require('../controllers/driverController');

// PUT /api/drivers/location
router.put('/location', protect, roleMiddleware('driver'), updateLocation);

// GET /api/drivers/available
router.get('/available', protect, getAvailableDrivers);

// PUT /api/drivers/toggle-availability
router.put('/toggle-availability', protect, roleMiddleware('driver'), toggleAvailability);

// GET /api/drivers/stats
router.get('/stats', protect, roleMiddleware('driver'), getDriverStats);

module.exports = router;
