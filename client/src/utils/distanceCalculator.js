/**
 * Haversine Formula for calculating distance between two coordinates in KM.
 * Standalone - No external dependencies or Leaflet required.
 */
export const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

/**
 * Checks if a point is within a certain distance of another point.
 */
export const isWithinRadius = (point1, point2, radiusInMeters = 200) => {
    const distanceInKm = calculateDistance(point1, point2);
    return distanceInKm * 1000 <= radiusInMeters;
};
