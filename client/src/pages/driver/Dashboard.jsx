import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NegotiationChat from '../../components/NegotiationChat';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiNavigation, FiMessageCircle, FiXCircle, FiCheckCircle, FiDollarSign, FiTruck, FiStar } from 'react-icons/fi';
import { Banknote } from 'lucide-react';
import MapView from '../../components/map/MapView';

const DriverDashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [availableRides, setAvailableRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [riderLocation, setRiderLocation] = useState(null);
    const [stats, setStats] = useState(null);

    // Get driver's current location for geo-filtered rides + register with tracking system
    useEffect(() => {
        if (!navigator.geolocation || !socket) return;

        let driverProfileId = null;

        // Fetch the driver profile ID to use for driverJoin
        api.get('/drivers/stats').then(res => {
            driverProfileId = res.data?._id;
        }).catch(() => { });

        // Get initial position and register with tracking
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setDriverLocation(loc);

                // Emit driverJoin for cache registration
                socket.emit('driverLocationIdle', { userId: user._id, location: loc });
            },
            (err) => console.warn('Geolocation unavailable:', err.message),
            { enableHighAccuracy: true, timeout: 5000 }
        );

        // Watch position — throttled to every ~5 seconds via maximumAge
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setDriverLocation(loc);

                // Send location update (compatible with both old and new handler)
                socket.emit('driverLocationIdle', { userId: user._id, location: loc });
            },
            (err) => console.warn('Watch position error:', err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [socket, user._id]);

    // Fetch active ride on mount (restore after refresh)
    useEffect(() => {
        const fetchActiveRide = async () => {
            try {
                const res = await api.get('/rides/active');
                if (res.data.ride) {
                    setActiveRide(res.data.ride);
                    localStorage.setItem('activeRideId', res.data.ride._id);
                    const status = res.data.ride.status;
                    if (status === 'negotiating') {
                        setIsNegotiating(true);
                        setShowChat(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching active ride:', err);
            }
        };
        fetchActiveRide();

        const fetchStats = async () => {
            try {
                const res = await api.get('/drivers/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching driver stats:', err);
            }
        };
        fetchStats();
    }, []);

    // Socket Reconnection Resync
    useEffect(() => {
        if (socket) {
            const handleConnect = () => {
                const storedRideId = localStorage.getItem('activeRideId');
                if (storedRideId) {
                    socket.emit('resyncRide', { rideId: storedRideId });
                    console.log('Driver Socket reconnected: emitting resyncRide for', storedRideId);
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

    // Fetch available rides with geo filter
    const fetchAvailableRides = useCallback(async () => {
        try {
            let url = '/rides/available';
            if (driverLocation) {
                url += `?lat=${driverLocation.lat}&lng=${driverLocation.lng}`;
            }
            const res = await api.get(url);
            setAvailableRides(res.data);
        } catch (err) {
            console.error('Error fetching rides:', err);
        }
    }, [driverLocation]);

    useEffect(() => {
        fetchAvailableRides();
    }, [fetchAvailableRides]);

    // Socket events
    useEffect(() => {
        if (socket) {
            socket.emit('joinRoom', { userId: user._id, role: 'driver' });

            socket.on('newRideRequest', (ride) => {
                toast.success('New Ride Request!');
                setAvailableRides(prev => [ride, ...prev]);
            });

            socket.on('rideConfirmed', (ride) => {
                if (ride.driverId === user._id) {
                    setActiveRide(ride);
                    setIsNegotiating(false);
                    toast.success('Ride Confirmed! Proceed to pickup.');
                } else {
                    setAvailableRides(prev => prev.filter(r => r._id !== ride._id));
                }
            });

            socket.on('rideRemovedFromPool', ({ rideId }) => {
                setAvailableRides(prev => prev.filter(r => r._id !== rideId));
            });

            socket.on('rideBackInPool', (ride) => {
                setAvailableRides(prev => {
                    if (prev.some(r => r._id === ride._id)) return prev;
                    return [ride, ...prev];
                });
            });

            socket.on('rideStatusChanged', (data) => {
                setActiveRide(prev => prev ? ({ ...prev, status: data.status }) : prev);
                if (data.status === 'completed') {
                    localStorage.removeItem('activeRideId');
                    setActiveRide(null);
                    setShowChat(false);
                    setIsNegotiating(false);
                    fetchAvailableRides();

                    // Re-fetch stats on ride completion
                    api.get('/drivers/stats').then(res => setStats(res.data)).catch(console.error);
                }
            });

            socket.on('negotiationFailed', (data) => {
                localStorage.removeItem('activeRideId');
                setActiveRide(null);
                setShowChat(false);
                setIsNegotiating(false);
                setRiderLocation(null);
                toast('Negotiation failed. You can negotiate other rides.', { icon: '🔄' });
                fetchAvailableRides();
            });

            // Listen for rider's live location (only active after confirmation)
            socket.on('riderLocationUpdate', (data) => {
                setRiderLocation(data.location);
            });

            return () => {
                socket.off('newRideRequest');
                socket.off('rideConfirmed');
                socket.off('rideRemovedFromPool');
                socket.off('rideBackInPool');
                socket.off('rideStatusChanged');
                socket.off('negotiationFailed');
                socket.off('riderLocationUpdate');
            };
        }
    }, [socket, user._id, fetchAvailableRides]);

    const handleNegotiate = (ride) => {
        // Guard: one negotiation at a time
        if (isNegotiating && activeRide && activeRide._id !== ride._id) {
            toast.error('Complete or cancel current negotiation first.');
            return;
        }
        setActiveRide(ride);
        localStorage.setItem('activeRideId', ride._id);

        if (['requested', 'negotiating', 'pending'].includes(ride.status)) {
            setShowChat(true);
            setIsNegotiating(true);
        } else {
            setShowChat(false);
        }
    };

    const handleRideUpdate = (updatedRide) => {
        setActiveRide(updatedRide);
        localStorage.setItem('activeRideId', updatedRide._id);
        if (updatedRide.status === 'confirmed') {
            setAvailableRides(prev => prev.filter(r => r._id !== updatedRide._id));
            setShowChat(false);
            setIsNegotiating(false);
        }
    };

    const handleStartNegotiation = () => {
        setShowChat(true);
        setIsNegotiating(true);
    };

    const handleFailNegotiation = async () => {
        if (!activeRide) return;
        try {
            await api.put(`/rides/${activeRide._id}/fail-negotiation`);
            localStorage.removeItem('activeRideId');
            setActiveRide(null);
            setShowChat(false);
            setIsNegotiating(false);
            toast.success('Negotiation cancelled. Ride returned to pool.');
            fetchAvailableRides();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel negotiation');
        }
    };

    const handleStartRide = async (otp) => {
        if (!otp) return toast.error('Please enter OTP');
        try {
            const res = await api.put(`/rides/${activeRide._id}/start`, { otp });
            setActiveRide(res.data);
            toast.success('Ride started! Drive safely.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        }
    };

    const handleCompleteRide = async () => {
        try {
            const res = await api.put(`/rides/${activeRide._id}/complete`);
            setActiveRide(res.data.ride);
            toast.success('Ride completed! Waiting for payment.');
        } catch (err) {
            toast.error('Failed to complete ride');
        }
    };

    const handleConfirmCash = async () => {
        try {
            localStorage.removeItem('activeRideId');
            setActiveRide(null);
            setShowChat(false);
            setIsNegotiating(false);
            setRiderLocation(null);
            toast.success('Cash payment confirmed! Earnings updated.');
            fetchAvailableRides();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to confirm cash');
        }
    };

    // Live location sharing — only when ride is confirmed or ongoing
    useEffect(() => {
        if (!socket || !activeRide) return;
        const isLive = activeRide.status === 'confirmed' || activeRide.status === 'ongoing';
        if (!isLive) return;

        // Join ride room so we receive rider location updates
        socket.emit('joinRide', { rideId: activeRide._id });

        // Watch our own position and emit to rider
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setDriverLocation(loc);
                    socket.emit('updateDriverLocation', {
                        rideId: activeRide._id,
                        driverId: user._id,
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your rides and negotiations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isNegotiating && (
                            <span className="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full font-semibold animate-pulse">
                                ⚡ Negotiating
                            </span>
                        )}
                    </div>
                </div>

                {/* Driver Stats Overview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FiDollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total Earnings</p>
                            <p className="font-bold text-gray-900 text-lg">₹{stats?.totalEarnings || 0}</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                            <FiTruck size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Completed Rides</p>
                            <p className="font-bold text-gray-900 text-lg">{stats?.totalRides || 0}</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                            <FiStar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Current Rating</p>
                            <p className="font-bold text-gray-900 text-lg">{stats?.rating?.toFixed(1) || '—'}</p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Available Rides */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <FiNavigation className="text-teal-600" size={14} /> Available Rides
                            {driverLocation && (
                                <span className="text-xs font-normal text-gray-400">(within 10km)</span>
                            )}
                        </h2>

                        {availableRides.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                                <FiNavigation className="text-gray-300 mx-auto mb-2" size={28} />
                                <p className="text-sm text-gray-400">No rides available right now</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {availableRides.map(ride => (
                                    <motion.div
                                        key={ride._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${activeRide?._id === ride._id ? 'border-teal-400 shadow-md ring-2 ring-teal-100' : 'border-gray-200 hover:border-teal-200'}`}
                                        onClick={() => handleNegotiate(ride)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-sm font-semibold text-gray-900">{ride.riderId?.name || 'Rider'}</span>
                                            <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-bold">
                                                ₹{ride.proposedFare || ride.fare?.proposed || ride.fare || 0}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-xs text-gray-500 mb-3">
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="text-teal-600 flex-shrink-0" size={12} />
                                                <span className="truncate">{ride.pickupLocation?.address || 'Pickup'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="text-red-500 flex-shrink-0" size={12} />
                                                <span className="truncate">{ride.dropLocation?.address || 'Drop'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleNegotiate(ride); }}
                                            disabled={isNegotiating && activeRide?._id !== ride._id}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${isNegotiating && activeRide?._id !== ride._id
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            <FiMessageCircle size={12} /> Negotiate
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Right: Active Negotiation */}
                    <div className="lg:col-span-2">
                        {activeRide ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    {activeRide.status === 'confirmed' ? 'Current Ride' : activeRide.status === 'ongoing' ? 'Ride in Progress' : 'Negotiating'}
                                                </h3>
                                                {(activeRide.status === 'negotiating' || activeRide.status === 'pending') && (
                                                    <button
                                                        onClick={handleFailNegotiation}
                                                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
                                                    >
                                                        <FiXCircle size={14} /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-xs text-gray-400">Pickup</span>
                                                    <p className="font-medium text-gray-800 mt-0.5">{activeRide.pickupLocation?.address}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400">Drop</span>
                                                    <p className="font-medium text-gray-800 mt-0.5">{activeRide.dropLocation?.address}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-xs text-gray-400">Status</span>
                                                    <p className="font-bold text-teal-600 mt-0.5 uppercase text-xs">{activeRide.status?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {activeRide.status === 'confirmed' && (
                                                <div className="pt-4 border-t border-gray-100 mt-2">
                                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Start Ride</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="OTP"
                                                            maxLength={4}
                                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                            id="ride-otp-input"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const otp = document.getElementById('ride-otp-input').value;
                                                                handleStartRide(otp);
                                                            }}
                                                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
                                                        >
                                                            Verify
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {activeRide.status === 'ongoing' && (
                                                <div className="pt-4 border-t border-gray-100 mt-2">
                                                    <button
                                                        onClick={handleCompleteRide}
                                                        className="w-full bg-teal-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2"
                                                    >
                                                        <FiCheckCircle /> Complete Ride
                                                    </button>
                                                </div>
                                            )}

                                            {activeRide.status === 'completed' && activeRide.paymentStatus !== 'Paid' && (
                                                <div className="pt-4 border-t border-gray-100 mt-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                    <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wider text-center">Payment Pending</p>
                                                    <button
                                                        onClick={handleConfirmCash}
                                                        className="w-full bg-amber-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-2 mb-2"
                                                    >
                                                        <Banknote className="w-5 h-5" /> Confirm Cash
                                                    </button>
                                                    <p className="text-[10px] text-amber-600 text-center italic">Confirm after receiving ₹{activeRide.negotiatedFare || activeRide.fare?.final}</p>
                                                </div>
                                            )}

                                            {/* Start Negotiation button (only shown if chat isn't auto-opened somehow) */}
                                            {(activeRide.status === 'requested' || activeRide.status === 'negotiating' || activeRide.status === 'pending') && !showChat && (
                                                <div className="pt-4 border-t border-gray-100 mt-2">
                                                    <button
                                                        onClick={handleStartNegotiation}
                                                        className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FiMessageCircle size={16} /> Open Chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Location Panel — visible for all active ride states */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-64 xl:h-auto min-h-[250px] relative">
                                        <MapView
                                            pickupCoordinates={activeRide.pickupLocation?.coordinates?.coordinates ? {
                                                lat: activeRide.pickupLocation.coordinates.coordinates[1],
                                                lng: activeRide.pickupLocation.coordinates.coordinates[0]
                                            } : null}
                                            dropCoordinates={activeRide.dropLocation?.coordinates?.coordinates ? {
                                                lat: activeRide.dropLocation.coordinates.coordinates[1],
                                                lng: activeRide.dropLocation.coordinates.coordinates[0]
                                            } : null}
                                            driverCoordinates={driverLocation}
                                            riderCoordinates={riderLocation}
                                        />

                                        {/* Live Overlay */}
                                        {(activeRide.status === 'confirmed' || activeRide.status === 'ongoing') && (
                                            <div className="absolute top-4 left-4 z-[1000]">
                                                <div className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10 text-white">
                                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                                        Trip Active
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Live Chat — shown for pending/negotiating rides */}
                                {showChat && (activeRide.status === 'requested' || activeRide.status === 'negotiating' || activeRide.status === 'pending') && (
                                    <div className="flex-1 min-h-[400px]">
                                        <NegotiationChat ride={activeRide} onRideUpdate={handleRideUpdate} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[80vh] min-h-[500px] relative flex flex-col">
                                {driverLocation ? (
                                    <MapView driverCoordinates={driverLocation} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 bg-gray-50 h-full">
                                        <FiMapPin className="mb-3 opacity-30" size={36} />
                                        <p className="text-sm font-medium">Acquiring live location...</p>
                                    </div>
                                )}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-gray-200 flex items-center gap-3 w-max max-w-[90%]">
                                    <FiNavigation className="text-teal-600 animate-pulse" size={18} />
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">You are online</p>
                                        <p className="text-xs text-gray-500">Pick a ride from the available rides list</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
