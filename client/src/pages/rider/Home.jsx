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

const RiderHome = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeRide, setActiveRide] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('rideConfirmed', (ride) => {
                setActiveRide(ride);
                toast.success('Ride Confirmed! Driver is on the way.');
            });

            socket.on('rideStatusChanged', (data) => {
                setActiveRide(prev => ({ ...prev, status: data.status }));
                if (data.status === 'completed') {
                    toast.success('You have reached your destination!');
                    setShowRatingModal(true);
                }
            });

            return () => {
                socket.off('rideConfirmed');
                socket.off('rideStatusChanged');
            };
        }
    }, [socket]);

    const handleRideCreated = (ride) => setActiveRide(ride);
    const handleRideUpdate = (ride) => setActiveRide(ride);

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
                        {/* Map Placeholder */}
                        <div className="bg-white h-80 rounded-xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" />
                            <div className="relative z-10 text-center">
                                <FiMapPin className="text-gray-300 mx-auto mb-2" size={32} />
                                <span className="text-sm text-gray-400 font-medium">Map View</span>
                                <span className="block text-xs text-gray-300 mt-1">Integration pending</span>
                            </div>
                        </div>

                        {/* Negotiation Panel */}
                        {activeRide && (activeRide.status === 'negotiating' || activeRide.status === 'requested') && (
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
