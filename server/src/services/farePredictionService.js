/**
 * AI Fare Prediction Service
 * Uses GROQ to predict fair pricing based on distance, time, and demand
 */
const { callGroq } = require('./groqService');
const Ride = require('../models/Ride');

// Minimum fare floors per km
const FARE_FLOOR = {
    base: 30,      // Base fare
    perKm: 12,     // Minimum ₹12 per km
    peakMultiplier: 1.3
};

/**
 * Predict fare using AI
 * @param {Object} params
 * @param {number} params.distanceKm - Route distance in km
 * @param {number} params.durationMins - Estimated duration in minutes
 * @param {string} params.timeOfDay - Current time (HH:MM)
 * @param {string} params.vehicleType - bike/auto/sedan/suv
 * @param {Object} params.pickupCoords - {lat, lng}
 * @returns {Object} { minFare, suggestedFare, maxFare, reasoning }
 */
const predictFare = async ({ distanceKm, durationMins, timeOfDay, vehicleType, pickupCoords }) => {
    // Calculate absolute minimum floor
    const floorFare = FARE_FLOOR.base + (distanceKm * FARE_FLOOR.perKm);

    // Determine demand level based on time
    const hour = parseInt(timeOfDay?.split(':')[0] || new Date().getHours());
    const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
    const demandLevel = isPeak ? 'High' : (hour >= 22 || hour <= 5) ? 'Late Night' : 'Normal';

    // Get recent average fare for similar distance
    let recentAvg = null;
    try {
        const recentRides = await Ride.find({
            status: 'completed',
            distanceKm: { $gte: distanceKm - 2, $lte: distanceKm + 2 },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).select('fare.final').limit(20);

        if (recentRides.length > 0) {
            const fares = recentRides.map(r => r.fare?.final).filter(Boolean);
            recentAvg = fares.length > 0 ? Math.round(fares.reduce((a, b) => a + b, 0) / fares.length) : null;
        }
    } catch (e) {
        // Ignore — historical data is optional
    }

    const cacheKey = `fare_${Math.round(distanceKm)}_${demandLevel}_${vehicleType || 'standard'}`;

    const systemPrompt = `You are Safro's intelligent fare prediction engine for an Indian ride marketplace.
Analyze the ride parameters and suggest a fair pricing range.
Consider distance, time of day, demand, and vehicle type.
Currency is Indian Rupees (₹). Minimum fare floor: ₹${Math.round(floorFare)}.
Return ONLY valid JSON with these exact keys: minFare, suggestedFare, maxFare, reasoning.
All fare values must be integers.`;

    const userPrompt = `Route distance: ${distanceKm} km
Estimated duration: ${durationMins || 'unknown'} minutes
Time: ${timeOfDay || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
Demand level: ${demandLevel}
Vehicle type: ${vehicleType || 'standard'}
${recentAvg ? `Recent average fare for similar rides: ₹${recentAvg}` : 'No recent fare data available'}
Minimum fare floor: ₹${Math.round(floorFare)}

Suggest:
- Minimum fair price (must be >= ₹${Math.round(floorFare)})
- Suggested negotiation fare
- Maximum reasonable price
Return JSON only.`;

    const result = await callGroq(systemPrompt, userPrompt, cacheKey);

    if (!result || !result.suggestedFare) {
        // Fallback: algorithmic prediction
        const minFare = Math.round(floorFare);
        const suggestedFare = Math.round(floorFare * (isPeak ? 1.3 : 1.15));
        const maxFare = Math.round(floorFare * (isPeak ? 1.6 : 1.4));
        return {
            minFare,
            suggestedFare,
            maxFare,
            reasoning: `Algorithmic estimate based on ${distanceKm} km, ${demandLevel} demand`,
            source: 'algorithm'
        };
    }

    // Enforce floor
    result.minFare = Math.max(result.minFare, Math.round(floorFare));
    result.suggestedFare = Math.max(result.suggestedFare, result.minFare);
    result.maxFare = Math.max(result.maxFare, result.suggestedFare);
    result.source = 'ai';

    return result;
};

module.exports = { predictFare };
