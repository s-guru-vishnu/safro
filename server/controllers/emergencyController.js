const Ride = require('../models/Ride');
const User = require('../models/User');

// @desc Trigger SOS alert
// @route POST /api/emergency/sos
const triggerSOS = async (req, res) => {
    try {
        const { rideId, location, message } = req.body;

        let rideInfo = null;
        if (rideId) {
            rideInfo = await Ride.findById(rideId)
                .populate('riderId', 'name phone email guardianPhone guardianEmail')
                .populate('driverId', 'name phone');
        }

        const user = await User.findById(req.user._id);

        const sosAlert = {
            userId: req.user._id,
            userName: user.name,
            userPhone: user.phone,
            role: user.role,
            rideId: rideId || null,
            rideInfo,
            location,
            message: message || 'Emergency SOS triggered!',
            timestamp: new Date(),
            guardianPhone: user.guardianPhone,
            guardianEmail: user.guardianEmail
        };

        // Broadcast SOS to admin and guardian
        const io = req.app.get('io');
        if (io) {
            io.emit('sosAlert', sosAlert);
        }

        res.json({
            message: 'SOS alert sent successfully',
            alert: sosAlert
        });
    } catch (error) {
        console.error('SOS error:', error);
        res.status(500).json({ message: 'Error sending SOS alert' });
    }
};

module.exports = { triggerSOS };
