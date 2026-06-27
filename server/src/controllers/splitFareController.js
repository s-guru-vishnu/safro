const SplitFare = require('../models/SplitFare');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const { calculateCommission } = require('../services/commissionService');

// ═══════════════════════════════════════════════════════════════
//  SPLIT FARE CONTROLLER
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/split-fare/create
 * Create a split fare for a ride
 */
const createSplitFare = async (req, res, next) => {
    try {
        const { rideId, splitType, maxPassengers } = req.body;

        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (ride.riderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the ride creator can enable split fare' });
        }
        if (ride.splitFareId) {
            return res.status(400).json({ message: 'Split fare already exists for this ride' });
        }

        const fare = ride.negotiatedFare || ride.fare?.final || ride.fare?.proposed || 0;

        const splitFare = await SplitFare.create({
            rideId: ride._id,
            createdBy: req.user._id,
            totalFare: fare,
            splitType: splitType || 'equal',
            maxPassengers: Math.min(maxPassengers || 4, 6),
            passengers: [{
                userId: req.user._id,
                phone: req.user.phone || '',
                name: req.user.name,
                amount: fare, // Initially creator pays full; recalculated when others join
                inviteStatus: 'accepted',
                respondedAt: new Date()
            }]
        });

        ride.splitFareId = splitFare._id;
        await ride.save();

        res.status(201).json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/split-fare/invite
 * Invite a user by phone number
 */
const invitePassenger = async (req, res, next) => {
    try {
        const { splitFareId, phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        const splitFare = await SplitFare.findById(splitFareId);
        if (!splitFare) return res.status(404).json({ message: 'Split fare not found' });
        if (splitFare.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can invite passengers' });
        }
        if (splitFare.status === 'cancelled' || splitFare.status === 'settled') {
            return res.status(400).json({ message: 'Cannot invite to a settled or cancelled split' });
        }

        // Check max passengers
        const activePassengers = splitFare.passengers.filter(
            p => p.inviteStatus !== 'rejected' && p.inviteStatus !== 'expired'
        );
        if (activePassengers.length >= splitFare.maxPassengers) {
            return res.status(400).json({ message: `Maximum ${splitFare.maxPassengers} passengers allowed` });
        }

        // Check duplicate
        const existing = splitFare.passengers.find(p => p.phone === phone);
        if (existing) {
            return res.status(400).json({ message: 'This person has already been invited' });
        }

        // Look up user by phone
        const invitedUser = await User.findOne({ phone: phone.trim() });

        splitFare.passengers.push({
            userId: invitedUser ? invitedUser._id : null,
            phone,
            name: invitedUser ? invitedUser.name : phone,
            inviteStatus: 'invited',
            invitedAt: new Date()
        });

        // Recalculate shares (include invited users in preview)
        if (splitFare.splitType === 'equal' && splitFare.totalFare) {
            const allActive = splitFare.passengers.filter(
                p => p.inviteStatus !== 'rejected' && p.inviteStatus !== 'expired'
            );
            const share = Math.ceil(splitFare.totalFare / allActive.length);
            allActive.forEach(p => { p.amount = share; });
            const total = share * allActive.length;
            if (total > splitFare.totalFare) {
                allActive[allActive.length - 1].amount -= (total - splitFare.totalFare);
            }
        }

        await splitFare.save();

        // Socket notification to invited user
        if (invitedUser) {
            const io = req.app.get('io');
            if (io) {
                io.to(invitedUser._id.toString()).emit('splitFareInvite', {
                    splitFareId: splitFare._id,
                    rideId: splitFare.rideId,
                    invitedBy: req.user.name,
                    inviteCode: splitFare.inviteCode,
                    amount: splitFare.passengers.find(p => p.userId?.toString() === invitedUser._id.toString())?.amount || 0,
                    message: `${req.user.name} invited you to split a ride fare!`
                });
            }
        }

        res.json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/split-fare/respond
 * Accept or reject an invite
 */
const respondToInvite = async (req, res, next) => {
    try {
        const { splitFareId, response } = req.body; // response: 'accepted' | 'rejected'
        if (!['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({ message: 'Response must be accepted or rejected' });
        }

        const splitFare = await SplitFare.findById(splitFareId);
        if (!splitFare) return res.status(404).json({ message: 'Split fare not found' });

        // Find the passenger entry for this user
        const passenger = splitFare.passengers.find(
            p => p.userId?.toString() === req.user._id.toString() ||
                 p.phone === req.user.phone
        );
        if (!passenger) {
            return res.status(404).json({ message: 'You are not invited to this split' });
        }
        if (passenger.inviteStatus !== 'invited') {
            return res.status(400).json({ message: `Already ${passenger.inviteStatus}` });
        }

        // Check expiry
        if (new Date() > splitFare.inviteExpiry) {
            passenger.inviteStatus = 'expired';
            await splitFare.save();
            return res.status(400).json({ message: 'Invite has expired' });
        }

        passenger.inviteStatus = response;
        passenger.respondedAt = new Date();
        if (passenger.userId === null) {
            passenger.userId = req.user._id;
            passenger.name = req.user.name;
        }

        // Recalculate shares
        splitFare.recalculateShares();

        // If at least 2 accepted, set status to active
        const acceptedCount = splitFare.passengers.filter(p => p.inviteStatus === 'accepted').length;
        if (acceptedCount >= 2 && splitFare.status === 'pending') {
            splitFare.status = 'active';
        }

        await splitFare.save();

        // Notify creator
        const io = req.app.get('io');
        if (io) {
            io.to(splitFare.createdBy.toString()).emit('splitFareResponse', {
                splitFareId: splitFare._id,
                userName: req.user.name,
                response,
                splitFare
            });

            // Notify all accepted passengers
            splitFare.passengers.forEach(p => {
                if (p.userId && p.inviteStatus === 'accepted') {
                    io.to(p.userId.toString()).emit('splitFareUpdated', { splitFare });
                }
            });
        }

        res.json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/split-fare/:rideId
 * Get split fare details for a ride
 */
const getSplitFare = async (req, res, next) => {
    try {
        const splitFare = await SplitFare.findOne({ rideId: req.params.rideId })
            .populate('passengers.userId', 'name email phone profileImage');

        if (!splitFare) return res.status(404).json({ message: 'No split fare for this ride' });

        // Check authorization — must be creator or a passenger
        const isParticipant = splitFare.createdBy.toString() === req.user._id.toString() ||
            splitFare.passengers.some(p => p.userId?._id?.toString() === req.user._id.toString() || p.userId?.toString() === req.user._id.toString());

        if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to view this split fare' });
        }

        // Update fare from ride if it changed (e.g., after negotiation)
        const ride = await Ride.findById(req.params.rideId);
        if (ride) {
            const currentFare = ride.negotiatedFare || ride.fare?.final || ride.fare?.proposed || 0;
            if (currentFare !== splitFare.totalFare && currentFare > 0) {
                splitFare.totalFare = currentFare;
                splitFare.recalculateShares();
                await splitFare.save();
            }
        }

        res.json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/split-fare/pay
 * Pay individual share via wallet
 */
const payShare = async (req, res, next) => {
    try {
        const { splitFareId, method } = req.body; // method: 'wallet' | 'razorpay'

        const splitFare = await SplitFare.findById(splitFareId);
        if (!splitFare) return res.status(404).json({ message: 'Split fare not found' });

        const passenger = splitFare.passengers.find(
            p => p.userId?.toString() === req.user._id.toString()
        );
        if (!passenger) return res.status(403).json({ message: 'You are not a participant' });
        if (passenger.inviteStatus !== 'accepted') {
            return res.status(400).json({ message: 'You must accept the invite first' });
        }
        if (passenger.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Already paid' });
        }

        const amount = passenger.amount;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid share amount' });
        }

        const ride = await Ride.findById(splitFare.rideId);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (method === 'wallet') {
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (user.walletBalance < amount) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }

            // Debit wallet
            user.walletBalance -= amount;
            await user.save();

            await WalletTransaction.create({
                userId: user._id,
                amount,
                type: 'debit',
                source: 'ride',
                status: 'completed',
                referenceId: ride._id.toString(),
                description: `Split Fare - Ride #${ride._id.toString().slice(-6)}`
            });

            // Create payment record
            const payment = await Payment.create({
                rideId: ride._id,
                riderId: req.user._id,
                driverId: ride.driverId || req.user._id,
                amount,
                method: 'wallet',
                status: 'completed',
                splitFareId: splitFare._id
            });

            // Update passenger payment status
            passenger.paymentStatus = 'paid';
            passenger.paymentId = payment._id;
            passenger.paymentMethod = 'wallet';
            passenger.paidAt = new Date();

            // Check if all accepted passengers have paid
            if (splitFare.isFullyPaid()) {
                splitFare.status = 'settled';

                // Update ride payment status
                ride.paymentStatus = 'Paid';
                ride.paymentMethod = 'wallet';
                ride.paidAt = new Date();

                const totalFare = splitFare.totalFare;
                const { platformCommission, driverAmount } = calculateCommission(totalFare);
                ride.platformCommission = platformCommission;
                ride.driverAmount = driverAmount;
                await ride.save();

                // Credit driver
                if (ride.driverId) {
                    const Driver = require('../models/Driver');
                    await Driver.findOneAndUpdate(
                        { userId: ride.driverId },
                        { $inc: { payoutBalance: driverAmount } }
                    );
                }
            }

            await splitFare.save();

            // Socket notifications
            const io = req.app.get('io');
            if (io) {
                splitFare.passengers.forEach(p => {
                    if (p.userId) {
                        io.to(p.userId.toString()).emit('splitFarePayment', {
                            splitFareId: splitFare._id,
                            paidBy: req.user.name,
                            splitFare
                        });
                    }
                });

                if (splitFare.status === 'settled') {
                    splitFare.passengers.forEach(p => {
                        if (p.userId) {
                            io.to(p.userId.toString()).emit('splitFareSettled', {
                                splitFareId: splitFare._id,
                                rideId: ride._id
                            });
                        }
                    });
                    io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'split' });
                }
            }

            res.json({
                status: 'success',
                splitFare,
                newBalance: user.walletBalance
            });
        } else {
            // For razorpay: return order info, actual payment verified in separate endpoint
            return res.status(400).json({ message: 'Use /api/payment/create-order for Razorpay split payments' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/split-fare/join/:code
 * Join a split fare via shareable invite code
 */
const joinByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const splitFare = await SplitFare.findOne({ inviteCode: code });
        if (!splitFare) return res.status(404).json({ message: 'Invalid invite code' });

        if (new Date() > splitFare.inviteExpiry) {
            return res.status(400).json({ message: 'Invite has expired' });
        }
        if (splitFare.status === 'cancelled' || splitFare.status === 'settled') {
            return res.status(400).json({ message: 'This split fare is no longer active' });
        }

        // Check if already a participant
        const existing = splitFare.passengers.find(
            p => p.userId?.toString() === req.user._id.toString()
        );
        if (existing) {
            return res.json({ splitFare, message: 'You are already in this split' });
        }

        // Check max
        const activePassengers = splitFare.passengers.filter(
            p => p.inviteStatus !== 'rejected' && p.inviteStatus !== 'expired'
        );
        if (activePassengers.length >= splitFare.maxPassengers) {
            return res.status(400).json({ message: 'This split is full' });
        }

        // Add as accepted directly (they chose to join)
        splitFare.passengers.push({
            userId: req.user._id,
            phone: req.user.phone || '',
            name: req.user.name,
            inviteStatus: 'accepted',
            respondedAt: new Date()
        });

        splitFare.recalculateShares();
        if (splitFare.status === 'pending') splitFare.status = 'active';
        await splitFare.save();

        // Notify all participants
        const io = req.app.get('io');
        if (io) {
            splitFare.passengers.forEach(p => {
                if (p.userId) {
                    io.to(p.userId.toString()).emit('splitFareUpdated', { splitFare });
                }
            });
        }

        res.json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/split-fare/:id/remove/:userId
 * Remove a passenger (creator only)
 */
const removePassenger = async (req, res, next) => {
    try {
        const { id, userId } = req.params;
        const splitFare = await SplitFare.findById(id);
        if (!splitFare) return res.status(404).json({ message: 'Split fare not found' });

        if (splitFare.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can remove passengers' });
        }
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot remove yourself' });
        }

        const passengerIdx = splitFare.passengers.findIndex(
            p => p.userId?.toString() === userId
        );
        if (passengerIdx === -1) {
            return res.status(404).json({ message: 'Passenger not found' });
        }

        const removed = splitFare.passengers[passengerIdx];
        if (removed.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Cannot remove a passenger who has already paid' });
        }

        splitFare.passengers.splice(passengerIdx, 1);
        splitFare.recalculateShares();
        await splitFare.save();

        // Notify removed user
        const io = req.app.get('io');
        if (io && removed.userId) {
            io.to(removed.userId.toString()).emit('splitFareRemoved', {
                splitFareId: splitFare._id,
                message: 'You have been removed from the fare split'
            });
            // Notify remaining
            splitFare.passengers.forEach(p => {
                if (p.userId) {
                    io.to(p.userId.toString()).emit('splitFareUpdated', { splitFare });
                }
            });
        }

        res.json({ splitFare });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/split-fare/my-splits
 * Get all split fares where the user is a participant
 */
const getMySplits = async (req, res, next) => {
    try {
        const splits = await SplitFare.find({
            'passengers.userId': req.user._id,
            status: { $nin: ['cancelled'] }
        })
        .populate('rideId', 'pickupLocation dropLocation status fare negotiatedFare')
        .sort({ createdAt: -1 })
        .limit(20);

        res.json({ splits });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSplitFare,
    invitePassenger,
    respondToInvite,
    getSplitFare,
    payShare,
    joinByCode,
    removePassenger,
    getMySplits
};
