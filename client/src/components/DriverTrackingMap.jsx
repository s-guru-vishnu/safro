import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Truck, User, RefreshCw, Wifi, WifiOff, Map, Layers, Activity, Building, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import SUB_OFFICES from '../data/subOffices';

const LIBRARIES = ['places'];

// ── Color-coded driver status ───────────────────────────────────
const DRIVER_COLORS = {
    available: { ring: '#10b981', label: 'Available' },
    on_ride: { ring: '#3b82f6', label: 'On Ride' },
    offline: { ring: '#9ca3af', label: 'Offline' },
};

// ── SVG marker builder ──────────────────────────────────────────
const buildMarkerIcon = (path, borderColor, opacity = 1) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${borderColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" fill="white" stroke-width="1.5" opacity="${opacity}"/>
            <g transform="translate(6, 6) scale(0.5)">
                ${path}
            </g>
        </svg>
    `)}`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 20 },
});

// Paths for Lucide-like icons (simplified)
const PATHS = {
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.5C1.4 11.1 1 12 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    auto: '<path d="M3 11V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/><path d="M12 5v12"/>', // Using a generic 3-wheel style
    building: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

const SUB_OFFICE_ICON = buildMarkerIcon(PATHS.building, '#f97316');
const RIDER_ICON = buildMarkerIcon(PATHS.user, '#10b981');

const containerStyle = { width: '100%', height: '100%' };

// ── Main Component ──────────────────────────────────────────────
const DriverTrackingMap = () => {
    const { user } = useAuth();
    const [drivers, setDrivers] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socketFailed, setSocketFailed] = useState(false);
    const [activeInfo, setActiveInfo] = useState(null);
    const [mapType, setMapType] = useState('roadmap');
    const [trafficEnabled, setTrafficEnabled] = useState(false);
    const mapRef = useRef(null);
    const trafficLayerRef = useRef(null);
    const offlineTimersRef = useRef({});
    const { socket, isConnected } = useSocket();

    const [authError, setAuthError] = useState(false);
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY || '',
        libraries: LIBRARIES,
    });

    useEffect(() => {
        window.gm_authFailure = () => {
            console.error('Safro: Google Maps Authentication Failed.');
            setAuthError(true);
        };
        return () => { delete window.gm_authFailure; };
    }, []);

    // ── REST Fallback ────────────────────────────────────────────
    const fetchViaREST = useCallback(async () => {
        try {
            const res = await api.get('/admin/driver-locations');
            setDrivers(res.data.drivers || []);
            setLoading(false);
        } catch (err) {
            console.error('REST fallback failed:', err);
            setLoading(false);
        }
    }, []);

    // ── WebSocket: Initial locations + fallback timer ────────────
    useEffect(() => {
        if (!socket) return;

        const requestData = () => socket.emit('requestInitialLocations');

        const handleInitialLocations = (data) => {
            setDrivers(data.drivers || []);
            setRiders(data.riders || []);
            setLoading(false);
            setSocketFailed(false);
        };

        if (socket.connected) requestData();

        socket.on('connect', requestData);
        socket.on('initialLocations', handleInitialLocations);

        const fallbackTimer = setTimeout(() => {
            if (loading) {
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
                }
                return [...prev, { _id: driverId, lat: location.lat, lng: location.lng, status: status || 'available', heading, speed, name: 'Driver', lastUpdate: Date.now() }];
            });

            if (offlineTimersRef.current[driverId]) {
                clearTimeout(offlineTimersRef.current[driverId]);
                delete offlineTimersRef.current[driverId];
            }
        };

        const handleDriverOnline = ({ driverId, driver }) => {
            if (!driverId || !driver) return;
            setDrivers(prev => {
                const exists = prev.find(d => d._id === driverId);
                if (exists) return prev.map(d => d._id === driverId ? { ...d, ...driver, status: 'available' } : d);
                return [...prev, { ...driver, _id: driverId, status: 'available' }];
            });
        };

        const handleDriverOffline = ({ driverId }) => {
            if (!driverId) return;
            setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, status: 'offline' } : d));
            offlineTimersRef.current[driverId] = setTimeout(() => {
                setDrivers(prev => prev.filter(d => d._id !== driverId));
                delete offlineTimersRef.current[driverId];
            }, 30000);
        };

        const handleRiderUpdate = ({ riderId, location }) => {
            if (!riderId || !location) return;
            setRiders(prev => prev.map(r => r._id === riderId ? { ...r, lat: location.lat, lng: location.lng } : r));
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

    // ── REST Polling Fallback ─────────────────────────────────────
    useEffect(() => {
        if (isConnected || !socketFailed) return;
        const pollInterval = setInterval(fetchViaREST, 10000);
        return () => clearInterval(pollInterval);
    }, [isConnected, socketFailed, fetchViaREST]);

    // ── Traffic layer ────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;
        if (trafficEnabled) {
            if (!trafficLayerRef.current) trafficLayerRef.current = new window.google.maps.TrafficLayer();
            trafficLayerRef.current.setMap(mapRef.current);
        } else {
            if (trafficLayerRef.current) trafficLayerRef.current.setMap(null);
        }
    }, [trafficEnabled, isLoaded]);

    // ── Taluk GeoJSON ─────────────────────────────────────────────
    const [talukGeoJson, setTalukGeoJson] = useState(null);
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;
        
        const loadTaluks = async () => {
            try {
                const map = mapRef.current;
                map.data.loadGeoJson('/maps/tamilnadu-taluks.geojson');
                
                map.data.setStyle((feature) => {
                    const isSelected = feature.getProperty('taluk') === user?.taluk;
                    return {
                        fillColor: isSelected ? '#10b981' : '#00b894',
                        fillOpacity: isSelected ? 0.3 : 0.05,
                        strokeColor: '#00b894',
                        strokeWeight: isSelected ? 2 : 1,
                        clickable: false
                    };
                });
            } catch (err) {
                console.error('Failed to load taluk boundaries:', err);
            }
        };

        loadTaluks();
    }, [isLoaded, user?.taluk]);

    // ── Manual Refresh ───────────────────────────────────────────
    const handleRefresh = () => {
        setLoading(true);
        if (socket?.connected) socket.emit('requestInitialLocations');
        else fetchViaREST();
    };

    // ── Stats ────────────────────────────────────────────────────
    const availableCount = drivers.filter(d => d.status === 'available' || d.isAvailable).length;
    const onRideCount = drivers.filter(d => d.status === 'on_ride').length;
    const offlineCount = drivers.filter(d => d.status === 'offline').length;
    const activeRiderCount = riders.length;

    const allMarkers = useMemo(() =>
        [...drivers.filter(d => d.lat && d.lng), ...riders.filter(r => r.lat && r.lng)],
        [drivers, riders]
    );

    const center = allMarkers.length > 0
        ? { lat: allMarkers[0].lat, lng: allMarkers[0].lng }
        : { lat: 11.0168, lng: 76.9558 };

    // ── Auto-fit bounds ──────────────────────────────────────────
    const hasFittedRef = useRef(false);
    useEffect(() => {
        if (!mapRef.current || allMarkers.length === 0 || hasFittedRef.current) return;
        const bounds = new window.google.maps.LatLngBounds();
        allMarkers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
        mapRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        hasFittedRef.current = true;
    }, [allMarkers]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Active Map</h3>
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <Wifi size={10} /> LIVE
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                    <WifiOff size={10} /> OFFLINE
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {availableCount} Available
                            </span>
                            {onRideCount > 0 && (
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full"></span>
                                    {onRideCount} On Ride
                                </span>
                            )}
                            {offlineCount > 0 && (
                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                    {offlineCount} Offline
                                </span>
                            )}
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 ml-2">
                                <UserIcon size={10} />
                                {activeRiderCount} Active Riders
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:bg-teal-900/20 rounded-lg transition-all disabled:opacity-50"
                    title="Refresh locations"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Map Container */}
            <div className="relative" style={{ height: '380px' }}>
                {loading && allMarkers.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">Connecting to live feed...</span>
                        </div>
                    </div>
                ) : (loadError || authError) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <div className="text-center p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 backdrop-blur-sm shadow-sm m-4">
                            <div className="text-2xl mb-2 text-gray-400 dark:text-gray-500 flex justify-center"><Map size={32} /></div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Map unavailable</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                                {authError ? "Authentication failed. Check API restrictions or billing." : "Check API key and network connection."}
                            </p>
                        </div>
                    </div>
                ) : !isLoaded ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">Loading map...</span>
                        </div>
                    </div>
                ) : (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={12}
                        mapTypeId={mapType}
                        onLoad={(map) => { mapRef.current = map; }}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            gestureHandling: 'greedy',
                            clickableIcons: false,
                        }}
                    >
                        {/* Driver Markers */}
                        {drivers.filter(d => d.lat && d.lng).map(driver => {
                            const color = DRIVER_COLORS[driver.status] || DRIVER_COLORS.available;
                            const path = PATHS[driver.vehicleType] || PATHS.car;
                            const opacity = driver.status === 'offline' ? 0.4 : 1;
                            return (
                                <Marker
                                    key={`driver-${driver._id}`}
                                    position={{ lat: driver.lat, lng: driver.lng }}
                                    icon={buildMarkerIcon(path, color.ring, opacity)}
                                    onClick={() => setActiveInfo(`driver-${driver._id}`)}
                                >
                                    {activeInfo === `driver-${driver._id}` && (
                                        <InfoWindow onCloseClick={() => setActiveInfo(null)}>
                                            <div className="min-w-[180px]">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{driver.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{driver.vehicleType} • {driver.vehicleNumber}</p>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                                                    driver.status === 'on_ride' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                                                    : driver.status === 'offline' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>{color.label}</span>
                                                {driver.phone && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1"><Phone size={10} /> {driver.phone}</p>}
                                                {driver.lastUpdate && <p className="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1"><Clock size={10} /> {new Date(driver.lastUpdate).toLocaleTimeString()}</p>}
                                            </div>
                                        </InfoWindow>
                                    )}
                                </Marker>
                            );
                        })}

                        {/* Rider Markers */}
                        {riders.filter(r => r.lat && r.lng).map(rider => (
                            <Marker
                                key={`rider-${rider._id}`}
                                position={{ lat: rider.lat, lng: rider.lng }}
                                icon={RIDER_ICON}
                                onClick={() => setActiveInfo(`rider-${rider._id}`)}
                            >
                                {activeInfo === `rider-${rider._id}` && (
                                    <InfoWindow onCloseClick={() => setActiveInfo(null)}>
                                        <div className="min-w-[160px]">
                                            <p className="font-bold text-blue-900 text-sm flex items-center gap-1"><UserIcon size={14} /> {rider.name}</p>
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 uppercase tracking-widest mt-1">
                                                {rider.status?.replace('_', ' ')}
                                            </span>
                                            {rider.phone && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1"><Phone size={10} /> {rider.phone}</p>}
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        ))}

                        {/* Sub-Office Markers */}
                        {SUB_OFFICES.map(office => (
                            <Marker
                                key={`office-${office.taluk}`}
                                position={{ lat: office.lat, lng: office.lng }}
                                icon={SUB_OFFICE_ICON}
                                onClick={() => setActiveInfo(`office-${office.taluk}`)}
                            >
                                {activeInfo === `office-${office.taluk}` && (
                                    <InfoWindow onCloseClick={() => setActiveInfo(null)}>
                                        <div className="min-w-[160px]">
                                            <p className="font-bold text-orange-700 text-sm flex items-center gap-1"><Building size={14} /> {office.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{office.taluk} Taluk</p>
                                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700">Sub-Office</span>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        ))}
                    </GoogleMap>
                )}

                {/* Map Controls */}
                {isLoaded && !loadError && (
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex overflow-hidden">
                            <button onClick={() => setMapType('roadmap')} className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${mapType === 'roadmap' ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <Map size={10} /> Map
                            </button>
                            <button onClick={() => setMapType('satellite')} className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${mapType === 'satellite' ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <Layers size={10} /> Satellite
                            </button>
                        </div>
                        <button
                            onClick={() => setTrafficEnabled(prev => !prev)}
                            className={`px-2.5 py-1.5 rounded-lg shadow-md border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 backdrop-blur-sm ${trafficEnabled ? 'bg-teal-600 text-white border-teal-600' : 'bg-white/95 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            <Activity size={10} /> {trafficEnabled ? 'Traffic On' : 'Traffic'}
                        </button>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-3 left-3 z-10 bg-white dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-600"></span> Available
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-600"></span> On Ride
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-gray-300 border border-gray-400"></span> Offline
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        {drivers.length} Driver{drivers.length !== 1 ? 's' : ''} • {riders.length} Rider{riders.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverTrackingMap;
