/**
 * Location Service — Google Maps APIs
 *
 * Provides search, reverse-geocode, and nearby-location lookups
 * using the Google Maps JavaScript API (loaded globally via @react-google-maps/api).
 *
 * Return format kept identical so LocationInput.jsx and consumers don't change:
 *   { id, name, address, lat, lng }
 */

// Simple memory caches
const searchCache = new Map();
const reverseCache = new Map();

/**
 * Wait for the Google Maps script to be ready.
 * Returns a resolved promise if already loaded.
 */
const waitForGoogle = () =>
    new Promise((resolve, reject) => {
        if (window.google?.maps?.places) return resolve();
        let tries = 0;
        const interval = setInterval(() => {
            if (window.google?.maps?.places) { clearInterval(interval); resolve(); }
            if (++tries > 50) { clearInterval(interval); reject(new Error('Google Maps not loaded')); }
        }, 200);
    });

/**
 * Searches locations using Google Places API (New) Autocomplete
 * Optimized for speed: Returns only predictions without coordinates.
 * @param {string} query - The search string
 * @returns {Promise<Array>} List of location predictions { id, name, address }
 */
export const searchLocations = async (query) => {
    if (!query || query.trim().length === 0) return [];
    if (searchCache.has(query)) return searchCache.get(query);

    try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAP_KEY
            },
            body: JSON.stringify({
                input: query,
                locationBias: {
                    circle: {
                        center: { latitude: 11.0168, longitude: 76.9558 },
                        radius: 50000 // 50 km
                    }
                }
            })
        });

        const data = await response.json();
        if (!data.suggestions) return [];

        const results = data.suggestions.slice(0, 7).map(s => {
            const pred = s.placePrediction;
            const fullText = pred.text.text;
            const parts = fullText.split(',');
            return {
                id: pred.placeId,
                name: parts[0],
                address: parts.slice(1).join(',').trim() || fullText,
                description: fullText
            };
        });

        searchCache.set(query, results);
        return results;
    } catch (error) {
        console.error('Google Places (New) autocomplete failed:', error);
        return [];
    }
};

/**
 * Fetches full coordinates and formatted address for a place ID using Places API (New)
 * @param {string} placeId
 * @returns {Promise<Object|null>} { name, address, lat, lng }
 */
export const getPlaceDetails = async (placeId) => {
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location,displayName,formattedAddress`, {
            headers: {
                'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAP_KEY,
                'X-Goog-FieldMask': 'location,displayName,formattedAddress'
            }
        });
        
        const place = await response.json();
        if (!place.location) return null;

        return {
            name: place.displayName?.text || place.formattedAddress?.split(',')[0] || 'Selected Location',
            address: place.formattedAddress,
            lat: place.location.latitude,
            lng: place.location.longitude,
        };
    } catch (error) {
        console.error('Failed to get place details (New API):', error);
        return null;
    }
};

/**
 * Reverse geocodes coordinates to an address
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object|null>} { id, name, address, lat, lng }
 */
export const reverseGeocode = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (reverseCache.has(cacheKey)) return reverseCache.get(cacheKey);

    try {
        await waitForGoogle();

        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results?.[0]) resolve(results[0]);
                else reject(new Error(status));
            });
        });

        const result = {
            id: response.place_id,
            name: response.address_components?.[0]?.long_name || 'Selected Location',
            address: response.formatted_address,
            lat,
            lng,
        };

        reverseCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Google reverse geocode failed:', error);
        return null;
    }
};

/**
 * Gets nearby places based on coordinates using Places API (New) Autocomplete workaround
 */
export const getNearbyPlaces = async (lat, lng) => {
    try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAP_KEY
            },
            body: JSON.stringify({
                input: "",
                locationBias: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: 2000
                    }
                }
            })
        });

        const data = await response.json();
        if (!data.suggestions) return [];

        return data.suggestions.slice(0, 6).map(s => {
            const pred = s.placePrediction;
            const fullText = pred.text.text;
            const parts = fullText.split(',');
            return {
                id: pred.placeId,
                name: parts[0],
                address: parts.slice(1).join(',').trim() || fullText,
                description: fullText
            };
        });
    } catch (error) {
        console.error('Nearby search (New API) failed:', error);
        return [];
    }
};

/**
 * Gets nearby places based on coordinates (current location suggestion)
 */
export const getNearbyLocations = async (lat, lng) => {
    try {
        const [currentLoc, nearby] = await Promise.all([
            reverseGeocode(lat, lng),
            getNearbyPlaces(lat, lng)
        ]);

        const suggestions = [];
        if (currentLoc) {
            suggestions.push({
                ...currentLoc,
                name: 'Current Location',
                isCurrentLocation: true,
            });
        }

        return [...suggestions, ...nearby];
    } catch (error) {
        console.error('Nearby locations fetch failed:', error);
        return [];
    }
};
