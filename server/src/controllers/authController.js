const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
            });
        }

        const { name, email, password, phone, guardianPhone, guardianEmail } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Users can only self-register as 'rider'
        // Drivers are appointed by admin only
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'rider',
            guardianPhone,
            guardianEmail
        });

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
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
            });
        }

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
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res, next) => {
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
                walletBalance: user.walletBalance,
                quickPayEnabled: user.quickPayEnabled,
                defaultPaymentMethod: user.defaultPaymentMethod,
                createdAt: user.createdAt
            },
            driverProfile
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
    try {
        const updateData = {};
        const allowedUpdates = ['name', 'phone', 'guardianPhone', 'guardianEmail', 'quickPayEnabled', 'defaultPaymentMethod', 'profileImage', 'taluk'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

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
                walletBalance: user.walletBalance,
                quickPayEnabled: user.quickPayEnabled,
                defaultPaymentMethod: user.defaultPaymentMethod,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
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

// @desc    Apply to become a driver
// @route   POST /api/auth/apply-driver
const DriverApplication = require('../models/DriverApplication');

const applyAsDriver = async (req, res, next) => {
    try {
        const {
            // Step 1: Personal
            profilePhoto,
            // Step 2: License
            licenseNumber, dateOfBirth, licenseExpiry, licenseImage,
            // Step 3: Aadhaar
            aadhaarNumber, aadhaarImage,
            // Step 4: Vehicle
            vehicleType, vehicleModel, vehicleNumber, vehicleColor, manufacturingYear,
            // Step 5: Insurance & RC
            insurancePolicyNumber, insuranceExpiry, insuranceDocument,
            rcNumber, rcDocument,
            // Step 6: Address
            city, address, taluk
        } = req.body;

        if (!vehicleType || !vehicleNumber || !licenseNumber || !taluk) {
            return res.status(400).json({
                message: 'Vehicle type, vehicle number, license number, and taluk are required'
            });
        }

        // Check if user already has an active application
        const existingApplication = await DriverApplication.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'under_review', 'meeting_scheduled'] }
        });

        if (existingApplication) {
            return res.status(400).json({
                message: 'You already have an active driver application',
                application: existingApplication
            });
        }

        if (req.user.role === 'driver') {
            return res.status(400).json({ message: 'You are already a driver' });
        }

        const application = await DriverApplication.create({
            userId: req.user._id,
            profilePhoto: profilePhoto || '',
            licenseNumber,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
            licenseImage: licenseImage || '',
            aadhaarNumber: aadhaarNumber || '',
            aadhaarImage: aadhaarImage || '',
            vehicleType,
            vehicleModel: vehicleModel || '',
            vehicleNumber,
            vehicleColor: vehicleColor || '',
            manufacturingYear: manufacturingYear || null,
            insurancePolicyNumber: insurancePolicyNumber || '',
            insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
            insuranceDocument: insuranceDocument || '',
            rcNumber: rcNumber || '',
            rcDocument: rcDocument || '',
            city: city || '',
            address: address || '',
            taluk: taluk || ''
        });

        // Notify admin about new application
        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('newDriverApplication', {
                applicationId: application._id,
                applicantName: req.user.name,
                vehicleType: application.vehicleType
            });
        }

        res.status(201).json({
            message: 'Driver application submitted successfully. An admin will review and contact you for verification.',
            application
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my driver application status
// @route   GET /api/auth/application-status
const getMyApplicationStatus = async (req, res, next) => {
    try {
        const applications = await DriverApplication.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('reviewedBy', 'name');

        res.json({ applications });
    } catch (error) {
        next(error);
    }
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
const googleCallback = async (req, res) => {
    try {
        // User is attached to req.user by passport
        const user = req.user;
        const token = generateToken(user._id);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
    } catch (error) {
        console.error('Google Callback Error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=GoogleAuthFailed`);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    applyAsDriver,
    getMyApplicationStatus,
    registerValidation,
    loginValidation,
    googleCallback
};
