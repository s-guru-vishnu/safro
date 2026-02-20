import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import RideRequest from '../../components/RideRequest';
import NegotiationChat from '../../components/NegotiationChat';
import RatingModal from '../../components/RatingModal';
import AIFareCard from '../../components/AIFareCard';
import { FiCheckCircle, FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RiderHome = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeRide, setActiveRide] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null);

    // Fetch active ride on mount (restore state after refresh)
    useEffect(() => {
        const fetchActiveRide = async () => {
            try {
                const res = await api.get('/rides/active');
                if (res.data.ride) {
                    setActiveRide(res.data.ride);
                    localStorage.setItem('activeRideId', res.data.ride._id);
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
            });

            socket.on('rideStatusChanged', (data) => {
                setActiveRide(prev => prev ? ({ ...prev, status: data.status }) : prev);
                if (data.status === 'completed') {
                    localStorage.removeItem('activeRideId');
                    toast.success('You have reached your destination!');
                    setShowRatingModal(true);
                }
            });

            socket.on('negotiationFailed', (data) => {
                setActiveRide(prev => prev ? ({ ...prev, status: 'pending', negotiatingDriverId: null }) : prev);
                toast('Negotiation failed. Waiting for another driver...', { icon: '🔄' });
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
                                            <div className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-xl text-white">
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
                                {activeRide.aiPrediction && (
                                    <AIFareCard prediction={activeRide.aiPrediction} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Map + Negotiation */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map / Location Panel */}
                        <div className="bg-white h-80 rounded-xl border border-gray-200 relative overflow-hidden">
                            {activeRide && (activeRide.status === 'confirmed' || activeRide.status === 'ongoing') && driverLocation ? (
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-3 flex items-center justify-between">
                                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                            <FiNavigation size={14} className="text-teal-400" />
                                            Live Tracking
                                        </h3>
                                        <span className="flex items-center gap-1.5 text-xs text-teal-300">
                                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                                            Live
                                        </span>
                                    </div>
                                    <div className="flex-1 p-5 flex flex-col justify-center space-y-4">
                                        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />
                                                <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Driver Location</span>
                                            </div>
                                            <p className="text-sm text-gray-700 font-mono">
                                                {driverLocation.lat?.toFixed(5)}, {driverLocation.lng?.toFixed(5)}
                                            </p>
                                        </div>
                                        {riderLocation && (
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Your Location</span>
                                                </div>
                                                <p className="text-sm text-gray-700 font-mono">
                                                    {riderLocation.lat?.toFixed(5)}, {riderLocation.lng?.toFixed(5)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" />
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                                        <FiMapPin className="text-gray-300 mx-auto mb-2" size={32} />
                                        <span className="text-sm text-gray-400 font-medium">Map View</span>
                                        <span className="block text-xs text-gray-300 mt-1">
                                            {activeRide && (activeRide.status === 'confirmed' || activeRide.status === 'ongoing')
                                                ? 'Waiting for driver location...'
                                                : 'Location sharing starts after ride confirmation'}
                                        </span>
                                    </div>
                                </>
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
                ride={activeRide}
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmitted={() => setShowRatingModal(false)}
            />
        </div>
    );
};

export default RiderHome;
