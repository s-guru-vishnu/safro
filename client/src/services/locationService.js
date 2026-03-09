import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const VIEWBOX = '76.85,11.15,77.15,10.85'; // Coimbatore area bounding box
const BOUNDED = 1;

// Simple memory cache
const searchCache = new Map();
const reverseCache = new Map();

/**
 * Searches locations using OpenStreetMap Nominatim
 * @param {string} query - The search string
 * @returns {Promise<Array>} List of location results
 */
export const searchLocations = async (query) => {
    if (!query || query.length < 3) return [];

    if (searchCache.has(query)) {
        return searchCache.get(query);
    }

    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
            params: {
                q: query,
                format: 'json',
                limit: 5,
                addressdetails: 1,
                countrycodes: 'in', // Limit to India
                viewbox: VIEWBOX, // Bias towards Coimbatore
                bounded: BOUNDED
            },
            headers: {
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const results = response.data.map(item => ({
            id: item.place_id,
            name: item.name || item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type,
            distance: null // Distance calculated on client if needed
        }));

        searchCache.set(query, results);
        return results;
    } catch (error) {
        console.error('Nominatim search failed:', error);
        return []; // Fail gracefully
    }
};

/**
 * Reverse geocodes coordinates to an address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Location details
 */
export const reverseGeocode = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (reverseCache.has(cacheKey)) {
        return reverseCache.get(cacheKey);
    }

    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
            params: {
                lat,
                lon: lng,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const data = response.data;
        const result = {
            id: data.place_id,
            name: data.name || data.address?.road || data.address?.suburb || 'Selected Location',
            address: data.display_name,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon)
        };

        reverseCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Nominatim reverse geocode failed:', error);
        return null;
    }
};

/**
 * Gets nearby places based on coordinates
 */
export const getNearbyLocations = async (lat, lng) => {
    // For Nominatim, getting "nearby" general places usually involves a reverse lookup
    // or searching for amenities. We'll do a simple reverse lookup of their current area 
    // and extract some nearby road/suburb names to serve as suggestions.

    try {
        const result = await reverseGeocode(lat, lng);
        if (!result) return [];

        // Return the current location as the primary "nearby" suggestion
        return [{
            ...result,
            name: 'Current Location',
            isCurrentLocation: true
        }];
    } catch (error) {
        console.error('Nearby locations fetch failed:', error);
        return [];
    }
};
