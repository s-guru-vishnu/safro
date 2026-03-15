/**
 * Fare Prediction Service
 * Predicts fair pricing based on distance, time, and demand using algorithmic logic
 */
const Ride = require('../models/Ride');

// Minimum fare floors per km
const FARE_FLOOR = {
    base: 30,      // Base fare
    perKm: 12,     // Minimum ₹12 per km
    peakMultiplier: 1.3
};

/**
 * Predict fare using algorithm
 * @param {Object} params
 * @param {number} params.distanceKm - Route distance in km
 * @param {number} params.durationMins - Estimated duration in minutes
 * @param {string} params.timeOfDay - Current time (HH:MM)
 * @param {string} params.vehicleType - bike/auto/sedan/suv
 * @returns {Object} { minFare, suggestedFare, maxFare, reasoning }
 */
const predictFare = async ({ distanceKm, durationMins, timeOfDay, vehicleType }) => {
    // Calculate absolute minimum floor
    const floorFare = FARE_FLOOR.base + (distanceKm * FARE_FLOOR.perKm);

    // Determine demand level based on time
    const hour = parseInt(timeOfDay?.split(':')[0] || new Date().getHours());
    const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
    const demandLevel = isPeak ? 'High' : (hour >= 22 || hour <= 5) ? 'Late Night' : 'Normal';

    // Algorithmic prediction
    const minFare = Math.round(floorFare);
    const suggestedFare = Math.round(floorFare * (isPeak ? 1.3 : 1.15));
    const maxFare = Math.round(floorFare * (isPeak ? 1.6 : 1.4));

    return {
        minFare,
        suggestedFare,
        maxFare,
        reasoning: `Algorithmic estimate based on ${distanceKm} km, ${demandLevel} demand, and ${vehicleType || 'standard'} vehicle type`,
        source: 'algorithm'
    };
};

module.exports = { predictFare };
