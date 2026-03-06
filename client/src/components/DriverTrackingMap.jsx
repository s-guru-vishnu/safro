import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FiMapPin, FiTruck, FiUser, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import SUB_OFFICES from '../data/subOffices';
import 'leaflet/dist/leaflet.css';

// ── Color-coded driver icons ─────────────────────────────────────
const DRIVER_COLORS = {
    available: { ring: '#10b981', bg: '#ecfdf5', label: 'Available' },    // 🟢 Green
    on_ride: { ring: '#3b82f6', bg: '#eff6ff', label: 'On Ride' },      // 🔵 Blue
    offline: { ring: '#9ca3af', bg: '#f3f4f6', label: 'Offline' },      // ⚪ Gray
};

const VEHICLE_EMOJIS = {
    bike: '🏍️',
    auto: '🛺',
    sedan: '🚗',
    car: '🚗',
    suv: '🚙',
};

const createDriverIcon = (status, vehicleType) => {
    const color = DRIVER_COLORS[status] || DRIVER_COLORS.available;
    const emoji = VEHICLE_EMOJIS[vehicleType] || '🚗';
    const opacity = status === 'offline' ? '0.4' : '1';

    return L.divIcon({
        html: `<div style="
            position: relative;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
            border-radius: 50%;
            border: 3px solid ${color.ring};
            background: ${color.bg};
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            opacity: ${opacity};
            transition: opacity 0.5s ease, border-color 0.3s ease;
        ">${emoji}</div>`,
        className: 'driver-icon-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

const createRiderIcon = () => L.divIcon({
    html: `<div style="
        color: #3b82f6;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
    ">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
    </div>`,
    className: 'rider-map-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

// ── Sub-office icon ─────────────────────────────────────────────
const createSubOfficeIcon = () => L.divIcon({
    html: `<div style="
        position: relative;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        border-radius: 8px;
        border: 2px solid #f97316;
        background: #fff7ed;
        box-shadow: 0 2px 8px rgba(249,115,22,0.25);
    ">🏢</div>`,
    className: 'suboffice-icon-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
});

// ── Smooth marker position animation ────────────────────────────
const animateMarker = (marker, newLat, newLng, duration = 1000) => {
    const start = marker.getLatLng();
    const startTime = performance.now();

    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const lat = start.lat + (newLat - start.lat) * eased;
        const lng = start.lng + (newLng - start.lng) * eased;
        marker.setLatLng([lat, lng]);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
};

// ── Auto-fit map to markers ─────────────────────────────────────
const FitBounds = ({ markers }) => {
    const map = useMap();
    const hasFitted = useRef(false);

    useEffect(() => {
        if (markers.length > 0 && !hasFitted.current) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            hasFitted.current = true;
        }
    }, [markers, map]);

    return null;
};

// ── Main Component ──────────────────────────────────────────────
const DriverTrackingMap = () => {
    const [drivers, setDrivers] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socketFailed, setSocketFailed] = useState(false);
    const driverMarkersRef = useRef({}); // { driverId: L.Marker instance }
    const mapRef = useRef(null);
    const offlineTimersRef = useRef({}); // { driverId: timeoutId }
    const { socket, isConnected } = useSocket();

    // ── REST Fallback ────────────────────────────────────────────
    const fetchViaREST = useCallback(async () => {
        try {
            console.log('🔄 REST fallback: fetching driver locations...');
            const res = await api.get('/admin/driver-locations');
            const driverData = res.data.drivers || [];
            setDrivers(driverData);
            setLoading(false);
        } catch (err) {
            console.error('REST fallback failed:', err);
            setLoading(false);
        }
    }, []);

    // ── WebSocket: Initial locations + fallback timer ────────────
    useEffect(() => {
        if (!socket) return;

        const requestData = () => {
            console.log('📡 Requesting initial locations via socket...');
            socket.emit('requestInitialLocations');
        };

        const handleInitialLocations = (data) => {
            console.log('🏁 Initial locations received:', data.drivers?.length, 'drivers,', data.riders?.length, 'riders');
            setDrivers(data.drivers || []);
            setRiders(data.riders || []);
            setLoading(false);
            setSocketFailed(false);
        };

        if (socket.connected) {
            requestData();
        }

        socket.on('connect', requestData);
        socket.on('initialLocations', handleInitialLocations);

        // Fallback: if socket doesn't deliver within 10s, try REST
        const fallbackTimer = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ Socket timeout — falling back to REST');
                setSocketFailed(true);
                fetchViaREST();
            }
        }, 10000);

        return () => {
            socket.off('connect', requestData);
            socket.off('initialLocations', handleInitialLocations);
            clearTimeout(fallbackTimer);
        };
    }, [socket, fetchViaREST]);

    // ── WebSocket: Live location updates ─────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleDriverUpdate = ({ driverId, location, status, heading, speed }) => {
            if (!driverId || !location) return;

            setDrivers(prev => {
                const existing = prev.find(d => d._id === driverId);
                if (existing) {
                    return prev.map(d =>
                        d._id === driverId
                            ? { ...d, lat: location.lat, lng: location.lng, status: status || d.status, heading, speed, lastUpdate: Date.now() }
                            : d
                    );
                } else {
                    // New driver appeared — add them
                    return [...prev, {
                        _id: driverId,
                        lat: location.lat,
                        lng: location.lng,
                        status: status || 'available',
                        heading, speed,
                        name: 'Driver',
                        lastUpdate: Date.now()
                    }];
                }
            });

            // Animate the Leaflet marker directly (ref-based, no re-render)
            const marker = driverMarkersRef.current[driverId];
            if (marker) {
                animateMarker(marker, location.lat, location.lng, 1000);
            }

            // Clear any offline timer for this driver
            if (offlineTimersRef.current[driverId]) {
                clearTimeout(offlineTimersRef.current[driverId]);
                delete offlineTimersRef.current[driverId];
            }
        };

        const handleDriverOnline = ({ driverId, driver }) => {
            if (!driverId || !driver) return;
            console.log(`🟢 Driver online: ${driver.name}`);

            setDrivers(prev => {
                const exists = prev.find(d => d._id === driverId);
                if (exists) {
                    return prev.map(d => d._id === driverId ? { ...d, ...driver, status: 'available' } : d);
                }
                return [...prev, { ...driver, _id: driverId, status: 'available' }];
            });
        };

        const handleDriverOffline = ({ driverId, name }) => {
            if (!driverId) return;
            console.log(`🔴 Driver offline: ${name}`);

            // Mark as offline immediately
            setDrivers(prev => prev.map(d =>
                d._id === driverId ? { ...d, status: 'offline' } : d
            ));

            // Update marker icon to gray
            const marker = driverMarkersRef.current[driverId];
            if (marker) {
                marker.setIcon(createDriverIcon('offline', 'sedan'));
            }

            // Remove marker after 30s
            offlineTimersRef.current[driverId] = setTimeout(() => {
                setDrivers(prev => prev.filter(d => d._id !== driverId));
                delete driverMarkersRef.current[driverId];
                delete offlineTimersRef.current[driverId];
            }, 30000);
        };

        const handleRiderUpdate = ({ riderId, location }) => {
            if (!riderId || !location) return;
            setRiders(prev => prev.map(r =>
                r._id === riderId ? { ...r, lat: location.lat, lng: location.lng } : r
            ));
        };

        socket.on('adminDriverLocationUpdate', handleDriverUpdate);
        socket.on('driverOnline', handleDriverOnline);
        socket.on('driverOffline', handleDriverOffline);
        socket.on('adminRiderLocationUpdate', handleRiderUpdate);

        return () => {
            socket.off('adminDriverLocationUpdate', handleDriverUpdate);
            socket.off('driverOnline', handleDriverOnline);
            socket.off('driverOffline', handleDriverOffline);
            socket.off('adminRiderLocationUpdate', handleRiderUpdate);
        };
    }, [socket]);

    // ── REST Polling Fallback (only when socket is disconnected) ─
    useEffect(() => {
        if (isConnected || !socketFailed) return;

        console.log('📡 Starting REST polling fallback (10s interval)');
        const pollInterval = setInterval(fetchViaREST, 10000);

        return () => clearInterval(pollInterval);
    }, [isConnected, socketFailed, fetchViaREST]);

    // ── Manual Refresh ───────────────────────────────────────────
    const handleRefresh = () => {
        setLoading(true);
        if (socket?.connected) {
            socket.emit('requestInitialLocations');
        } else {
            fetchViaREST();
        }
    };

    // ── Stats ────────────────────────────────────────────────────
    const availableCount = drivers.filter(d => d.status === 'available' || d.isAvailable).length;
    const onRideCount = drivers.filter(d => d.status === 'on_ride').length;
    const offlineCount = drivers.filter(d => d.status === 'offline').length;
    const activeRiderCount = riders.length;
    const allMarkers = [...drivers.filter(d => d.lat && d.lng), ...riders.filter(r => r.lat && r.lng)];

    const center = allMarkers.length > 0
        ? [allMarkers[0].lat, allMarkers[0].lng]
        : [12.9716, 77.5946]; // Bengaluru default

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                        <FiMapPin size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">Live Active Map</h3>
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <FiWifi size={10} /> LIVE
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                    <FiWifiOff size={10} /> OFFLINE
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {availableCount} Available
                            </span>
                            {onRideCount > 0 && (
                                <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    {onRideCount} On Ride
                                </span>
                            )}
                            {offlineCount > 0 && (
                                <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                    {offlineCount} Offline
                                </span>
                            )}
                            <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 ml-2">
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
            <div className="relative" style={{ height: '380px' }}>
                {loading && allMarkers.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400">Connecting to live feed...</span>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        center={center}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        {drivers.filter(d => d.lat && d.lng).map(driver => (
                            <Marker
                                key={`driver-${driver._id}`}
                                position={[driver.lat, driver.lng]}
                                icon={createDriverIcon(driver.status || (driver.isAvailable ? 'available' : 'offline'), driver.vehicleType)}
                                ref={(ref) => {
                                    if (ref) driverMarkersRef.current[driver._id] = ref;
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[180px]">
                                        <p className="font-bold text-gray-900 text-sm">{driver.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 capitalize">{driver.vehicleType} • {driver.vehicleNumber}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${driver.status === 'on_ride'
                                                ? 'bg-blue-100 text-blue-700'
                                                : driver.status === 'offline'
                                                    ? 'bg-gray-100 text-gray-500'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {DRIVER_COLORS[driver.status]?.label || 'Available'}
                                            </span>
                                        </div>
                                        {driver.phone && (
                                            <p className="text-[10px] text-gray-400 mt-1">📞 {driver.phone}</p>
                                        )}
                                        {driver.lastUpdate && (
                                            <p className="text-[10px] text-gray-300 mt-0.5">
                                                ⏱ {new Date(driver.lastUpdate).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {riders.filter(r => r.lat && r.lng).map(rider => (
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

                        {/* Sub-Office Markers */}
                        {SUB_OFFICES.map(office => (
                            <Marker
                                key={`office-${office.taluk}`}
                                position={[office.lat, office.lng]}
                                icon={createSubOfficeIcon()}
                            >
                                <Popup>
                                    <div className="min-w-[160px]">
                                        <p className="font-bold text-orange-700 text-sm flex items-center gap-1">🏢 {office.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{office.taluk} Taluk</p>
                                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Sub-Office</span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {allMarkers.length > 0 && <FitBounds markers={allMarkers} />}
                    </MapContainer>
                )}

                {/* Legend + Stats Badge */}
                <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-600"></span> Available
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500 border border-blue-600"></span> On Ride
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-300 border border-gray-400"></span> Offline
                        </span>

                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                        {drivers.length} Driver{drivers.length !== 1 ? 's' : ''} • {riders.length} Rider{riders.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverTrackingMap;
