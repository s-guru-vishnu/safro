const User = require('../models/User');
const Driver = require('../models/Driver');
const DriverApplication = require('../models/DriverApplication');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const { sendApplicationApprovedEmail, sendApplicationRejectedEmail, sendMeetingScheduledEmail } = require('../services/notificationService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

// ──────────────────────────────────────────────────────────────
// DRIVER APPLICATION MANAGEMENT
// ──────────────────────────────────────────────────────────────

// @desc    Get all driver applications (filterable by status & city)
// @route   GET /api/admin/driver-applications
const getDriverApplications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.city) query.city = new RegExp(req.query.city, 'i');

        // REGIONAL FILTER: Admins only see apps from their taluk (if set)
        if (req.user.role === 'admin' && req.user.taluk) {
            query.taluk = req.user.taluk;
        }

        const [applications, total] = await Promise.all([
            DriverApplication.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name email phone')
                .populate('reviewedBy', 'name email'),
            DriverApplication.countDocuments(query)
        ]);

        res.json({
            applications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single driver application details
// @route   GET /api/admin/driver-applications/:id
const getApplicationDetails = async (req, res, next) => {
    try {
        const application = await DriverApplication.findById(req.params.id)
            .populate('userId', 'name email phone address')
            .populate('reviewedBy', 'name email');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json({ application });
    } catch (error) {
        next(error);
    }
};

// @desc    Review application (mark as under_review)
// @route   PUT /api/admin/driver-applications/:id/review
const reviewApplication = async (req, res, next) => {
    try {
        const application = await DriverApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (!['pending', 'meeting_scheduled'].includes(application.status)) {
            return res.status(400).json({ message: `Cannot move ${application.status} application to under review` });
        }

        application.status = 'under_review';
        application.reviewedBy = req.user._id;
        if (req.body.adminNotes) application.adminNotes = req.body.adminNotes;
        await application.save();

        // Notify the applicant in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(application.userId.toString()).emit('applicationUpdate', {
                applicationId: application._id,
                status: 'under_review',
                message: 'Your driver application is under review'
            });
        }

        res.json({ message: 'Application marked as under review', application });
    } catch (error) {
        next(error);
    }
};

