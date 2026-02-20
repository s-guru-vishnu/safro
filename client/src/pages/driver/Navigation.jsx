import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { FiMapPin, FiNavigation, FiCheck } from 'react-icons/fi';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Driver.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Navigation = () => {
    const [ride, setRide] = useState(null);
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const { socket } = useSocket();

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

    const center = ride.pickupLocation?.coordinates?.coordinates
        ? [ride.pickupLocation.coordinates.coordinates[1], ride.pickupLocation.coordinates.coordinates[0]]
        : [12.9716, 77.5946];

    return (
        <div className="driver-nav">
            <div className="page-header">
                <h2>Navigation</h2>
                <StatusBadge status={ride.status} />
            </div>

            <div className="tracking-map" style={{ height: '300px', marginBottom: '1.5rem' }}>
                <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '16px' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {ride.pickupLocation?.coordinates?.coordinates && (
                        <Marker position={[ride.pickupLocation.coordinates.coordinates[1], ride.pickupLocation.coordinates.coordinates[0]]} />
                    )}
                    {ride.dropLocation?.coordinates?.coordinates && (
                        <Marker position={[ride.dropLocation.coordinates.coordinates[1], ride.dropLocation.coordinates.coordinates[0]]} />
                    )}
                </MapContainer>
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
