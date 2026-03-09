/**
 * Socket.io Handler
 * Manages real-time events: ride requests, negotiations, location updates, status changes, emergency alerts
 */
const Ride = require('../models/Ride');
const Negotiation = require('../models/Negotiation');
const User = require('../models/User');
const SOS = require('../models/SOS');
const { sendSOSAlertWhatsApp } = require('../services/notificationService');
const { driverLocationHandler, startDBPersistence } = require('./driverLocationHandler');

const socketHandler = (io) => {
    // Track userId → socketId for targeted emissions
    const userSocketMap = new Map();

    // Start batch DB persistence for driver locations (every 10s)
    startDBPersistence(10000);

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // ── Resync ride state (tab switch / refresh / reconnect) ──
        socket.on('resyncRide', async ({ rideId }) => {
            try {
                if (!rideId) return;
                const ride = await Ride.findById(rideId)
                    .populate('riderId', 'name email')
                    .populate('driverId', 'name email');
                if (!ride) return;

                const messages = await Negotiation.find({ rideId })
                    .populate('sender', 'name')
                    .sort({ timestamp: 1 });

                // Auto-join the ride room
                socket.join(`ride_${rideId}`);

                socket.emit('rideResync', { ride, messages });
                console.log(`🔄 Resynced ride ${rideId} for ${socket.userId || socket.id} (${messages.length} messages)`);
            } catch (err) {
                console.error('resyncRide error:', err.message);
            }
        });

        // Join room based on user role and id
        socket.on('joinRoom', ({ userId, role }) => {
            socket.join(userId);
            socket.join(role);
            userSocketMap.set(userId, socket.id);
            socket.userId = userId;
            socket.userRole = role;
            console.log(`👤 User ${userId} joined room: ${role}`);
        });

        socket.on('joinRide', ({ rideId }) => {
            socket.join(`ride_${rideId}`);
            console.log(`Socket ${socket.userId || socket.id} joined ride: ${rideId}`);
        });

        socket.on('leaveRide', ({ rideId }) => {
            socket.leave(`ride_${rideId}`);
            console.log(`Socket ${socket.userId || socket.id} left ride: ${rideId}`);
        });

        socket.on('joinNegotiation', ({ rideId, userId, role }) => {
            socket.join(`ride_${rideId}`);
            socket.to(`ride_${rideId}`).emit('negotiationJoined', {
                userId,
                role,
                timestamp: new Date().toISOString()
            });
            console.log(`💬 ${role} ${userId} joined negotiation for ride ${rideId}`);
        });

        socket.on('leaveNegotiation', ({ rideId, userId, role }) => {
            socket.to(`ride_${rideId}`).emit('negotiationLeft', {
                userId,
                role,
                timestamp: new Date().toISOString()
            });
            socket.leave(`ride_${rideId}`);
            console.log(`💬 ${role} ${userId} left negotiation for ride ${rideId}`);
        });

        // Negotiation: fare offer (relay to other party in ride room)
        socket.on('sendOffer', (data) => {
            const { rideId } = data;
            if (rideId) {
                socket.to(`ride_${rideId}`).emit('receiveOffer', {
                    ...data,
                    timestamp: data.timestamp || new Date().toISOString()
                });
                console.log(`💰 Offer in ride ${rideId}: ₹${data.amount} from ${data.role}`);
            }
        });

        // Negotiation: text message (relay to other party in ride room)
        socket.on('sendMessage', (data) => {
            const { rideId } = data;
            if (rideId) {
                socket.to(`ride_${rideId}`).emit('receiveMessage', {
                    ...data,
                    timestamp: data.timestamp || new Date().toISOString()
                });
                console.log(`💬 Message in ride ${rideId} from ${data.role}: ${data.text}`);
            }
        });

        // ── Driver Location Tracking (delegated) ────────────────────
        driverLocationHandler(io, socket);

        // ── Rider location update ────────────────────────────────────
        socket.on('updateRiderLocation', (data) => {
            const { rideId, riderId, location } = data;
            if (rideId) {
                io.to(`ride_${rideId}`).emit('riderLocationUpdate', {
                    riderId,
                    location,
                    timestamp: new Date()
                });
            }
            // Also broadcast to admin room for dashboard map
            if (riderId && location) {
                io.to('admin').emit('adminRiderLocationUpdate', {
                    riderId,
                    location,
                    timestamp: new Date()
                });
            }
        });

        // Ride status update
        socket.on('rideStatusUpdate', (data) => {
            const { rideId, status } = data;
            io.to(`ride_${rideId}`).emit('rideStatusChanged', {
                rideId,
                status,
                timestamp: new Date()
            });
        });

        // New ride request broadcast to drivers
        socket.on('notifyDrivers', (data) => {
            io.to('driver').emit('newRideRequest', data);
        });

        // Emergency SOS alert — save to DB + send SMS
        socket.on('sosAlert', async (data) => {
            // Broadcast to admin room immediately
            io.to('admin').emit('sosAlert', {
                ...data,
                timestamp: new Date()
            });

            // Save SOS event and send SMS (non-blocking)
            try {
                const userId = data.userId || socket.userId;
                const location = data.location || {};
                const rideId = data.rideId || null;

                // Save to DB
                const sosRecord = await SOS.create({
                    userId,
                    rideId,
                    location: { lat: location.lat || 0, lng: location.lng || 0 }
                });

                // Look up user for contact info
                const user = await User.findById(userId);
                if (user) {
                    const results = await sendSOSAlertWhatsApp(
                        { name: user.name, phone: user.phone, guardianPhone: user.guardianPhone },
                        location
                    );
                    // Update SOS record with alert results
                    sosRecord.alertsSent = results;
                    await sosRecord.save();
                }

                console.log(`🚨 SOS saved and alerts sent for user ${userId}`);
            } catch (sosErr) {
                console.error('[SOS] Error saving/sending alerts:', sosErr.message);
            }
        });

        // Emergency location sharing
        socket.on('emergencyLocation', (data) => {
            const { rideId, userId, location } = data;
            io.to('admin').emit('emergencyLocation', {
                rideId,
                userId,
                location,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', () => {
            // Clean up user-socket mapping
            if (socket.userId) {
                userSocketMap.delete(socket.userId);
            }
            console.log(`🔌 Socket disconnected: ${socket.id} (${socket.userId || 'unknown'})`);
        });
    });
};

module.exports = socketHandler;
