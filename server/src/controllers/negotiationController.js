const Negotiation = require('../models/Negotiation');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { suggestCompromise } = require('../services/negotiationAIService');

// @desc    Make an offer or send message
// @route   POST /api/negotiation/offer
const makeOffer = async (req, res, next) => {
    try {
        const { rideId, amount, type = 'offer', text = '' } = req.body;

        // Ensure ride exists and is in valid state
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status === 'confirmed' || ride.status === 'completed' || ride.status === 'cancelled') {
            return res.status(400).json({ message: 'Negotiation is closed for this ride' });
        }

        const isDriver = req.user.role === 'driver';

        // ── GUARD: Driver one-negotiation-at-a-time (only for OFFERS, not messages) ──
        if (isDriver && type === 'offer') {
            // Check driver score
            const driver = await Driver.findOne({ userId: req.user._id });
            if (driver && driver.negotiationScore < 40) {
                return res.status(403).json({
                    message: 'Your negotiation score is too low. You are temporarily blocked from negotiations.'
                });
            }

            // Check if driver is already negotiating a DIFFERENT ride
            const existingNegRide = await Ride.findOne({
                negotiatingDriverId: req.user._id,
                status: 'negotiating',
                _id: { $ne: rideId }
            });
            if (existingNegRide) {
                return res.status(400).json({
                    message: 'You must complete or cancel current negotiation first.'
                });
            }

            // Check if driver already has a confirmed/ongoing ride
            const activeDriverRide = await Ride.findOne({
                $or: [{ driverId: req.user._id }],
                status: { $in: ['confirmed', 'ongoing'] }
            });
            if (activeDriverRide) {
                return res.status(400).json({
                    message: 'You already have an active ride. Complete it first.'
                });
            }

            // Lock ride to this driver if first offer
            if (ride.status === 'pending') {
                ride.status = 'negotiating';
                ride.negotiatingDriverId = req.user._id;
                await ride.save();
            } else if (ride.status === 'negotiating') {
                // Only the locked driver can continue negotiating
                if (ride.negotiatingDriverId &&
                    ride.negotiatingDriverId.toString() !== req.user._id.toString()) {
                    return res.status(400).json({
                        message: 'Another driver is already negotiating this ride.'
                    });
                }
                // If no driver locked yet, lock this one
                if (!ride.negotiatingDriverId) {
                    ride.negotiatingDriverId = req.user._id;
                    await ride.save();
                }
            }
        }

        const negotiation = await Negotiation.create({
            rideId,
            sender: req.user._id,
            role: req.user.role,
            amount: type === 'offer' ? amount : 0,
            type,
            text: type === 'message' ? text : '',
            status: 'active'
        });

        // Get previous offers for AI suggestion
        const prevOffers = await Negotiation.find({ rideId, type: 'offer' })
            .sort({ timestamp: -1 })
            .limit(5);

        const io = req.app.get('io');

        // Socket emission for new offer/message
        if (io) {
            const eventName = type === 'offer' ? 'newOffer' : 'newMessage';
            io.to(`ride_${rideId}`).emit(eventName, negotiation);
        }

        // AI Suggestion (non-blocking, only for offers)
        if (type === 'offer' && prevOffers.length >= 2) {
            try {
                const otherOffer = prevOffers.find(o => o.sender.toString() !== req.user._id.toString());
                if (otherOffer) {
                    const roundNumber = Math.ceil(prevOffers.length / 2);
                    const suggestion = await suggestCompromise({
                        currentOffer: amount,
                        counterOffer: otherOffer.amount,
                        distanceKm: ride.distanceKm || 0,
                        fareRange: ride.aiPrediction || null,
                        roundNumber
                    });

                    if (suggestion && io) {
                        io.to(`ride_${rideId}`).emit('aiSuggestion', {
                            rideId,
                            ...suggestion,
                            timestamp: new Date()
                        });
                    }
                }
            } catch (aiErr) {
                console.error('AI negotiation suggestion failed (non-blocking):', aiErr.message);
            }
        }

        res.status(201).json(negotiation);
    } catch (error) {
        next(error);
    }
};

// @desc    Get negotiation history for a ride
// @route   GET /api/negotiation/:rideId
const getNegotiations = async (req, res, next) => {
    try {
        const negotiations = await Negotiation.find({ rideId: req.params.rideId })
            .populate('sender', 'name')
            .sort({ timestamp: 1 });

        res.json(negotiations);
    } catch (error) {
        next(error);
    }
};

// @desc    Accept an offer
// @route   PUT /api/negotiation/accept/:id
const acceptOffer = async (req, res, next) => {
    try {
        const negotiation = await Negotiation.findById(req.params.id);
        if (!negotiation) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const ride = await Ride.findById(negotiation.rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Explicit guard: ride must still be in negotiable state
        if (['confirmed', 'ongoing', 'completed', 'cancelled'].includes(ride.status)) {
            return res.status(400).json({ message: 'This ride is no longer open for negotiation.' });
        }
        const updatedRide = await Ride.findOneAndUpdate(
            {
                _id: ride._id,
                status: { $in: ['negotiating', 'pending'] }
            },
            {
                'fare.final': negotiation.amount,
                negotiatedFare: negotiation.amount,
                status: 'confirmed',
                otp: Math.floor(1000 + Math.random() * 9000).toString(),
                negotiatingDriverId: null
            },
            { new: true }
        );

        if (!updatedRide) {
            return res.status(400).json({ message: 'Ride was already confirmed' });
        }

        // Update negotiation status
        negotiation.status = 'accepted';
        await negotiation.save();

        // Determine and set the driver
        let driverUserId;
        if (req.user.role === 'driver') {
            driverUserId = req.user._id;
        } else if (negotiation.role === 'driver') {
            driverUserId = negotiation.sender;
        }

        if (driverUserId) {
            updatedRide.driverId = driverUserId;
            await updatedRide.save();

            // Block driver from other negotiations
            await Driver.findOneAndUpdate(
                { userId: driverUserId },
                { isAvailable: false }
            );
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('offerAccepted', {
                negotiation,
                ride: updatedRide
            });
            io.to(`ride_${ride._id}`).emit('rideConfirmed', updatedRide);
            io.to('driver').emit('rideRemovedFromPool', { rideId: ride._id.toString() });
        }

        res.json({ negotiation, ride: updatedRide });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    makeOffer,
    getNegotiations,
    acceptOffer
};
