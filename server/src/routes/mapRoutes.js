const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/check-crowd-zones', protect, mapController.checkCrowdZones);
router.post('/admin/crowd-zones', protect, roleMiddleware('admin'), mapController.addCrowdZone);

module.exports = router;
