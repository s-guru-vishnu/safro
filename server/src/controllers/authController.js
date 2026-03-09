const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');
const OTP = require('../models/OTP');
const { sendWelcomeEmail, sendApplicationSubmittedEmail, sendOTPEmail } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

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

        // 📧 Welcome email (non-blocking)
        sendWelcomeEmail({ name, email });

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

        let latestApplication = null;
        if (user.role === 'rider') {
            latestApplication = await DriverApplication.findOne({ userId: user._id })
                .sort({ createdAt: -1 })
                .select('status createdAt');
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
                createdAt: user.createdAt,
                driverApplicationStatus: latestApplication ? latestApplication.status : null
            },
            driverProfile,
            latestApplication
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

        // 📧 Application submitted email (non-blocking)
        sendApplicationSubmittedEmail(
            { name: req.user.name, email: req.user.email },
            { vehicleType: application.vehicleType, vehicleNumber: application.vehicleNumber }
        );

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
// ─── FORGOT PASSWORD FLOW ───────────────────────────────────────

// @desc    Send password reset OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    try {
        const { emailOrPhone } = req.body;
        if (!emailOrPhone) {
            return res.status(400).json({ message: 'Email or phone is required' });
        }

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
        });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email or phone' });
        }

        // Generate 6-digit OTP (shared utility)
        const generateOTP = require('../utils/generateOTP');
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Rate limit: prevent spam (60s cooldown)
        const recentOTP = await OTP.findOne({
            phone: emailOrPhone,
            createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
        });
        if (recentOTP) {
            return res.status(429).json({ message: 'Please wait 60 seconds before requesting again' });
        }

        // Delete old OTPs and save new one
        await OTP.deleteMany({ phone: emailOrPhone });
        await OTP.create({
            phone: emailOrPhone,
            otp: hashedOTP,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        // Send OTP based on input type
        const isEmail = emailOrPhone.includes('@');

        if (isEmail) {
            // Send via Email
            sendOTPEmail(user, otp, 'Password Reset');
        } else {
            // Send via WhatsApp
            const { sendWhatsAppMessage } = require('../services/whatsappService');
            const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES || 5;
            const whatsappMessage = `🔐 Safro OTP Verification\n\nYour OTP is: ${otp}\n\nValid for ${OTP_EXPIRY_MINUTES} minutes.\nDo not share this code with anyone.`;
            sendWhatsAppMessage(emailOrPhone, whatsappMessage).catch(console.error);
        }

        res.json({ message: 'OTP sent successfully', emailOrPhone, otp });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
const verifyResetOTP = async (req, res, next) => {
    try {
        const { emailOrPhone, otp } = req.body;
        if (!emailOrPhone || !otp) {
            return res.status(400).json({ message: 'Email/phone and OTP are required' });
        }

        const otpRecord = await OTP.findOne({ phone: emailOrPhone });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not found' });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Too many failed attempts. Request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        res.json({ message: 'OTP verified', verified: true });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
    try {
        const { emailOrPhone, otp, newPassword } = req.body;
        if (!emailOrPhone || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify OTP one more time
        const otpRecord = await OTP.findOne({ phone: emailOrPhone });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Find user
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Clean up OTP
        await OTP.deleteMany({ phone: emailOrPhone });

        // Send confirmation email
        if (user.email) {
            sendEmail(user.email, '✅ Password Changed — Safro',
                `<div style="font-family:'Segoe UI',sans-serif;padding:20px;"><h2>Password Changed</h2><p>Hi ${user.name}, your Safro password was changed successfully. If this wasn't you, contact support immediately.</p></div>`
            ).catch(console.error);
        }

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
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
    googleCallback,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};
