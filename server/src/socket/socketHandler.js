/**
 * Socket.io Handler
 * Manages real-time events: ride requests, location updates, status changes, emergency alerts
 */
const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Join room based on user role and id
        socket.on('joinRoom', ({ userId, role }) => {
            socket.join(userId);
            socket.join(role);
            console.log(`👤 User ${userId} joined room: ${role}`);
        });

        // Join specific ride room
        socket.on('joinRide', ({ rideId }) => {
            socket.join(`ride_${rideId}`);
            console.log(`🚗 Socket joined ride: ${rideId}`);
        });

        // Leave ride room
        socket.on('leaveRide', ({ rideId }) => {
            socket.leave(`ride_${rideId}`);
            console.log(`🚗 Socket left ride: ${rideId}`);
        });

        // Driver location update (live tracking)
        socket.on('updateDriverLocation', (data) => {
            const { rideId, driverId, location } = data;
            if (rideId) {
                io.to(`ride_${rideId}`).emit('driverLocationUpdate', {
                    driverId,
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

        // Emergency SOS alert
        socket.on('sosAlert', (data) => {
            io.to('admin').emit('sosAlert', {
                ...data,
                timestamp: new Date()
            });
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
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketHandler;
