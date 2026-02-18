import { useState, useEffect } from 'react';
import { FiMapPin, FiCheck, FiX, FiBell } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('newRideRequest', (data) => {
                setRequests(prev => [data, ...prev]);
            });
            return () => socket.off('newRideRequest');
        }
    }, [socket]);

    const handleAccept = async (rideId) => {
        try {
            await api.put(`/rides/accept/${rideId}`);
            setRequests(prev => prev.filter(r => r.rideId !== rideId));
        } catch (err) {
            console.error('Accept error:', err);
        }
    };

    const handleReject = (rideId) => {
        setRequests(prev => prev.filter(r => r.rideId !== rideId));
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Ride Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">{requests.length} pending requests</p>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <FiBell className="text-gray-300 mx-auto mb-3" size={32} />
                        <h3 className="text-sm font-bold text-gray-600 mb-1">No Pending Requests</h3>
                        <p className="text-xs text-gray-400">New ride requests will appear here in real-time</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {requests.map((req, index) => (
                                <motion.div
                                    key={req.rideId || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="bg-teal-50 text-teal-700 text-sm px-3 py-1 rounded-full font-bold">
                                            ₹{req.fare || req.proposedFare || 0}
                                        </span>
                                        <span className="text-xs text-gray-400">{req.distance} km • {req.vehicleType}</span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0" />
                                            <span className="truncate">{req.pickupLocation?.address || 'Pickup Location'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
                                            <span className="truncate">{req.dropLocation?.address || 'Drop Location'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAccept(req.rideId)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-all"
                                        >
                                            <FiCheck size={14} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.rideId)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-white text-gray-600 border border-gray-200 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all"
                                        >
                                            <FiX size={14} /> Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Requests;
