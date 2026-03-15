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
 * Searches locations using Google Places Autocomplete Service
 * @param {string} query - The search string
 * @returns {Promise<Array>} List of location results { id, name, address, lat, lng }
 */
export const searchLocations = async (query) => {
    if (!query || query.length < 3) return [];
    if (searchCache.has(query)) return searchCache.get(query);

    try {
        await waitForGoogle();

        const service = new window.google.maps.places.AutocompleteService();
        const predictions = await new Promise((resolve, reject) => {
            service.getPlacePredictions(
                {
                    input: query,
                    componentRestrictions: { country: 'in' },
                    // Bias towards Coimbatore
                    locationBias: {
                        center: { lat: 11.0168, lng: 76.9558 },
                        radius: 50000, // 50 km
                    },
                },
                (results, status) => {
                    if (status === 'OK' && results) resolve(results);
                    else if (status === 'ZERO_RESULTS') resolve([]);
                    else reject(new Error(status));
                }
            );
        });

        // Fetch details (lat/lng) for each prediction
        const placesService = new window.google.maps.places.PlacesService(
            document.createElement('div')
        );

        const results = await Promise.all(
            predictions.slice(0, 5).map(
                (p) =>
                    new Promise((resolve) => {
                        placesService.getDetails(
                            { placeId: p.place_id, fields: ['geometry', 'name', 'formatted_address'] },
                            (place, status) => {
                                if (status === 'OK' && place?.geometry?.location) {
                                    resolve({
                                        id: p.place_id,
                                        name: place.name || p.structured_formatting?.main_text || p.description.split(',')[0],
                                        address: place.formatted_address || p.description,
                                        lat: place.geometry.location.lat(),
                                        lng: place.geometry.location.lng(),
                                    });
                                } else {
                                    resolve(null);
                                }
                            }
                        );
                    })
            )
        );

        const filtered = results.filter(Boolean);
        searchCache.set(query, filtered);
        return filtered;
    } catch (error) {
        console.error('Google Places search failed:', error);
        return [];
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
 * Gets nearby places based on coordinates (current location suggestion)
 */
export const getNearbyLocations = async (lat, lng) => {
    try {
        const result = await reverseGeocode(lat, lng);
        if (!result) return [];

        return [{
            ...result,
            name: 'Current Location',
            isCurrentLocation: true,
        }];
    } catch (error) {
        console.error('Nearby locations fetch failed:', error);
        return [];
    }
};
