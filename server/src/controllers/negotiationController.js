const Negotiation = require('../models/Negotiation');
const Ride = require('../models/Ride');
const { suggestCompromise } = require('../services/negotiationAIService');

// @desc    Make an offer
// @route   POST /api/negotiation/offer
const makeOffer = async (req, res, next) => {
    try {
        const { rideId, amount } = req.body;

        // Ensure ride exists and is in valid state
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status === 'confirmed' || ride.status === 'completed' || ride.status === 'cancelled') {
            return res.status(400).json({ message: 'Negotiation is closed for this ride' });
        }

        // Update ride status to negotiating if not already
        if (ride.status === 'pending') {
            ride.status = 'negotiating';
            await ride.save();
        }

        const negotiation = await Negotiation.create({
            rideId,
            sender: req.user._id,
            role: req.user.role,
            amount,
            status: 'active'
        });

        // Get previous offer from other party
        const prevOffers = await Negotiation.find({ rideId })
            .sort({ timestamp: -1 })
            .limit(5);

        const io = req.app.get('io');

        // Socket emission for new offer
        if (io) {
            io.to(`ride_${rideId}`).emit('newOffer', negotiation);
        }

        // AI Suggestion (non-blocking)
        if (prevOffers.length >= 2) {
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

        // Update negotiation status
        negotiation.status = 'accepted';
        await negotiation.save();

        // Confirm Ride Logic
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        ride.fare.final = negotiation.amount;
        ride.status = 'confirmed';
        ride.otp = otp;

        // If the sender was a driver, they are the driver for this ride
        // If the sender was the rider, who is the driver? 
        // Logic: The "Accepter" is the one confirming.
        // If Driver (sender) made offer, Rider (current user) accepts -> Driver is set.
        // If Rider (sender) made offer, Driver (current user) accepts -> Driver is set.

        if (req.user.role === 'driver') {
            ride.driverId = req.user._id;
        } else if (negotiation.role === 'driver') {
            ride.driverId = negotiation.sender;
        }

        await ride.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('offerAccepted', {
                negotiation,
                ride
            });
            io.to(`ride_${ride._id}`).emit('rideConfirmed', ride);
        }

        res.json({ negotiation, ride });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    makeOffer,
    getNegotiations,
    acceptOffer
};
