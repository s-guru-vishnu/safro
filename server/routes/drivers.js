const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    updateLocation,
    getAvailableDrivers,
    toggleAvailability,
    getDriverStats
} = require('../controllers/driverController');

router.put('/location', auth, authorize('driver'), updateLocation);
router.get('/available', auth, getAvailableDrivers);
router.put('/toggle-availability', auth, authorize('driver'), toggleAvailability);
router.get('/stats', auth, authorize('driver'), getDriverStats);

module.exports = router;