// @desc    Schedule offline meeting with driver applicant
// @route   PUT /api/admin/driver-applications/:id/schedule-meeting
const scheduleMeeting = async (req, res, next) => {
    try {
        const { scheduledDate, location, notes } = req.body;

        if (!scheduledDate || !location) {
            return res.status(400).json({ message: 'Meeting date and location are required' });
        }

        const application = await DriverApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (!['pending', 'under_review'].includes(application.status)) {
            return res.status(400).json({ message: `Cannot schedule meeting for ${application.status} application` });
        }

        application.status = 'meeting_scheduled';
        application.reviewedBy = req.user._id;
        application.meeting = {
            scheduledDate: new Date(scheduledDate),
            location,
            notes: notes || '',
            completed: false
        };
        await application.save();

        // Notify applicant about the meeting via socket
        const io = req.app.get('io');
        if (io) {
            io.to(application.userId.toString()).emit('meetingScheduled', {
                applicationId: application._id,
                meeting: application.meeting,
                message: `Offline verification meeting scheduled on ${new Date(scheduledDate).toLocaleDateString()} at ${location}`
            });
        }

        // Send SMS notification
        try {
            const user = await User.findById(application.userId);
            if (user && user.phone) {
                const message = `Hi ${user.name}, your Safro driver application is under review. Please visit ${location} on ${new Date(scheduledDate).toLocaleDateString()} for offline document verification. Notes: ${notes || 'Bring all original documents.'}`;
                await sendWhatsAppMessage(user.phone, message);
            }
            // 📧 Email: Meeting Scheduled (non-blocking)
            if (user) {
                sendMeetingScheduledEmail(
                    { name: user.name, email: user.email },
                    { scheduledDate, location, notes }
                );
            }
        } catch (smsError) {
            console.error('Failed to send verification SMS:', smsError.message);
            // Don't fail the whole request just because SMS failed
        }

        res.json({
            message: 'Meeting scheduled successfully',
            application
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve driver application (after meeting)
// @route   PUT /api/admin/driver-applications/:id/approve
const approveApplication = async (req, res, next) => {
    try {
        const application = await DriverApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status === 'approved') {
            return res.status(400).json({ message: 'Application is already approved' });
        }

        if (application.status === 'rejected') {
            return res.status(400).json({ message: 'Cannot approve a rejected application' });
        }

        // Mark meeting as completed
        if (application.meeting) {
            application.meeting.completed = true;
        }

        application.status = 'approved';
        application.reviewedBy = req.user._id;
        if (req.body.adminNotes) application.adminNotes = req.body.adminNotes;
        await application.save();

        // Promote user to driver
        const user = await User.findById(application.userId);
        if (user) {
            user.role = 'driver';
            await user.save();

            // Create driver profile with application data
            await Driver.create({
                userId: user._id,
                vehicleType: application.vehicleType,
                vehicleModel: application.vehicleModel,
                vehicleNumber: application.vehicleNumber,
                vehicleColor: application.vehicleColor,
                licenseNumber: application.licenseNumber,
                upiId: application.upiId,
                taluk: application.taluk,
                currentLocation: application.homeLocation && application.homeLocation.coordinates[0] !== 0
                    ? application.homeLocation
                    : { type: 'Point', coordinates: [77.5946, 12.9716] } // Default to Bengaluru if no home location
            });
        }

        // Notify applicant
        const io = req.app.get('io');
        if (io) {
            io.to(application.userId.toString()).emit('applicationUpdate', {
                applicationId: application._id,
                status: 'approved',
                message: 'Congratulations! Your driver application has been approved. You can now start accepting rides.'
            });
        }

        // 📧 Email: Application Approved (non-blocking)
        if (user) {
            sendApplicationApprovedEmail({ name: user.name, email: user.email });
        }

        res.json({
            message: 'Driver application approved. User is now a driver.',
            application
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject driver application
// @route   PUT /api/admin/driver-applications/:id/reject
const rejectApplication = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const application = await DriverApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (['approved', 'rejected'].includes(application.status)) {
            return res.status(400).json({ message: `Application is already ${application.status}` });
        }

        application.status = 'rejected';
        application.rejectionReason = reason || 'Application did not meet requirements';
        application.reviewedBy = req.user._id;
        if (application.meeting) application.meeting.completed = true;
        await application.save();

        // Notify applicant
        const io = req.app.get('io');
        if (io) {
            io.to(application.userId.toString()).emit('applicationUpdate', {
                applicationId: application._id,
                status: 'rejected',
                message: 'Your driver application was not approved.',
                reason: application.rejectionReason
            });
        }

        // 📧 Email: Application Rejected (non-blocking)
        try {
            const applicantUser = await User.findById(application.userId);
            if (applicantUser) {
                sendApplicationRejectedEmail({ name: applicantUser.name, email: applicantUser.email }, application.rejectionReason);
            }
        } catch (e) { /* non-blocking */ }

        res.json({ message: 'Application rejected', application });
    } catch (error) {
        next(error);
    }
};

// ──────────────────────────────────────────────────────────────
// DRIVER MANAGEMENT (direct admin actions)
// ──────────────────────────────────────────────────────────────

// @desc    Remove driver role (demote to rider)
// @route   PUT /api/admin/remove-driver/:userId
const removeDriver = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'driver') {
            return res.status(400).json({ message: 'User is not a driver' });
        }

        user.role = 'rider';
        await user.save();

        await Driver.findOneAndDelete({ userId: user._id });

        res.json({
            message: 'Driver role removed successfully',
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};

// ──────────────────────────────────────────────────────────────
// GENERAL ADMIN
// ──────────────────────────────────────────────────────────────

// @desc    Get all rides
// @route   GET /api/admin/rides
const getAllRides = async (req, res, next) => {
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
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const roleFilter = req.query.role;

        // Exclude admin users by default, only show if explicitly filtered
        const query = roleFilter
            ? { role: roleFilter }
            : { role: { $ne: 'admin' } };

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        // For driver users, populate driver profile details
        const Driver = require('../models/Driver');
        const driverUserIds = users.filter(u => u.role === 'driver').map(u => u._id);
        const driverProfiles = driverUserIds.length > 0
            ? await Driver.find({ userId: { $in: driverUserIds } }).lean()
            : [];
        const driverMap = {};
        driverProfiles.forEach(d => { driverMap[d.userId.toString()] = d; });

        const enrichedUsers = users.map(u => {
            if (u.role === 'driver' && driverMap[u._id.toString()]) {
                return { ...u, driverProfile: driverMap[u._id.toString()] };
            }
            return u;
        });

        res.json({
            users: enrichedUsers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Suspend / unsuspend user
// @route   PUT /api/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({ message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
    try {
        const [totalUsers, totalRiders, totalDrivers, totalRides, completedRides, cancelledRides, activeRides, pendingApplications, payments] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'rider' }),
            User.countDocuments({ role: 'driver' }),
            Ride.countDocuments(),
            Ride.countDocuments({ status: 'completed' }),
            Ride.countDocuments({ status: 'cancelled' }),
            Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'on_trip'] } }),
            DriverApplication.countDocuments({
                status: { $in: ['pending', 'under_review', 'meeting_scheduled'] },
                ...(req.user.role === 'admin' && req.user.taluk ? { taluk: req.user.taluk } : {})
            }),
            Payment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
            ])
        ]);

        const totalRevenue = payments.length > 0 ? payments[0].totalRevenue : 0;

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
            pendingApplications,
            totalRevenue,
            recentRidesByDay
        });
    } catch (error) {
        console.error('Analytics error:', error);
        next(error);
    }
};

