const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
    register,
    login,
    getProfile,
    updateProfile,
    applyAsDriver,
    getMyApplicationStatus,
    registerValidation,
    loginValidation,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed`,
    }),
    (req, res) => {
        try {
            const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);
        } catch (error) {
            console.error('Google callback token error:', error);
            res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed`);
        }
    }
);

module.exports = router;
