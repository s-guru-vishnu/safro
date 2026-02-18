const RATES = {
    bike: { baseFare: 20, perKm: 8 },
    auto: { baseFare: 30, perKm: 12 },
    sedan: { baseFare: 50, perKm: 15 },
    suv: { baseFare: 80, perKm: 20 }
};

const calculateFare = (distance, vehicleType = 'sedan') => {
    const rate = RATES[vehicleType] || RATES.sedan;
    const fare = rate.baseFare + (distance * rate.perKm);
    return Math.round(fare * 100) / 100;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
};

const toRad = (deg) => deg * (Math.PI / 180);

module.exports = { calculateFare, calculateDistance, RATES };
