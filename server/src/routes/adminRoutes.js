const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getDriverApplications,
    getApplicationDetails,
    reviewApplication,
    scheduleMeeting,
    approveApplication,
    rejectApplication,
    removeDriver,
    getAllRides,
    getAllUsers,
    suspendUser,

    getAnalytics,
    createDriver,
    getAIInsights,
    getDriverPayouts,
    processDriverPayout
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, roleMiddleware('admin'));

// ── Driver Application Management ──────────────────────────────
// GET /api/admin/driver-applications?status=pending&city=bangalore
router.get('/driver-applications', getDriverApplications);

// GET /api/admin/driver-applications/:id
router.get('/driver-applications/:id', getApplicationDetails);

// PUT /api/admin/driver-applications/:id/review
router.put('/driver-applications/:id/review', reviewApplication);

// PUT /api/admin/driver-applications/:id/schedule-meeting
router.put('/driver-applications/:id/schedule-meeting', scheduleMeeting);

// PUT /api/admin/driver-applications/:id/approve
router.put('/driver-applications/:id/approve', approveApplication);

// PUT /api/admin/driver-applications/:id/reject
router.put('/driver-applications/:id/reject', rejectApplication);

// ── Driver Management ──────────────────────────────────────────
// POST /api/admin/create-driver
router.post('/create-driver', createDriver);

// PUT /api/admin/remove-driver/:userId
router.put('/remove-driver/:userId', removeDriver);

// ── General Admin ──────────────────────────────────────────────
router.get('/rides', getAllRides);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.get('/analytics', getAnalytics);
router.get('/ai-insights', getAIInsights);

// ── Payout Management ──────────────────────────────────────────
router.get('/payouts', getDriverPayouts);
router.post('/payouts/:driverId/process', processDriverPayout);

// ── Driver Locations (REST fallback for admin map) ─────────────
router.get('/driver-locations', (req, res) => {
    const locationCache = require('../services/locationCache');
    res.json({ drivers: locationCache.getAllDrivers() });
});

module.exports = router;
