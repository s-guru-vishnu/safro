import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Map as MapIcon, Flag, Car, User, MapPin } from 'lucide-react';

const LIBRARIES = ['places'];

// ── Default center (Coimbatore) ─────────────────────────────────
const DEFAULT_CENTER = { lat: 11.0168, lng: 76.9558 };

// ── Map container style ─────────────────────────────────────────
const containerStyle = { width: '100%', height: '100%' };


// ── Marker icon builders ────────────────────────────────────────
const createSVGMarkerIcon = (path, borderColor) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${borderColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" fill="white" stroke-width="1.5"/>
            <g transform="translate(6, 6) scale(0.5)">
                ${path}
            </g>
        </svg>
    `)}`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 20 },
});

// Simplified Lucide paths
const MARKER_PATHS = {
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.5C1.4 11.1 1 12 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1V22"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

const MARKER_ICONS = {
    pickup: createSVGMarkerIcon(MARKER_PATHS.pin, '#10b981'),
    drop: createSVGMarkerIcon(MARKER_PATHS.flag, '#ef4444'),
    driver: createSVGMarkerIcon(MARKER_PATHS.car, '#3b82f6'),
    rider: createSVGMarkerIcon(MARKER_PATHS.user, '#10b981'),
};

const MapView = ({ pickupCoordinates, dropCoordinates, driverCoordinates, riderCoordinates, onMapClick }) => {
    const [mapType, setMapType] = useState('roadmap');
    const [trafficEnabled, setTrafficEnabled] = useState(false);
    const [directions, setDirections] = useState(null);
    const [activeInfoWindow, setActiveInfoWindow] = useState(null);
    const mapRef = useRef(null);
    const trafficLayerRef = useRef(null);

    const [authError, setAuthError] = useState(false);
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || '',
        libraries: LIBRARIES,
    });

    useEffect(() => {
        window.gm_authFailure = () => {
            console.error('Safro: Google Maps Authentication Failed. Check API restrictions or billing.');
            setAuthError(true);
        };
        return () => {
            delete window.gm_authFailure;
        };
    }, []);

    useEffect(() => {
        if (!apiKey) {
            console.warn('Safro Warning: VITE_GOOGLE_MAP_KEY is missing in your .env file!');
        }
        if (loadError) {
            console.error('Safro Error: Google Maps script failed to load. Check your network or API key.');
        }
    }, [apiKey, loadError]);

    // ── Build markers array ─────────────────────────────────────
    const markers = useMemo(() => {
        const m = [];
        if (pickupCoordinates?.lat && pickupCoordinates?.lng) {
            m.push({ position: { lat: pickupCoordinates.lat, lng: pickupCoordinates.lng }, type: 'pickup', label: 'Pickup', icon: MARKER_ICONS.pickup });
        }
        if (dropCoordinates?.lat && dropCoordinates?.lng) {
            m.push({ position: { lat: dropCoordinates.lat, lng: dropCoordinates.lng }, type: 'drop', label: 'Drop-off', icon: MARKER_ICONS.drop });
        }
        if (driverCoordinates?.lat && driverCoordinates?.lng) {
            m.push({ position: { lat: driverCoordinates.lat, lng: driverCoordinates.lng }, type: 'driver', label: 'Driver', icon: MARKER_ICONS.driver });
        }
        if (riderCoordinates?.lat && riderCoordinates?.lng) {
            m.push({ position: { lat: riderCoordinates.lat, lng: riderCoordinates.lng }, type: 'rider', label: 'You', icon: MARKER_ICONS.rider });
        }
        return m;
    }, [pickupCoordinates, dropCoordinates, driverCoordinates, riderCoordinates]);

    // ── Initial center ──────────────────────────────────────────
    const center = useMemo(() => {
        if (markers.length > 0) return markers[0].position;
        return DEFAULT_CENTER;
    }, [markers]);

    // ── Auto-fit bounds ─────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || markers.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach(m => bounds.extend(m.position));
        if (markers.length === 1) {
            mapRef.current.setCenter(markers[0].position);
            mapRef.current.setZoom(15);
        } else {
            mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        }
    }, [markers]);

    // ── Route directions ────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !pickupCoordinates?.lat || !dropCoordinates?.lat) {
            setDirections(null);
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickupCoordinates.lat, lng: pickupCoordinates.lng },
                destination: { lat: dropCoordinates.lat, lng: dropCoordinates.lng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK') {
                    setDirections(result);
                } else {
                    console.warn('Directions request failed:', status);
                    setDirections(null);
                }
            }
        );
    }, [isLoaded, pickupCoordinates?.lat, pickupCoordinates?.lng, dropCoordinates?.lat, dropCoordinates?.lng]);

    // ── Traffic layer toggle ────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current) return;

        if (trafficEnabled) {
            if (!trafficLayerRef.current) {
                trafficLayerRef.current = new window.google.maps.TrafficLayer();
            }
            trafficLayerRef.current.setMap(mapRef.current);
        } else {
            if (trafficLayerRef.current) {
                trafficLayerRef.current.setMap(null);
            }
        }
    }, [trafficEnabled]);

    // ── Handlers ────────────────────────────────────────────────
    const onLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const handleMapClick = useCallback((e) => {
        if (onMapClick && e.latLng) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }
    }, [onMapClick]);

    // ── Fail safe ───────────────────────────────────────────────
    if (loadError || authError) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950 rounded-xl">
                <div className="text-center p-6 max-w-sm">
                    <div className="text-3xl mb-2 text-gray-400 dark:text-gray-500 flex justify-center"><MapIcon size={32} /></div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Map unavailable</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                        {authError 
                            ? "Google Maps authentication failed. This usually means your API search/referer restrictions are too strict or billing is not enabled."
                            : "Could not load Google Maps. Please ensure your API key is valid and all required APIs (Maps, Places, Directions, Geocoding) are enabled."}
                    </p>
                    {import.meta.env.VITE_GOOGLE_MAP_KEY ? null : (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded text-[10px] font-mono border border-red-100">
                            Error: VITE_GOOGLE_MAP_KEY is empty
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950 rounded-xl">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">Loading map...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                mapTypeId={mapType}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    zoomControlOptions: { position: 9 }, // RIGHT_CENTER
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                }}
            >
                {/* Markers */}
                {markers.map((marker) => (
                    <Marker
                        key={marker.type}
                        position={marker.position}
                        icon={marker.icon}
                        onClick={() => setActiveInfoWindow(marker.type)}
                        animation={window.google.maps.Animation.DROP}
                    >
                        {activeInfoWindow === marker.type && (
                            <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                                <div className="px-1 py-0.5">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{marker.label}</span>
                                </div>
                            </InfoWindow>
                        )}
                    </Marker>
                ))}

                {/* Route Polyline */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: '#0d9488',
                                strokeOpacity: 0.85,
                                strokeWeight: 5,
                            },
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default MapView;
