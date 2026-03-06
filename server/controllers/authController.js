const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateOTP, sendOTPViaEmail, sendOTPViaSMS } = require('../services/otpService');

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

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            guardianPhone: user.guardianPhone,
            guardianEmail: user.guardianEmail,
            profileImage: user.profileImage,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Forgot password
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { emailOrPhone } = req.body;

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = otpExpires;
        await user.save();

        let sent = false;
        if (emailOrPhone.includes('@')) {
            sent = await sendOTPViaEmail(user.email, otp);
        } else {
            sent = await sendOTPViaSMS(user.phone, otp);
        }

        if (!sent) {
            // Even if sending failed (due to missing credentials), we return 200 to avoid email harvesting
            // and log the OTP for development purposes if credentials are missing
            if (process.env.NODE_ENV !== 'production') {
                console.log(`DEV ONLY: OTP for ${emailOrPhone} is ${otp}`);
            }
        }

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Verify OTP
// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    try {
        const { emailOrPhone, otp } = req.body;

        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully', success: true });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Reset password
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { emailOrPhone, otp, newPassword } = req.body;

        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Strong password check on backend again just in case
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password does not meet strength requirements' });
        }

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
        .isEmail().withMessage('Valid email is required')
        .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/).withMessage('Only Gmail addresses are allowed'),
    body('password')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol'),
    body('phone').trim().notEmpty().withMessage('Phone is required')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
    forgotPassword,
    verifyOTP,
    resetPassword,
    register,
    login,
    getProfile,
    updateProfile,
    registerValidation,
    loginValidation
};
