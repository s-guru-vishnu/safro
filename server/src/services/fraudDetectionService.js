/**
 * Fraud Detection Service
 * Uses GROQ to analyze ride behavior patterns for suspicious activity
 */
const { callGroq } = require('./groqService');
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

    // Abnormal negotiation patterns
    const negotiationAmounts = negotiations.map(n => n.amount);
    const hasLowballOffers = negotiationAmounts.some(a => avgFare > 0 && a < avgFare * 0.3);

    // If very few rides, not enough data
    if (totalRides < 3) {
        return { suspicious: false, riskScore: 0, reasons: ['Insufficient ride history for analysis'] };
    }

    const cacheKey = `fraud_${userId}_${totalRides}`;

    const systemPrompt = `You are Safro's fraud detection engine.
Analyze user behavior patterns and determine if activity is suspicious.
Return ONLY valid JSON with keys: suspicious (boolean), riskScore (0-100 integer), reasons (array of short strings).`;

    const userPrompt = `User behavior analysis (last 30 days):
Total rides: ${totalRides}
Cancelled rides: ${cancelledRides} (${(cancellationRate * 100).toFixed(1)}%)
Average fare: ₹${Math.round(avgFare)}
Price deviations (>50% from avg): ${priceDeviations}
Total negotiation offers: ${negotiations.length}
Lowball offers (<30% of avg fare): ${hasLowballOffers ? 'Yes' : 'No'}

Is this behavior suspicious?`;

    const result = await callGroq(systemPrompt, userPrompt, cacheKey);

    if (!result) {
        // Fallback: simple rules
        const suspicious = cancellationRate > 0.5 || priceDeviations > 3;
        return {
            suspicious,
            riskScore: suspicious ? 70 : 20,
            reasons: suspicious
                ? [`High cancellation rate: ${(cancellationRate * 100).toFixed(0)}%`]
                : ['No anomalies detected']
        };
    }

    return result;
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
