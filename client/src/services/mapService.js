import axios from 'axios';

/**
 * mapService.js
 * Wrapper for free Map services (Nominatim & OSRM)
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org/trip/v1/driving';

export const mapService = {
    /**
     * Search for a location (Geocoding)
     */
    searchLocation: async (query) => {
        try {
            const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
                params: {
                    q: query,
                    format: 'json',
                    limit: 5,
                    addressdetails: 1
                }
            });
            return response.data.map(item => ({
                address: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            }));
        } catch (error) {
            console.error('Geocoding error:', error);
            return [];
        }
    },

    /**
     * Get route between points (Routing)
     * Falls back to straight line if OSRM fails.
     */
    getRoute: async (points) => {
        try {
            const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
            const response = await axios.get(`${OSRM_BASE_URL}/${coords}`, {
                params: {
                    overview: 'full',
                    geometries: 'geojson'
                }
            });

            if (response.data.trips && response.data.trips[0]) {
                return response.data.trips[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
            throw new Error('No route found');
        } catch (error) {
            console.warn('OSRM routing failed, using straight-line fallback:', error.message);
            // Fallback: Return points as a simple polyline
            return points.map(p => [p.lat, p.lng]);
        }
    }
};

export default mapService;
