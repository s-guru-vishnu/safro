import React, { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * DriverTracker.jsx
 * Specialized component for smooth driver marker updates using refs
 * Prevents full map re-renders on every location tick.
 */

const driverIcon = L.divIcon({
    html: `<div style="color: #3b82f6; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
           </div>`,
    className: 'driver-tracking-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const DriverTracker = ({ location, autoCenter = false }) => {
    const markerRef = useRef(null);
    const map = useMap();

    useEffect(() => {
        if (location && markerRef.current) {
            const { lat, lng } = location;
            // Smoothly move marker if it already exists
            markerRef.current.setLatLng([lat, lng]);

            if (autoCenter) {
                map.panTo([lat, lng], { animate: true, duration: 1 });
            }
        }
    }, [location, autoCenter, map]);

    if (!location) return null;

    return (
        <Marker
            ref={markerRef}
            position={[location.lat, location.lng]}
            icon={driverIcon}
            zIndexOffset={100}
        />
    );
};

export default DriverTracker;
