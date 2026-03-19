import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import RideRequest from '../../components/RideRequest';
import NegotiationChat from '../../components/NegotiationChat';
import RatingModal from '../../components/RatingModal';
import PaymentScreen from '../../components/PaymentScreen';
import AIFareCard from '../../components/AIFareCard';
import { FiCheckCircle, FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import MapView from '../../components/map/MapView';
import ConfirmModal from '../../components/ConfirmModal';

const RiderHome = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeRide, setActiveRide] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null);
    const [showPaymentScreen, setShowPaymentScreen] = useState(false);
    const navigate = useNavigate();
    const [completedRide, setCompletedRide] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Get rider's current location for the initial map view
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

    // Fetch active ride on mount (restore state after refresh)
    useEffect(() => {
        const fetchActiveRide = async () => {
            try {
                const res = await api.get('/rides/active');
                if (res.data.ride) {
                    const ride = res.data.ride;
                    setActiveRide(ride);
                    localStorage.setItem('activeRideId', ride._id);
                    
                    // If ride is not cancelled, and is either not completed OR (completed but unfinalized)
                    // finalize = paid AND rated
                    const isUnfinalized = ride.status !== 'cancelled' && 
                        (ride.status !== 'completed' || ride.paymentStatus !== 'Paid' || !ride.rating);

                    if (isUnfinalized) {
                        navigate('/rider/tracking', { state: { ride } });
                    }
                }
            } catch (err) {
                console.error('Error fetching active ride:', err);
            }
        };
        fetchActiveRide();
    }, []);

    // Socket Reconnection Resync
    useEffect(() => {
        if (socket) {
            const handleConnect = () => {
                const storedRideId = localStorage.getItem('activeRideId');
                if (storedRideId) {
                    socket.emit('resyncRide', { rideId: storedRideId });
                    console.log('Socket reconnected: emitting resyncRide for', storedRideId);
                }
            };

            if (socket.connected) {
                handleConnect();
            }

            socket.on('connect', handleConnect);
            socket.on('reconnect', handleConnect);

            return () => {
                socket.off('connect', handleConnect);
                socket.off('reconnect', handleConnect);
            };
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {
            socket.on('rideConfirmed', (ride) => {
                setActiveRide(ride);
                toast.success('Ride Confirmed! Driver is on the way.');
                navigate('/rider/tracking', { state: { ride } });
            });

            socket.on('rideStatusChanged', (data) => {
                setActiveRide(prev => prev ? ({ ...prev, status: data.status }) : prev);
                if (data.status === 'completed') {
                    localStorage.removeItem('activeRideId');
                    toast.success('You have reached your destination!');
                    // Instead of immediate rating, show payment if pending
                    const rideToPay = prev ? ({ ...prev, status: 'completed' }) : null;
                    if (rideToPay && rideToPay.paymentStatus !== 'Paid') {
                        setCompletedRide(rideToPay);
                        setShowPaymentScreen(true);
                    } else {
                        setShowRatingModal(true);
                    }
                }
            });

            socket.on('negotiationFailed', (data) => {
                setActiveRide(prev => prev ? ({ ...prev, status: 'pending', negotiatingDriverId: null }) : prev);
                toast('Negotiation failed. Waiting for another driver...', { icon: '🔄' });
            });

            socket.on('paymentSuccess', (data) => {
                toast.success('Payment confirmed!');
                setShowPaymentScreen(false);
                setShowRatingModal(true);
                // Refresh active ride state or clear it
                setActiveRide(null);
            });

            socket.on('rideCancelled', () => {
                setActiveRide(null);
                setDriverLocation(null);
                localStorage.removeItem('activeRideId');
                toast.error('Ride has been cancelled.');
            });

            // Listen for driver's live location (only matters after confirmation)
            socket.on('driverLocationUpdate', (data) => {
                setDriverLocation(data.location);
            });

            return () => {
                socket.off('rideConfirmed');
                socket.off('rideStatusChanged');
                socket.off('negotiationFailed');
                socket.off('rideCancelled');
                socket.off('driverLocationUpdate');
            };
        }
    }, [socket]);

    const handleRideCreated = (ride) => {
        setActiveRide(ride);
        localStorage.setItem('activeRideId', ride._id);
    };

    const handleRideUpdate = (ride) => {
        setActiveRide(ride);
        localStorage.setItem('activeRideId', ride._id);
    };

    // Live location sharing — only when ride is confirmed or ongoing
    useEffect(() => {
        if (!socket || !activeRide) return;
        const isLive = activeRide.status === 'confirmed' || activeRide.status === 'ongoing';
        if (!isLive) return;

        // Join ride room so we receive driver location updates
        socket.emit('joinRide', { rideId: activeRide._id });

        // Watch our own position and emit to driver
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setRiderLocation(loc);
                    socket.emit('updateRiderLocation', {
                        rideId: activeRide._id,
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
            socket.emit('leaveRide', { rideId: activeRide._id });
        };
    }, [socket, activeRide?._id, activeRide?.status, user._id]);

    const handlePaymentComplete = (updatedRide) => {
        setCompletedRide(updatedRide);
        setShowPaymentScreen(false);
        setShowRatingModal(true);
    };

    const handleCancelRide = async () => {
        setShowCancelConfirm(true);
    };

    const executeCancelRide = async () => {
        try {
            await api.put(`/rides/${activeRide._id}/cancel`, {
                reason: 'Cancelled by rider'
            });
            toast.success('Ride cancelled successfully');
            setActiveRide(null);
            localStorage.removeItem('activeRideId');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel ride');
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Greeting */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="text-sm text-gray-500 mt-1">Where would you like to go today?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Ride Request or Status */}
                    <div className="lg:col-span-1">
                        {!activeRide || activeRide.status === 'completed' || activeRide.status === 'cancelled' ? (
                            <RideRequest onRideCreated={handleRideCreated} />
                        ) : (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <FiCheckCircle className="text-teal-600" />
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Ride {activeRide.status?.charAt(0).toUpperCase() + activeRide.status?.slice(1).replace('_', ' ')}
                                        </h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex gap-3">
                                            <FiMapPin className="text-teal-600 mt-0.5 flex-shrink-0" size={14} />
                                            <div>
                                                <span className="text-xs text-gray-400 block">Pickup</span>
                                                <span className="text-gray-700">{activeRide.pickupLocation?.address}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <FiNavigation className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                                            <div>
                                                <span className="text-xs text-gray-400 block">Drop</span>
                                                <span className="text-gray-700">{activeRide.dropLocation?.address}</span>
                                            </div>
                                        </div>
                                        {activeRide.otp && activeRide.status === 'confirmed' && (
                                            <div className="flex flex-col items-center justify-center p-4 bg-teal-600 rounded-xl text-white shadow-lg shadow-teal-100">
                                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Ride OTP</span>
                                                <span className="text-3xl font-mono font-bold tracking-[8px]">{activeRide.otp}</span>
                                                <p className="text-[10px] mt-2 opacity-50">Share this with your driver to start</p>
                                            </div>
                                        )}
                                        {(activeRide.proposedFare > 0 || activeRide.fare?.proposed > 0) && (
                                            <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
                                                <span className="text-xs text-teal-600">Fare:</span>
                                                <span className="font-bold text-teal-700">₹{activeRide.fare?.final || activeRide.proposedFare || activeRide.fare?.proposed}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                {/* AI Fare Prediction */}
                                {['requested', 'negotiating', 'pending'].includes(activeRide?.status) && activeRide?.aiPrediction && (
                                    <AIFareCard prediction={activeRide.aiPrediction} />
                                )}

                                {/* Cancel Button */}
                                {(activeRide.status === 'requested' || activeRide.status === 'negotiating' || activeRide.status === 'pending' || activeRide.status === 'accepted' || activeRide.status === 'confirmed') && (
                                    <button
                                        onClick={handleCancelRide}
                                        disabled={cancelLoading}
                                        className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors border border-red-200"
                                    >
                                        {cancelLoading ? 'Cancelling...' : 'Cancel Ride'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Map + Negotiation */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map / Location Panel */}
                        <div className="bg-white h-96 rounded-2xl border border-gray-200 relative overflow-hidden shadow-sm">
                            <MapView
                                pickupCoordinates={activeRide?.pickupLocation?.coordinates?.coordinates ? {
                                    lat: activeRide.pickupLocation.coordinates.coordinates[1],
                                    lng: activeRide.pickupLocation.coordinates.coordinates[0]
                                } : null}
                                dropCoordinates={activeRide?.dropLocation?.coordinates?.coordinates ? {
                                    lat: activeRide.dropLocation.coordinates.coordinates[1],
                                    lng: activeRide.dropLocation.coordinates.coordinates[0]
                                } : null}
                                driverCoordinates={driverLocation ? {
                                    lat: driverLocation.lat,
                                    lng: driverLocation.lng
                                } : null}
                                riderCoordinates={riderLocation}
                            />

                            {/* Live Status Overlay */}
                            {activeRide && (activeRide.status === 'confirmed' || activeRide.status === 'ongoing') && (
                                <div className="absolute top-4 left-4 z-[1000]">
                                    <div className="bg-teal-600/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10">
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                            {activeRide.status === 'confirmed' ? 'Driver en route' : 'Trip in progress'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Negotiation Panel */}
                        {activeRide && (activeRide.status === 'negotiating' || activeRide.status === 'requested' || activeRide.status === 'pending') && (
                            <NegotiationChat ride={activeRide} onRideUpdate={handleRideUpdate} />
                        )}
                    </div>
                </div>
            </div>

            <RatingModal
                ride={completedRide || activeRide}
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmitted={() => setShowRatingModal(false)}
            />

            {showPaymentScreen && (completedRide || activeRide) && (
                <PaymentScreen
                    ride={completedRide || activeRide}
                    onPaymentSuccess={handlePaymentComplete}
                />
            )}

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={executeCancelRide}
                title="Cancel Ride?"
                message="Are you sure you want to cancel this ride? This may affect your rider rating."
                confirmText="Yes, Cancel"
                cancelText="Keep Ride"
                type="danger"
            />
        </div>
    );
};

export default RiderHome;
