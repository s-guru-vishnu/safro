const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    getAllRides,
    getAllUsers,
    suspendUser,
    getAnalytics,
    createDriver
} = require('../controllers/adminController');

router.get('/rides', auth, authorize('admin'), getAllRides);
router.get('/users', auth, authorize('admin'), getAllUsers);
router.put('/users/:id/suspend', auth, authorize('admin'), suspendUser);
router.get('/analytics', auth, authorize('admin'), getAnalytics);
router.post('/create-driver', auth, authorize('admin'), createDriver);

module.exports = router;
