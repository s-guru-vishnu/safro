import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FiMapPin, FiTruck, FiUser, FiRefreshCw } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Custom car-style icon for drivers
const createDriverIcon = (isAvailable) => L.divIcon({
    html: `<div style="color: ${isAvailable ? '#10b981' : '#94a3b8'}; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
           </div>`,
    className: 'driver-map-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

// Custom person-style icon for riders
const createRiderIcon = () => L.divIcon({
    html: `<div style="color: #3b82f6; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
           </div>`,
    className: 'rider-map-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

// Auto-fit map to markers
const FitBounds = ({ markers }) => {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [markers, map]);
    return null;
};

const DriverTrackingMap = () => {
    const [drivers, setDrivers] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const driversRef = useRef([]);
    const ridersRef = useRef([]);
    const { socket } = useSocket();

    // Fetch initial driver and rider locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const [driverRes, riderRes] = await Promise.all([
                    api.get('/admin/driver-locations'),
                    api.get('/admin/rider-locations')
                ]);
                const driverData = driverRes.data.drivers || [];
                const riderData = riderRes.data.riders || [];

                setDrivers(driverData);
                driversRef.current = driverData;

                setRiders(riderData);
                ridersRef.current = riderData;
            } catch (err) {
                console.error('Failed to fetch locations:', err);
                setError('Could not load locations');
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    // Listen for live location updates from socket
    useEffect(() => {
        if (!socket) return;

        const handleDriverLocationUpdate = ({ driverId, location }) => {
            if (!driverId || !location) return;

            setDrivers(prev => {
                const updated = prev.map(d =>
                    d._id === driverId
                        ? { ...d, lat: location.lat, lng: location.lng }
                        : d
                );
                driversRef.current = updated;
                return updated;
            });
        };

        const handleRiderLocationUpdate = ({ riderId, location }) => {
            if (!riderId || !location) return;

            setRiders(prev => {
                const updated = prev.map(r =>
                    r._id === riderId
                        ? { ...r, lat: location.lat, lng: location.lng }
                        : r
                );

                // If this is a new rider we haven't tracked yet, simply refreshing might be safer
                // but we can also try to optimistically add them if we have enough info

                ridersRef.current = updated;
                return updated;
            });
        };

        socket.on('adminDriverLocationUpdate', handleDriverLocationUpdate);
        socket.on('adminRiderLocationUpdate', handleRiderLocationUpdate);

        return () => {
            socket.off('adminDriverLocationUpdate', handleDriverLocationUpdate);
            socket.off('adminRiderLocationUpdate', handleRiderLocationUpdate);
        };
    }, [socket]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const [driverRes, riderRes] = await Promise.all([
                api.get('/admin/driver-locations'),
                api.get('/admin/rider-locations')
            ]);

            const driverData = driverRes.data.drivers || [];
            const riderData = riderRes.data.riders || [];

            setDrivers(driverData);
            driversRef.current = driverData;

            setRiders(riderData);
            ridersRef.current = riderData;
        } catch (err) {
            console.error('Refresh failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const onlineCount = drivers.filter(d => d.isAvailable).length;
    const offlineCount = drivers.length - onlineCount;
    const activeRiderCount = riders.length;

    // Combine all markers for FitBounds
    const allMarkers = [...drivers, ...riders];

    // Default center (Bangalore)
    const center = allMarkers.length > 0
        ? [allMarkers[0].lat, allMarkers[0].lng]
        : [12.9716, 77.5946];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                        <FiMapPin size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Live Active Map</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1" title="Drivers Online">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {onlineCount} Drivers Online
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1" title="Drivers Offline">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                {offlineCount} Offline
                            </span>
                            <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 ml-2" title="Active Riders">
                                <FiUser size={10} />
                                {activeRiderCount} Active Riders
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all disabled:opacity-50"
                    title="Refresh locations"
                >
                    <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Map Container */}
            <div className="relative" style={{ height: '340px' }}>
                {loading && allMarkers.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400">Loading map...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <FiTruck className="text-gray-300 mx-auto mb-2" size={32} />
                            <p className="text-sm text-gray-400">{error}</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        center={center}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        {drivers.map(driver => (
                            <Marker
                                key={`driver-${driver._id}`}
                                position={[driver.lat, driver.lng]}
                                icon={createDriverIcon(driver.isAvailable)}
                            >
                                <Popup>
                                    <div className="min-w-[160px]">
                                        <p className="font-bold text-gray-900 text-sm">{driver.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{driver.vehicleType} • {driver.vehicleNumber}</p>
                                        <p className="text-xs mt-1">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${driver.isAvailable
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {driver.isAvailable ? '● Available' : '○ Offline'}
                                            </span>
                                        </p>
                                        {driver.phone && (
                                            <p className="text-[10px] text-gray-400 mt-1">📞 {driver.phone}</p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {riders.map(rider => (
                            <Marker
                                key={`rider-${rider._id}`}
                                position={[rider.lat, rider.lng]}
                                icon={createRiderIcon()}
                            >
                                <Popup>
                                    <div className="min-w-[160px]">
                                        <p className="font-bold flex items-center gap-1 text-blue-900 text-sm"><FiUser size={14} /> {rider.name}</p>
                                        <p className="text-xs mt-1">
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-widest">
                                                {rider.status?.replace('_', ' ')}
                                            </span>
                                        </p>
                                        {rider.phone && (
                                            <p className="text-[10px] text-gray-400 mt-1">📞 {rider.phone}</p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {allMarkers.length > 0 && <FitBounds markers={allMarkers} />}
                    </MapContainer>
                )}

                {/* Drivers count badge */}
                {allMarkers.length > 0 && (
                    <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-bold text-gray-700">
                            {drivers.length} Driver{drivers.length !== 1 ? 's' : ''}, {riders.length} Rider{riders.length !== 1 ? 's' : ''} tracked
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverTrackingMap;
