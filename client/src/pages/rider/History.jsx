import { useState, useEffect } from 'react';
import { FiClock, FiMapPin, FiNavigation, FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import NegotiationChat from '../../components/NegotiationChat';
import api from '../../services/api';

const History = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [chatOpenRideId, setChatOpenRideId] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/rides/history?page=${page}&limit=10`);
            setRides(res.data.rides);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRideUpdate = (updatedRide) => {
        setRides(prev => prev.map(r => r._id === updatedRide._id ? updatedRide : r));
    };

    const isPendingStatus = (status) => {
        return ['pending', 'requested', 'negotiating'].includes(status);
    };

    if (loading) return <LoadingSpinner size="lg" text="Loading rides..." />;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Rides</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total || 0} total rides</p>
                </div>

                {rides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center"
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiClock size={28} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Rides Yet</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Your ride history will appear here once you take your first ride.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {rides.map((ride, i) => (
                                <motion.div
                                    key={ride._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`bg-white dark:bg-gray-900 rounded-xl border p-5 hover:shadow-md transition-all group ${chatOpenRideId === ride._id ? 'border-teal-400 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-teal-200 dark:border-teal-800'}`}
                                >
                                    {/* Top row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <StatusBadge status={ride.status} />
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-2.5 mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-teal-50 dark:bg-teal-900/20 ring-4 ring-teal-100" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Pickup</span>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{ride.pickupLocation?.address || 'Pickup'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-50 dark:bg-red-900/20 ring-4 ring-red-100" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Drop-off</span>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{ride.dropLocation?.address || 'Drop-off'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            ₹{ride.fare?.final || ride.fare?.proposed || ride.fare || '—'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {ride.distance || '—'} • {ride.vehicleType || 'Standard'}
                                            </span>
                                            {isPendingStatus(ride.status) && (
                                                <button
                                                    onClick={() => setChatOpenRideId(chatOpenRideId === ride._id ? null : ride._id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatOpenRideId === ride._id
                                                        ? 'bg-teal-600 text-white'
                                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <FiMessageCircle size={12} />
                                                    {chatOpenRideId === ride._id ? 'Close Chat' : 'Negotiate'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Negotiation Chat */}
                                    {chatOpenRideId === ride._id && isPendingStatus(ride.status) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <NegotiationChat ride={ride} onRideUpdate={handleRideUpdate} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiChevronLeft size={16} />
                                </button>
                                {Array.from({ length: pagination.pages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === i + 1
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
