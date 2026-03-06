/**
 * Driver Location Socket Handler
 * 
 * Dedicated handler for all driver tracking WebSocket events.
 * Uses locationCache for in-memory storage and delta-based broadcasting.
 * 
 * Events handled:
 * - driverJoin       → Driver comes online, registers in cache
 * - driverLocationUpdate → Validates, caches, broadcasts delta to admins
 * - requestInitialLocations → Admin requests full snapshot from cache
 * - disconnect       → Marks driver offline, notifies admins
 */

const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const locationCache = require('../services/locationCache');

let _dbPersistInterval = null;

const driverLocationHandler = (io, socket) => {

    // ── Driver Join ──────────────────────────────────────────────
    // Called when a driver comes online or opens their dashboard
    socket.on('driverJoin', async ({ driverId }) => {
        if (!driverId) return;

        try {
            // Fetch driver profile for metadata
            const driver = await Driver.findById(driverId).populate('userId', 'name phone');
            if (!driver) return;

            const coords = driver.currentLocation?.coordinates;
            const entry = locationCache.registerDriver(driverId, {
                lat: coords?.[1] || 0,
                lng: coords?.[0] || 0,
                socketId: socket.id,
                name: driver.userId?.name || 'Unknown',
                phone: driver.userId?.phone || '',
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber
            });

            // Join the driver tracking room
            socket.join('drivers-tracking');

            // Notify all admin dashboards that a new driver is online
            io.to('admin').emit('driverOnline', {
                driverId,
                driver: { _id: driverId, ...entry },
                timestamp: new Date()
            });

            console.log(`🟢 Driver ${driverId} (${entry.name}) joined tracking`);
        } catch (err) {
            console.error('driverJoin error:', err.message);
        }
    });

    // ── Driver Location Update ───────────────────────────────────
    // Drivers send this every 3-5 seconds
    socket.on('driverLocationUpdate', (data) => {
        const { driverId, latitude, longitude, heading, speed, rideId } = data;

        if (!driverId) return;

        const status = rideId ? 'on_ride' : 'available';

        const { changed, entry, reason } = locationCache.updateDriver(driverId, {
            lat: latitude || data.location?.lat,
            lng: longitude || data.location?.lng,
            heading: heading || 0,
            speed: speed || 0,
            status,
            socketId: socket.id
        });

        if (reason === 'invalid_coords') return;

        // Only broadcast to admins if position actually changed
        if (changed && entry) {
            io.to('admin').emit('adminDriverLocationUpdate', {
                driverId,
                location: { lat: entry.lat, lng: entry.lng },
                heading: entry.heading,
                speed: entry.speed,
                status: entry.status,
                timestamp: new Date()
            });
        }

        // Also relay to ride room if active ride
        if (rideId && entry) {
            io.to(`ride_${rideId}`).emit('driverLocationUpdate', {
                driverId,
                location: { lat: entry.lat, lng: entry.lng },
                timestamp: new Date()
            });
        }
    });

    // ── Backward-compatible idle location update ─────────────────
    socket.on('driverLocationIdle', async (data) => {
        const { userId, location } = data;
        if (!userId || !location) return;

        try {
            // Find driver by userId
            const driver = await Driver.findOne({ userId });
            if (!driver) return;

            const driverId = driver._id.toString();

            const { changed, entry } = locationCache.updateDriver(driverId, {
                lat: location.lat,
                lng: location.lng,
                status: 'available',
                socketId: socket.id,
                name: driver.userId?.name,
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber
            });

            if (changed && entry) {
                io.to('admin').emit('adminDriverLocationUpdate', {
                    driverId,
                    location: { lat: entry.lat, lng: entry.lng },
                    status: 'available',
                    timestamp: new Date()
                });
            }
        } catch (err) {
            console.error('driverLocationIdle error:', err.message);
        }
    });

    // ── Admin Initial Locations Request ──────────────────────────
    socket.on('requestInitialLocations', async () => {
        if (socket.userRole !== 'admin') return;

        try {
            // Get drivers from cache (instant, no DB)
            const driverLocs = locationCache.getAllDrivers();

            // For riders, we still need DB since they don't live in cache
            const activeRides = await Ride.find({
                status: { $in: ['pending', 'negotiating', 'accepted', 'confirmed', 'driver_arrived', 'otp_verified', 'on_trip'] }
            }).populate('riderId', 'name phone');

            const riderLocs = activeRides
                .filter(ride => {
                    const coords = ride.pickupLocation?.coordinates;
                    return coords && coords.lat && coords.lng;
                })
                .map(ride => ({
                    _id: ride.riderId?._id || `unknown-${ride._id}`,
                    rideId: ride._id,
                    name: ride.riderId?.name || 'Unknown Rider',
                    phone: ride.riderId?.phone || '',
                    status: ride.status,
                    lat: ride.pickupLocation.coordinates.lat,
                    lng: ride.pickupLocation.coordinates.lng
                }));

            socket.emit('initialLocations', {
                drivers: driverLocs,
                riders: riderLocs,
                timestamp: new Date()
            });

            console.log(`📡 Sent ${driverLocs.length} cached drivers + ${riderLocs.length} riders to admin ${socket.userId}`);
        } catch (err) {
            console.error('requestInitialLocations error:', err.message);
        }
    });

    // ── Disconnect Handling ──────────────────────────────────────
    socket.on('disconnect', () => {
        // Find which driver this socket belongs to
        const allDrivers = locationCache.getAllDrivers();
        const disconnectedDriver = allDrivers.find(d => d.socketId === socket.id);

        if (disconnectedDriver) {
            const driverId = disconnectedDriver._id;
            locationCache.removeDriver(driverId);

            // Notify admin dashboards
            io.to('admin').emit('driverOffline', {
                driverId,
                name: disconnectedDriver.name,
                timestamp: new Date()
            });

            console.log(`🔴 Driver ${driverId} (${disconnectedDriver.name}) went offline`);
        }
    });
};

/**
 * Start the periodic DB persistence loop.
 * Batches dirty cache entries and writes them to MongoDB every 10 seconds.
 */
const startDBPersistence = (intervalMs = 10000) => {
    if (_dbPersistInterval) clearInterval(_dbPersistInterval);

    _dbPersistInterval = setInterval(async () => {
        const dirty = locationCache.getDirtyDrivers();
        if (dirty.length === 0) return;

        try {
            const bulkOps = dirty.map(({ driverId, lat, lng }) => ({
                updateOne: {
                    filter: { _id: driverId },
                    update: {
                        $set: {
                            currentLocation: {
                                type: 'Point',
                                coordinates: [lng, lat]
                            }
                        }
                    }
                }
            }));

            await Driver.bulkWrite(bulkOps);
            console.log(`💾 Persisted ${dirty.length} driver location(s) to DB`);
        } catch (err) {
            console.error('DB bulk persist error:', err.message);
        }
    }, intervalMs);
};

module.exports = { driverLocationHandler, startDBPersistence };
