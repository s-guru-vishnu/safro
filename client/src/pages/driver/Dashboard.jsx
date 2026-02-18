import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NegotiationChat from '../../components/NegotiationChat';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiNavigation, FiMessageCircle } from 'react-icons/fi';

const DriverDashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [availableRides, setAvailableRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);

    useEffect(() => {
        fetchAvailableRides();

        if (socket) {
            socket.emit('joinRoom', { userId: user._id, role: 'driver' });
            // ... (rest of useEffect logic remains)

            socket.on('newRideRequest', (ride) => {
                toast.success('New Ride Request!');
                setAvailableRides(prev => [ride, ...prev]);
            });

            socket.on('rideConfirmed', (ride) => {
                if (ride.driverId === user._id) {
                    setActiveRide(ride);
                    toast.success('Ride Confirmed! Proceed to pickup.');
                } else {
                    setAvailableRides(prev => prev.filter(r => r._id !== ride._id));
                }
            });

            return () => {
                socket.off('newRideRequest');
                socket.off('rideConfirmed');
            };
        }
    }, [socket, user._id]);

    const fetchAvailableRides = async () => {
        try {
            const res = await api.get('/rides/available');
            setAvailableRides(res.data);
        } catch (err) {
            console.error('Error fetching rides:', err);
        }
    };


    const handleNegotiate = (ride) => setActiveRide(ride);

    const handleRideUpdate = (updatedRide) => {
        setActiveRide(updatedRide);
        if (updatedRide.status === 'confirmed') {
            setAvailableRides(prev => prev.filter(r => r._id !== updatedRide._id));
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
            setActiveRide(null);
            toast.success('Ride completed! Earnings updated.');
        } catch (err) {
            toast.error('Failed to complete ride');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your rides and negotiations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Stats removed from dashboard only */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Available Rides */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <FiNavigation className="text-teal-600" size={14} /> Available Rides
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
                                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-teal-200 transition-all"
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
                                            onClick={() => handleNegotiate(ride)}
                                            className="w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5"
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
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">
                                        {activeRide.status === 'confirmed' ? 'Current Ride' : 'Negotiating'}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-gray-400">Pickup</span>
                                            <p className="font-medium text-gray-800 mt-0.5">{activeRide.pickupLocation?.address}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400">Drop</span>
                                            <p className="font-medium text-gray-800 mt-0.5">{activeRide.dropLocation?.address}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400">Status</span>
                                            <p className="font-bold text-teal-600 mt-0.5 uppercase text-xs">{activeRide.status?.replace('_', ' ')}</p>
                                        </div>
                                        {activeRide.otp && (
                                            <div>
                                                <span className="text-xs text-gray-400">OTP</span>
                                                <p className="font-mono font-bold text-lg text-gray-900 mt-0.5">{activeRide.otp}</p>
                                            </div>
                                        )}
                                        {activeRide.status === 'confirmed' && (
                                            <div className="col-span-2 pt-4 border-t border-gray-100 mt-2">
                                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Start Ride</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter OTP"
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
                                                        Verify & Start
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeRide.status === 'ongoing' && (
                                            <div className="col-span-2 pt-4 border-t border-gray-100 mt-2">
                                                <button
                                                    onClick={handleCompleteRide}
                                                    className="w-full bg-teal-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2"
                                                >
                                                    <FiCheckCircle /> Complete Ride
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(activeRide.status === 'requested' || activeRide.status === 'negotiating') && (
                                    <NegotiationChat ride={activeRide} onRideUpdate={handleRideUpdate} />
                                )}
                            </div>
                        ) : (
                            <div className="bg-white h-80 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                <FiMessageCircle className="mb-3 opacity-30" size={36} />
                                <p className="text-sm font-medium">Select a ride to start negotiating</p>
                                <p className="text-xs text-gray-300 mt-1">Pick from available rides on the left</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FiCheckCircle = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default DriverDashboard;
