const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Register user
// @route POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, guardianPhone, guardianEmail, vehicleType, vehicleNumber, licenseNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: role || 'rider',
            guardianPhone,
            guardianEmail
        });

        // If driver, create driver profile
        if (role === 'driver') {
            await Driver.create({
                userId: user._id,
                vehicleType: vehicleType || 'sedan',
                vehicleNumber: vehicleNumber || '',
                licenseNumber: licenseNumber || ''
            });
        }

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc Get profile
// @route GET /api/auth/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        let driverProfile = null;

        if (user.role === 'driver') {
            driverProfile = await Driver.findOne({ userId: user._id });
        }

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                guardianPhone: user.guardianPhone,
                guardianEmail: user.guardianEmail,
                profileImage: user.profileImage,
                createdAt: user.createdAt
            },
            driverProfile
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Update profile
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone, guardianPhone, guardianEmail } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, guardianPhone, guardianEmail },
            { new: true, runValidators: true }
        );

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').trim().notEmpty().withMessage('Phone is required')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    registerValidation,
    loginValidation
};