// @desc    Create a new driver (Admin only)
// @route   POST /api/admin/create-driver
const createDriver = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            vehicleType,
            vehicleModel,
            vehicleNumber,
            vehicleColor,
            licenseNumber,
            city,
            taluk
        } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create User with role 'driver'
        const user = await User.create({
            name,
            email,
            password, // In a real app, you might auto-generate this and email it
            phone,
            role: 'driver',
            isVerified: true, // Admin created, so auto-verify
            taluk
        });

        // Create Driver Profile
        const driver = await Driver.create({
            userId: user._id,
            vehicleType,
            vehicleModel,
            vehicleNumber,
            vehicleColor,
            licenseNumber,
            city,
            taluk,
            isAvailable: true,
            status: 'approved'
        });

        res.status(201).json({
            message: 'Driver created successfully',
            driver: {
                ...driver.toObject(),
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get AI insights for admin dashboard
// @route   GET /api/admin/ai-insights
const getAIInsights = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Avg negotiated fare (completed rides with final fare)
        const fareAgg = await Ride.aggregate([
            { $match: { status: 'completed', 'fare.final': { $exists: true, $gt: 0 }, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, avgFare: { $avg: '$fare.final' }, count: { $sum: 1 } } }
        ]);

        // AI flagged rides
        const flaggedRides = await Ride.countDocuments({ 'fraudFlag.flagged': true, createdAt: { $gte: thirtyDaysAgo } });

        // Lowball offers: rides where proposed fare is < 50% of AI suggested
        const lowballAgg = await Ride.aggregate([
            {
                $match: {
                    'aiPrediction.suggestedFare': { $exists: true, $gt: 0 },
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $project: {
                    isLowball: { $lt: ['$fare.proposed', { $multiply: ['$aiPrediction.suggestedFare', 0.5] }] }
                }
            },
            { $match: { isLowball: true } },
            { $count: 'total' }
        ]);

        // Driver performance: top 5 by completed rides
        const topDrivers = await Ride.aggregate([
            { $match: { status: 'completed', driverId: { $exists: true }, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$driverId', completedRides: { $sum: 1 }, avgFare: { $avg: '$fare.final' } } },
            { $sort: { completedRides: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { name: '$user.name', completedRides: 1, avgFare: { $round: ['$avgFare', 0] } } }
        ]);

        res.json({
            avgNegotiatedFare: fareAgg[0]?.avgFare ? Math.round(fareAgg[0].avgFare) : 0,
            totalCompletedRides: fareAgg[0]?.count || 0,
            flaggedRides,
            lowballOffers: lowballAgg[0]?.total || 0,
            topDrivers
        });
    } catch (error) {
        console.error('AI insights error:', error);
        next(error);
    }
};

// @desc    Get all driver payout balances
// @route   GET /api/admin/payouts
const getDriverPayouts = async (req, res, next) => {
    try {
        const drivers = await Driver.find({ payoutBalance: { $gt: 0 } })
            .populate('userId', 'name email phone');

        res.json({
            count: drivers.length,
            drivers: drivers.map(d => ({
                driverId: d._id,
                userId: d.userId._id,
                name: d.userId.name,
                email: d.userId.email,
                phone: d.userId.phone,
                balance: d.payoutBalance,
                upiId: d.upiId,
                lastPushed: d.updatedAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Process payout for a driver (marks as paid)
// @route   POST /api/admin/payouts/:driverId/process
const processDriverPayout = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const driver = await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const payoutAmount = driver.payoutBalance;
        if (payoutAmount <= 0) {
            return res.status(400).json({ message: 'No balance to pay out' });
        }

        // In a real app, you would integrate with Razorpay Payouts API here.
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
