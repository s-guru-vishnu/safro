import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { FiMapPin, FiNavigation, FiCheck } from 'react-icons/fi';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import './Driver.css';

const LIBRARIES = ['places'];

const containerStyle = { height: '100%', width: '100%', borderRadius: '16px' };

const buildIcon = (emoji, borderColor) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <circle cx="20" cy="20" r="18" fill="white" stroke="${borderColor}" stroke-width="3"/>
            <text x="20" y="26" text-anchor="middle" font-size="18">${emoji}</text>
        </svg>
    `)}`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 20 },
});

const PICKUP_ICON = buildIcon('📍', '#10b981');
const DROP_ICON = buildIcon('🏁', '#ef4444');

const Navigation = () => {
    const [ride, setRide] = useState(null);
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const { socket } = useSocket();
    const mapRef = useRef(null);

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

    useEffect(() => {
        api.get('/rides/active').then(res => {
            if (res.data.ride) setRide(res.data.ride);
        });
    }, []);

    // Send location updates every 5 seconds
    useEffect(() => {
        if (ride && ride.status === 'on_trip' && navigator.geolocation) {
            const interval = setInterval(() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    api.put('/drivers/location', loc);
                    if (socket) {
                        socket.emit('updateDriverLocation', {
                            rideId: ride._id,
                            driverId: ride.driverId,
                            location: loc
                        });
                    }
                });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [ride, socket]);

    const handleStartRide = async () => {
        if (!otp || otp.length !== 4) {
            setOtpError('Enter 4-digit OTP');
            return;
        }
        try {
            const res = await api.put(`/rides/start/${ride._id}`, { otp });
            setRide(res.data.ride);
            setOtpError('');
        } catch (err) {
            setOtpError(err.response?.data?.message || 'Invalid OTP');
        }
    };

    const handleCompleteRide = async () => {
        try {
            const res = await api.put(`/rides/complete/${ride._id}`, { paymentMethod: 'cash' });
            setRide(res.data.ride);
        } catch (err) {
            console.error(err);
        }
    };

    const center = useMemo(() => {
        if (ride?.pickupLocation?.coordinates?.coordinates) {
            return {
                lat: ride.pickupLocation.coordinates.coordinates[1],
                lng: ride.pickupLocation.coordinates.coordinates[0],
            };
        }
        return { lat: 11.0168, lng: 76.9558 };
    }, [ride]);

    const pickupPos = useMemo(() => {
        if (ride?.pickupLocation?.coordinates?.coordinates) {
            return { lat: ride.pickupLocation.coordinates.coordinates[1], lng: ride.pickupLocation.coordinates.coordinates[0] };
        }
        return null;
    }, [ride]);

    const dropPos = useMemo(() => {
        if (ride?.dropLocation?.coordinates?.coordinates) {
            return { lat: ride.dropLocation.coordinates.coordinates[1], lng: ride.dropLocation.coordinates.coordinates[0] };
        }
        return null;
    }, [ride]);

    // Auto-fit bounds
    const onLoad = useCallback((map) => {
        mapRef.current = map;
        const bounds = new window.google.maps.LatLngBounds();
        if (pickupPos) bounds.extend(pickupPos);
        if (dropPos) bounds.extend(dropPos);
        if (pickupPos || dropPos) map.fitBounds(bounds, 50);
    }, [pickupPos, dropPos]);

    if (!ride) {
        return (
            <div className="driver-nav">
                <div className="empty-state">
                    <div className="empty-state-icon">🗺️</div>
                    <h3>No Active Ride</h3>
                    <p>Accept a ride to see navigation</p>
                </div>
            </div>
        );
    }

    return (
        <div className="driver-nav">
            <div className="page-header">
                <h2>Navigation</h2>
                <StatusBadge status={ride.status} />
            </div>

            <div className="tracking-map" style={{ height: '300px', marginBottom: '1.5rem' }}>
                {loadError || authError ? (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-center p-4">
                            <span className="text-xl mb-1 block">🗺️</span>
                            <p className="text-xs font-semibold text-gray-700">Map unavailable</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {authError ? "Auth failed (Check API restrictions/billing)" : "Check API key and network"}
                            </p>
                        </div>
                    </div>
                ) : isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={14}
                        onLoad={onLoad}
                        options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' }}
                    >
                        {pickupPos && <Marker position={pickupPos} icon={PICKUP_ICON} />}
                        {dropPos && <Marker position={dropPos} icon={DROP_ICON} />}
                    </GoogleMap>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <div className="tracking-info">
                <div className="tracking-details">
                    <div className="tracking-detail">
                        <div className="tracking-detail-icon"><FiMapPin /></div>
                        <div className="tracking-detail-text">
                            <span className="tracking-detail-label">Pickup</span>
                            <span className="tracking-detail-value">{ride.pickupLocation?.address}</span>
                        </div>
                    </div>
                    <div className="tracking-detail">
                        <div className="tracking-detail-icon"><FiNavigation /></div>
                        <div className="tracking-detail-text">
                            <span className="tracking-detail-label">Drop-off</span>
                            <span className="tracking-detail-value">{ride.dropLocation?.address}</span>
                        </div>
                    </div>
                </div>

                {(ride.status === 'accepted' || ride.status === 'driver_arrived') && (
                    <div className="otp-input-container">
                        <label>Enter Rider's OTP to Start</label>
                        <div className="otp-input-row">
                            <input
                                type="text"
                                className="otp-input"
                                maxLength={4}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="----"
                            />
                            <button className="otp-verify-btn" onClick={handleStartRide}>
                                <FiCheck /> Verify & Start
                            </button>
                        </div>
                        {otpError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{otpError}</p>}
                    </div>
                )}

                {ride.status === 'on_trip' && (
                    <button className="book-btn" onClick={handleCompleteRide} style={{ marginTop: '1.5rem' }}>
                        <FiCheck /> Complete Ride
                    </button>
                )}

                {ride.status === 'completed' && (
                    <div className="sos-sent" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        ✅ Ride completed successfully!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navigation;
