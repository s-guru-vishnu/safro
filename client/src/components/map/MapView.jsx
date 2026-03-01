import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FiMapPin, FiAlertCircle, FiNavigation } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import mapService from '../../services/mapService';

// Fix for default Leaflet marker icons using SVG
const createIcon = (color) => L.divIcon({
    html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
           </div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const icons = {
    pickup: createIcon('#10b981'), // Green
    drop: createIcon('#ef4444'),   // Red
    driver: createIcon('#3b82f6'), // Blue
    rider: createIcon('#0d9488')   // Teal
};

// Error Boundary Fallback UI
const MapFallback = ({ message }) => (
    <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
        <FiAlertCircle className="text-gray-300 mb-3" size={40} />
        <h3 className="text-sm font-bold text-gray-500 mb-1">Interactive Map Unavailable</h3>
        <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
            {message || "We're having trouble loading the map, but your booking is still secure. Please continue with the flow."}
        </p>
    </div>
);

// Map focus helper
const RecenterMap = ({ pickup, drop, rider, driver }) => {
    const map = useMap();
    useEffect(() => {
        if (pickup && drop) {
            const bounds = L.latLngBounds([pickup, drop]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (pickup) {
            map.setView(pickup, 14);
        } else if (rider) {
            map.setView(rider, 14);
        } else if (driver) {
            map.setView(driver, 14);
        }
    }, [pickup, drop, rider, driver, map]);
    return null;
};

const MapView = ({ pickupCoordinates, dropCoordinates, driverCoordinates, riderCoordinates, height = '100%' }) => {
    const [route, setRoute] = useState([]);
    const [hasError, setHasError] = useState(false);

    // Initial center (Fallback to city center if no coordinates)
    const center = useMemo(() => {
        if (pickupCoordinates) return [pickupCoordinates.lat, pickupCoordinates.lng];
        if (riderCoordinates) return [riderCoordinates.lat, riderCoordinates.lng];
        if (driverCoordinates) return [driverCoordinates.lat, driverCoordinates.lng];
        return [12.9716, 77.5946]; // Bangalore default
    }, [pickupCoordinates, riderCoordinates, driverCoordinates]);

    useEffect(() => {
        const fetchRoute = async () => {
            if (pickupCoordinates && dropCoordinates) {
                const points = [pickupCoordinates, dropCoordinates];
                const path = await mapService.getRoute(points);
                setRoute(path);
            }
        };
        fetchRoute();
    }, [pickupCoordinates, dropCoordinates]);

    if (hasError) return <MapFallback />;

    return (
        <div style={{ height, width: '100%', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                whenReady={() => console.log('🗺️ Map Loaded Successfully')}
                onError={() => setHasError(true)}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {pickupCoordinates && (
                    <Marker
                        position={[pickupCoordinates.lat, pickupCoordinates.lng]}
                        icon={icons.pickup}
                    />
                )}

                {dropCoordinates && (
                    <Marker
                        position={[dropCoordinates.lat, dropCoordinates.lng]}
                        icon={icons.drop}
                    />
                )}

                {driverCoordinates && (
                    <Marker
                        position={[driverCoordinates.lat, driverCoordinates.lng]}
                        icon={icons.driver}
                    />
                )}

                {riderCoordinates && (
                    <Marker
                        position={[riderCoordinates.lat, riderCoordinates.lng]}
                        icon={icons.rider}
                    />
                )}

                {route.length > 0 && (
                    <Polyline
                        positions={route}
                        color="#0f172a"
                        weight={4}
                        opacity={0.6}
                        dashArray="10, 10"
                    />
                )}

                <RecenterMap pickup={pickupCoordinates} drop={dropCoordinates} rider={riderCoordinates} driver={driverCoordinates} />
            </MapContainer>
        </div>
    );
};

export default MapView;
