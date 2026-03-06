/**
 * In-Memory Driver Location Cache
 * 
 * Stores active driver locations for instant retrieval
 * without hitting the database on every admin request.
 * 
 * Features:
 * - Delta detection (only broadcast if moved > 5 meters)
 * - Stale entry cleanup (auto-expire after 60s without update)
 * - Coordinate validation
 */

// Haversine distance in meters between two lat/lng points
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

class LocationCache {
    constructor() {
        // Map<driverId, { lat, lng, heading, speed, status, name, phone, vehicleType, vehicleNumber, lastUpdate, socketId }>
        this.drivers = new Map();

        // Minimum movement (meters) to trigger a broadcast
        this.MIN_MOVE_THRESHOLD = 5;

        // Stale timeout (ms) — driver considered offline if no update for 60s
        this.STALE_TIMEOUT = 60000;

        // DB persistence interval (ms) — batch-write to DB every 10s
        this.DB_PERSIST_INTERVAL = 10000;

        // Drivers that need DB persistence
        this._dirtyDrivers = new Set();

        // Start stale cleanup interval
        this._cleanupInterval = setInterval(() => this._cleanupStale(), 30000);
    }

    /**
     * Validate incoming coordinates
     */
    isValidCoord(lat, lng) {
        return (
            typeof lat === 'number' &&
            typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180 &&
            (lat !== 0 || lng !== 0)
        );
    }

    /**
     * Update a driver's location in the cache.
     * Returns { changed: boolean, entry: object } — changed is false if position hasn't moved enough.
     */
    updateDriver(driverId, data) {
        const { lat, lng, heading = 0, speed = 0, status = 'available', socketId, name, phone, vehicleType, vehicleNumber } = data;

        if (!this.isValidCoord(lat, lng)) {
            return { changed: false, entry: null, reason: 'invalid_coords' };
        }

        const existing = this.drivers.get(driverId);

        const entry = {
            lat,
            lng,
            heading,
            speed,
            status,
            socketId: socketId || existing?.socketId || null,
            name: name || existing?.name || 'Unknown',
            phone: phone || existing?.phone || '',
            vehicleType: vehicleType || existing?.vehicleType || 'sedan',
            vehicleNumber: vehicleNumber || existing?.vehicleNumber || '',
            lastUpdate: Date.now()
        };

        // Check if position actually changed enough to broadcast
        let changed = true;
        if (existing) {
            const dist = haversineDistance(existing.lat, existing.lng, lat, lng);
            if (dist < this.MIN_MOVE_THRESHOLD) {
                // Update timestamp but don't broadcast
                existing.lastUpdate = Date.now();
                existing.status = status;
                existing.heading = heading;
                existing.speed = speed;
                changed = false;
            }
        }

        this.drivers.set(driverId, entry);
        this._dirtyDrivers.add(driverId);

        return { changed, entry };
    }

    /**
     * Register a driver as online (called on driverJoin)
     */
    registerDriver(driverId, data) {
        const entry = {
            lat: data.lat || 0,
            lng: data.lng || 0,
            heading: 0,
            speed: 0,
            status: 'available',
            socketId: data.socketId,
            name: data.name || 'Unknown',
            phone: data.phone || '',
            vehicleType: data.vehicleType || 'sedan',
            vehicleNumber: data.vehicleNumber || '',
            lastUpdate: Date.now()
        };
        this.drivers.set(driverId, entry);
        return entry;
    }

    /**
     * Mark driver as offline and remove from cache
     */
    removeDriver(driverId) {
        const entry = this.drivers.get(driverId);
        this.drivers.delete(driverId);
        this._dirtyDrivers.delete(driverId);
        return entry || null;
    }

    /**
     * Get a single driver's cached location
     */
    getDriver(driverId) {
        return this.drivers.get(driverId) || null;
    }

    /**
     * Get all active drivers as an array (for initial snapshot)
     */
    getAllDrivers() {
        const result = [];
        for (const [driverId, entry] of this.drivers) {
            if (this.isValidCoord(entry.lat, entry.lng)) {
                result.push({
                    _id: driverId,
                    ...entry
                });
            }
        }
        return result;
    }

    /**
     * Get count of online/available drivers
     */
    getOnlineCount() {
        let online = 0;
        for (const entry of this.drivers.values()) {
            if (entry.status === 'available') online++;
        }
        return online;
    }

    /**
     * Get drivers that need DB persistence and clear the dirty set
     */
    getDirtyDrivers() {
        const dirty = [];
        for (const driverId of this._dirtyDrivers) {
            const entry = this.drivers.get(driverId);
            if (entry) {
                dirty.push({ driverId, lat: entry.lat, lng: entry.lng });
            }
        }
        this._dirtyDrivers.clear();
        return dirty;
    }

    /**
     * Cleanup stale entries (no update for > STALE_TIMEOUT)
     * Returns array of stale driverIds that were removed
     */
    _cleanupStale() {
        const now = Date.now();
        const stale = [];
        for (const [driverId, entry] of this.drivers) {
            if (now - entry.lastUpdate > this.STALE_TIMEOUT) {
                stale.push(driverId);
                this.drivers.delete(driverId);
            }
        }
        if (stale.length > 0) {
            console.log(`🧹 Cleaned ${stale.length} stale driver(s) from location cache`);
        }
        return stale;
    }

    /**
     * Shutdown — clear intervals
     */
    destroy() {
        clearInterval(this._cleanupInterval);
        this.drivers.clear();
    }
}

// Singleton instance
const locationCache = new LocationCache();

module.exports = locationCache;
