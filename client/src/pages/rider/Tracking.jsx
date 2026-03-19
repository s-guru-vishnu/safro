import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiNavigation, FiDollarSign, FiClock, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import MapView from '../../components/map/MapView';
import ConfirmModal from '../../components/ConfirmModal';
import PaymentScreen from '../../components/PaymentScreen';
import RatingModal from '../../components/RatingModal';

const statusMessages = {
    requested: 'Finding your driver...',
    negotiating: 'Negotiating fare...',
    pending: 'Finding your driver...',
    accepted: 'Driver on the way!',
    confirmed: 'Driver is coming!',
    driver_arrived: 'Driver has arrived!',
    otp_verified: 'OTP verified — starting trip',
    on_trip: "You're on your way!",
    completed: 'Ride completed!',
    cancelled: 'Ride cancelled',
};

const Tracking = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [ride, setRide] = useState(location.state?.ride || null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Get rider's current location for initial map view
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.warn('Geolocation unavailable:', err.message),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, []);

    useEffect(() => {
        if (!ride) {
            api.get('/rides/active').then(res => {
                if (res.data.ride) {
                    setRide(res.data.ride);
                    if (res.data.ride.status === 'completed' && res.data.ride.paymentStatus === 'Paid' && !res.data.ride.rating) {
                        setShowRatingModal(true);
                    }
                }
            }).catch(() => { });
        } else if (ride.status === 'completed' && ride.paymentStatus === 'Paid' && !ride.rating) {
            setShowRatingModal(true);
        }
    }, [ride?._id]);

    useEffect(() => {
        if (socket && ride) {
            socket.emit('joinRide', { rideId: ride._id });
            socket.on('driverLocationUpdate', (data) => {
                // Support both {latitude, longitude} and {lat, lng}
                const loc = data.location.lat ? data.location : { lat: data.location.latitude, lng: data.location.longitude };
                setDriverLocation(loc);
            });
            socket.on('rideStatusChanged', (data) => {
                setRide(prev => ({ ...prev, status: data.status }));
                if (data.status === 'cancelled') {
                    setTimeout(() => navigate('/rider/home'), 2000);
                }
            });
            socket.on('paymentInitiated', (data) => {
                setRide(prev => ({ ...prev, paymentStatus: 'Driver Confirmation', paymentMethod: data.method }));
            });
            socket.on('paymentSuccess', (data) => {
                setRide(prev => ({ ...prev, paymentStatus: 'Paid' }));
                toast.success('Payment confirmed!');
                setShowRatingModal(true);
            });
            socket.on('rideAccepted', (data) => {
                if (data.rideId === ride._id) setRide(prev => ({ ...prev, status: 'accepted', driverId: data.driverId }));
            });
            return () => {
                socket.off('driverLocationUpdate');
                socket.off('rideStatusChanged');
                socket.off('paymentInitiated');
                socket.off('paymentSuccess');
                socket.off('rideAccepted');
            };
        }
    }, [socket, ride?._id]);

    // Live location sharing — only when ride is confirmed or ongoing
    useEffect(() => {
        if (!socket || !ride) return;
        const isLive = ride.status === 'confirmed' || ride.status === 'accepted' || ride.status === 'on_trip' || ride.status === 'driver_arrived';
        if (!isLive) return;

        // Watch our own position and emit to driver
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setRiderLocation(loc);
                    socket.emit('updateRiderLocation', {
                        rideId: ride._id,
                        riderId: user._id,
                        location: loc
                    });
                },
                (err) => console.warn('Geolocation error:', err.message),
                { enableHighAccuracy: true, maximumAge: 5000 }
            );
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [socket, ride?._id, ride?.status, user?._id]);

    const center = ride?.pickupLocation?.coordinates?.coordinates
        ? [ride.pickupLocation.coordinates.coordinates[1], ride.pickupLocation.coordinates.coordinates[0]]
        : [12.9716, 77.5946];

    const isConfirmed = ride?.status === 'confirmed' || ride?.status === 'driver_arrived' || ride?.status === 'otp_verified' || ride?.status === 'on_trip';
    const canCancel = ride?.status === 'requested' || ride?.status === 'negotiating' || ride?.status === 'pending' || ride?.status === 'accepted' || ride?.status === 'confirmed';

    const handleCancelRide = async () => {
        setShowCancelConfirm(true);
    };

    const executeCancelRide = async () => {
        try {
            await api.put(`/rides/${ride._id}/cancel`, {
                reason: 'Cancelled by rider'
            });
            toast.success('Ride cancelled successfully');
            setRide(prev => ({ ...prev, status: 'cancelled' }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel ride');
        } finally {
            setCancelLoading(false);
        }
    };

    if (!ride) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white rounded-2xl border border-gray-200 p-12 max-w-sm mx-auto"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Ride</h3>
                    <p className="text-sm text-gray-400 mb-6">Book a ride to see live tracking here.</p>
                    <Link to="/rider/home" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all">
                        <FiArrowLeft size={14} /> Book a Ride
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
                    <StatusBadge status={ride.status} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Map */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative" style={{ height: 420 }}>
                        <MapView
                            pickupCoordinates={ride.pickupLocation?.coordinates?.coordinates ? {
                                lat: ride.pickupLocation.coordinates.coordinates[1],
                                lng: ride.pickupLocation.coordinates.coordinates[0]
                            } : null}
                            dropCoordinates={ride.dropLocation?.coordinates?.coordinates ? {
                                lat: ride.dropLocation.coordinates.coordinates[1],
                                lng: ride.dropLocation.coordinates.coordinates[0]
                            } : null}
                            driverCoordinates={driverLocation}
                            riderCoordinates={riderLocation}
                        />

                        {/* Status Overlay for Map */}
                        <div className="absolute top-4 left-4 z-[1000]">
                            <div className="bg-teal-600/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10 text-white">
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                    {statusMessages[ride.status] || 'Live Tracking'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="space-y-4">
                        {/* Status Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-200 p-5"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${ride.status === 'completed' ? 'bg-green-500' : ride.status === 'cancelled' ? 'bg-red-500' : 'bg-teal-500'
                                    }`}>
                                    <FiClock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        {statusMessages[ride.status] || 'Ride in progress'}
                                    </h3>
                                    <p className="text-xs text-gray-400 capitalize">{ride.status?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            {/* OTP */}
                            {ride.otp && ride.status !== 'on_trip' && ride.status !== 'completed' && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                                    <p className="text-xs text-amber-600 font-medium mb-1">Share this OTP with your driver</p>
                                    <div className="text-3xl font-bold text-amber-700 tracking-[0.3em]">{ride.otp}</div>
                                </div>
                            )}
                        </motion.div>

                        {/* Route Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><div className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-100" /></div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pickup</span>
                                    <p className="text-sm text-gray-800 font-medium">{ride.pickupLocation?.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-100" /></div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Drop-off</span>
                                    <p className="text-sm text-gray-800 font-medium">{ride.dropLocation?.address}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <FiDollarSign className="text-teal-600" size={14} />
                                    <span className="text-lg font-bold text-gray-900">₹{ride.fare?.final || ride.fare?.proposed || ride.fare || '—'}</span>
                                </div>
                                <span className="text-xs text-gray-400">{ride.distance || '—'} km</span>
                            </div>
                        </motion.div>

                        {canCancel && (
                            <button
                                onClick={handleCancelRide}
                                disabled={cancelLoading}
                                className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors border border-red-200"
                            >
                                {cancelLoading ? 'Cancelling...' : 'Cancel Ride'}
                            </button>
                        )}

                        {/* SOS */}
                        <Link
                            to="/rider/sos"
                            className="block w-full mt-4 py-3 rounded-xl text-center text-sm font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                        >
                            Emergency SOS
                        </Link>
                    </div>
                </div>
            </div>

            {/* Payment & Rating Layer */}
            {ride.status === 'completed' && ride.paymentStatus !== 'Paid' && (
                <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-none">
                    <div className="pointer-events-auto">
                        <PaymentScreen 
                            ride={ride} 
                            user={user} 
                            onPaymentSuccess={() => {
                                setRide(prev => ({ ...prev, paymentStatus: 'Paid' }));
                                setShowRatingModal(true);
                            }} 
                        />
                    </div>
                </div>
            )}

            <RatingModal 
                ride={ride}
                isOpen={showRatingModal}
                onClose={() => navigate('/rider/home')}
                onSubmitted={() => {
                    toast.success('Thank you for your feedback!');
                    navigate('/rider/home');
                }}
            />

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={executeCancelRide}
                title="Cancel Ride?"
                message="Are you sure you want to cancel this ride? Driving partners rely on these bookings."
                confirmText="Yes, Cancel"
                cancelText="Keep Ride"
                type="danger"
            />
        </div>
    );
};

export default Tracking;
