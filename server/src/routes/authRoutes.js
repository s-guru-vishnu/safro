const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    applyAsDriver,
    getMyApplicationStatus,
    registerValidation,
    loginValidation,
    googleCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/profile
router.get('/profile', protect, getProfile);

// PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

// POST /api/auth/apply-driver
router.post('/apply-driver', protect, applyAsDriver);

// GET /api/auth/application-status
router.get('/application-status', protect, getMyApplicationStatus);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

module.exports = router;
