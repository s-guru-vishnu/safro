const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join room based on user role and id
        socket.on('joinRoom', ({ userId, role }) => {
            socket.join(userId);
            socket.join(role);
            console.log(`User ${userId} joined room: ${role}`);
        });

        // Join specific ride room
        socket.on('joinRide', ({ rideId }) => {
            socket.join(`ride_${rideId}`);
            console.log(`Socket joined ride: ${rideId}`);
        });

        // Driver location update
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

        // SOS alert
        socket.on('sosAlert', (data) => {
            io.to('admin').emit('sosAlert', {
                ...data,
                timestamp: new Date()
            });
        });

        // New ride notification to all drivers
        socket.on('notifyDrivers', (data) => {
            io.to('driver').emit('newRideRequest', data);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketHandler;
