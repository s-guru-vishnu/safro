const User = require('../models/User');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');

// @desc Get all rides
// @route GET /api/admin/rides
const getAllRides = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;

        const query = statusFilter ? { status: statusFilter } : {};

        const [rides, total] = await Promise.all([
            Ride.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('riderId', 'name email phone')
                .populate('driverId', 'name email phone'),
            Ride.countDocuments(query)
        ]);

        res.json({
            rides,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rides' });
    }
};

// @desc Get all users
// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const roleFilter = req.query.role;

        const query = roleFilter ? { role: roleFilter } : {};

        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(query)
        ]);

        res.json({
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc Suspend / unsuspend user
// @route PUT /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({ message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// @desc Get analytics
// @route GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        const [totalUsers, totalRiders, totalDrivers, totalRides, completedRides, cancelledRides, activeRides, payments] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'rider' }),
            User.countDocuments({ role: 'driver' }),
            Ride.countDocuments(),
            Ride.countDocuments({ status: 'completed' }),
            Ride.countDocuments({ status: 'cancelled' }),
            Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'on_trip'] } }),
            Payment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
            ])
        ]);

        const totalRevenue = payments.length > 0 ? payments[0].totalRevenue : 0;

        // Recent rides (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentRidesByDay = await Ride.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$fare' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalUsers,
            totalRiders,
            totalDrivers,
            totalRides,
            completedRides,
            cancelledRides,
            activeRides,
            totalRevenue,
            recentRidesByDay
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};
// @desc Create a new driver (admin only)
// @route POST /api/admin/create-driver
const createDriver = async (req, res) => {
    try {
        const { name, email, password, phone, vehicleType, vehicleNumber, licenseNumber, aadhaar, rc, insurance } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user with driver role
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'driver'
        });

        // Create driver profile (admin-verified)
        const driver = await Driver.create({
            userId: user._id,
            vehicleType: vehicleType || 'sedan',
            vehicleNumber: vehicleNumber || '',
            licenseNumber: licenseNumber || '',
            aadhaar: aadhaar || '',
            rc: rc || '',
            insurance: insurance || '',
            approvedByAdmin: true,
            status: 'verified'
        });

        res.status(201).json({
            message: 'Driver created and verified successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            driver
        });
    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ message: 'Error creating driver' });
    }
};

module.exports = { getAllRides, getAllUsers, suspendUser, getAnalytics, createDriver };
