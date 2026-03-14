const axios = require('axios');
const Driver = require('../models/Driver');

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

// Haversine formula for distance fallback (straight line) wrapper in KM
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
};

exports.calculateEstimatedFare = async (pickup, drop) => {
    try {
        let distanceKm = 0;
        let durationMin = 0;

        // 1. Call OSRM API
        try {
            // OSRM format: lng,lat;lng,lat
            const osrmUrl = `${OSRM_BASE_URL}/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=false`;
            const response = await axios.get(osrmUrl, { timeout: 5000 }); // 5s timeout

            if (response.data && response.data.routes && response.data.routes[0]) {
                distanceKm = response.data.routes[0].distance / 1000;
                durationMin = response.data.routes[0].duration / 60;
            } else {
                throw new Error("Invalid OSRM response format");
            }
        } catch (osrmError) {
            console.warn('OSRM failed, falling back to Haversine:', osrmError.message);
            distanceKm = calculateHaversineDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
            // Rough estimate: assume 30 km/h average speed in city
            durationMin = (distanceKm / 30) * 60;
        }

        // Apply minimums
        if (distanceKm < 1) distanceKm = 1;
        if (durationMin < 2) durationMin = 2;

        // 2. Base Configuration
        const baseFare = 30; // ₹30
        const ratePerKm = 10; // ₹10
        const ratePerMinute = 1.5; // ₹1.5

        const distanceCost = distanceKm * ratePerKm;
        const timeCost = durationMin * ratePerMinute;
        const rawFare = baseFare + distanceCost + timeCost;

        // 3. Traffic Multiplier Logic
        let trafficMultiplier = 1.0;
        const now = new Date();
        const hour = now.getHours();

        // Morning peak: 8:00 - 10:00, Evening peak: 18:00 - 21:00
        if ((hour >= 8 && hour < 10) || (hour >= 18 && hour < 21)) {
            trafficMultiplier = 1.2;
        }

        // 4. Demand Multiplier Logic (Drivers within 10km)
        let demandMultiplier = 1.0;
        try {
            const driversCount = await Driver.countDocuments({
                currentLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [pickup.lng, pickup.lat]
                        },
                        $maxDistance: 10000 // 10km
                    }
                },
                isAvailable: true
            });

            if (driversCount < 3) {
                demandMultiplier = 1.3;
            } else if (driversCount >= 3 && driversCount <= 6) {
                demandMultiplier = 1.1;
            } else {
                demandMultiplier = 1.0;
            }
        } catch (dbError) {
            console.warn('Error calculating demand multiplier, skipping:', dbError.message);
        }

        // Weather multiplier (can be hooked up to a real weather API later)
        const weatherMultiplier = 1.0;

        // 5. Final Calculation
        let estimatedFare = rawFare * trafficMultiplier * demandMultiplier * weatherMultiplier;

        return {
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            durationMin: Math.round(durationMin),
            estimatedFare: Math.round(estimatedFare),
            breakdown: {
                baseFare,
                distanceCost: Math.round(distanceCost),
                timeCost: Math.round(timeCost),
                multipliers: {
                    traffic: trafficMultiplier,
                    demand: demandMultiplier,
                    weather: weatherMultiplier
                }
            }
        };

    } catch (error) {
        throw new Error('Fare calculation failed: ' + error.message);
    }
};
