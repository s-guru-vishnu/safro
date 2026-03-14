import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (emoji, color) => L.divIcon({
    html: `<div style="
        position: relative;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        border-radius: 50%;
        border: 2px solid ${color};
        background: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    ">${emoji}</div>`,
    className: 'custom-map-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

const pickupIcon = createIcon('📍', '#10b981'); // Emerald
const dropIcon = createIcon('🏁', '#ef4444');   // Red
const driverIcon = createIcon('🚗', '#3b82f6'); // Blue
const riderIcon = createIcon('👤', '#8b5cf6');  // Violet

// Auto-fit bounds component
const FitBounds = ({ markers }) => {
    const map = useMap();
    const hasFitted = useRef(false);

    useEffect(() => {
        const validMarkers = markers.filter(m => m && m.lat && m.lng);
        if (validMarkers.length > 0) {
            const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFitted.current = true;
        }
    }, [markers, map]);

    return null;
};

// Map events component
const MapEvents = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            if (onMapClick) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
};

const MapView = ({ pickupCoordinates, dropCoordinates, driverCoordinates, riderCoordinates, onMapClick }) => {
    const markers = [
        pickupCoordinates && { ...pickupCoordinates, type: 'pickup', icon: pickupIcon, label: 'Pickup' },
        dropCoordinates && { ...dropCoordinates, type: 'drop', icon: dropIcon, label: 'Drop' },
        driverCoordinates && { ...driverCoordinates, type: 'driver', icon: driverIcon, label: 'Driver' },
        riderCoordinates && { ...riderCoordinates, type: 'rider', icon: riderIcon, label: 'You' }
    ].filter(Boolean);

    const defaultCenter = [12.9716, 77.5946]; // Bengaluru
    const initialCenter = markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;

    return (
        <MapContainer
            center={initialCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />

            {markers.map((marker, idx) => (
                <Marker
                    key={`${marker.type}-${idx}`}
                    position={[marker.lat, marker.lng]}
                    icon={marker.icon}
                >
                    <Popup>{marker.label}</Popup>
                </Marker>
            ))}

            <FitBounds markers={markers} />
            <MapEvents onMapClick={onMapClick} />
        </MapContainer>
    );
};

export default MapView;
