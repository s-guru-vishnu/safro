/**
 * Fraud Detection Service
 * Analyzes ride behavior patterns for suspicious activity using rule-based logic
 */
const Ride = require('../models/Ride');
const Negotiation = require('../models/Negotiation');

/**
 * Analyze a user's behavior for fraud indicators
 * @param {string} userId - User ID to analyze
 * @returns {Object} { suspicious, riskScore, reasons }
 */
const analyzeBehavior = async (userId) => {
    // Gather behavioral data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [rides, negotiations] = await Promise.all([
        Ride.find({
            $or: [{ riderId: userId }, { driverId: userId }],
            createdAt: { $gte: thirtyDaysAgo }
        }).select('status fare distanceKm createdAt'),
        Negotiation.find({
            sender: userId,
            timestamp: { $gte: thirtyDaysAgo }
        }).select('amount rideId status')
    ]);

    const totalRides = rides.length;
    const cancelledRides = rides.filter(r => r.status === 'cancelled').length;
    const cancellationRate = totalRides > 0 ? (cancelledRides / totalRides) : 0;

    // Check for price deviations
    const completedRides = rides.filter(r => r.status === 'completed' && r.fare?.final);
    const fares = completedRides.map(r => r.fare.final);
    const avgFare = fares.length > 0 ? fares.reduce((a, b) => a + b, 0) / fares.length : 0;
    const priceDeviations = fares.filter(f => Math.abs(f - avgFare) > avgFare * 0.5).length;

    // If very few rides, not enough data
    if (totalRides < 3) {
        return { suspicious: false, riskScore: 0, reasons: ['Insufficient ride history for analysis'] };
    }

    // Rule-based check
    const suspicious = cancellationRate > 0.5 || priceDeviations > 3;
    
    return {
        suspicious,
        riskScore: suspicious ? 70 : 20,
        reasons: suspicious
            ? [`High cancellation rate: ${(cancellationRate * 100).toFixed(0)}%`, priceDeviations > 3 ? `${priceDeviations} high price deviations detected` : null].filter(Boolean)
            : ['No anomalies detected']
    };
};

/**
 * Quick check on a specific ride for anomalies
 * @param {Object} ride - Ride document
 * @returns {Object} { flagged, riskScore, reasons }
 */
const checkRide = async (ride) => {
    if (!ride.fare?.proposed || !ride.distanceKm) {
        return { flagged: false, riskScore: 0, reasons: [] };
    }

    const farePerKm = ride.fare.proposed / ride.distanceKm;

    // Simple rule check — if fare per km is unreasonably low or high
    if (farePerKm < 5) {
        return { flagged: true, riskScore: 60, reasons: ['Fare significantly below market rate'] };
    }
    if (farePerKm > 100) {
        return { flagged: true, riskScore: 50, reasons: ['Fare significantly above market rate'] };
    }

    return { flagged: false, riskScore: 0, reasons: [] };
};

module.exports = { analyzeBehavior, checkRide };
