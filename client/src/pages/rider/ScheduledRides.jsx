import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiEdit3, FiTrash2, FiNavigation, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScheduleRideModal from '../../components/ScheduleRideModal';

const ScheduledRides = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rescheduleRide, setRescheduleRide] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const fetchRides = async () => {
        try {
            const res = await api.get('/rides/scheduled');
            setRides(res.data.rides || []);
        } catch (err) {
            toast.error('Failed to load scheduled rides');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRides();
    }, []);

    const handleCancel = async (id) => {
        setCancellingId(id);
        try {
            await api.put(`/rides/${id}/cancel`, { reason: 'Cancelled by rider' });
            setRides(prev => prev.filter(r => r._id !== id));
            toast.success('Scheduled ride cancelled');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel');
        } finally {
            setCancellingId(null);
        }
    };

    const handleReschedule = async (id, newTime) => {
        try {
            const res = await api.put(`/rides/${id}/reschedule`, { scheduledTime: newTime });
            setRides(prev => prev.map(r => r._id === id ? res.data.ride : r));
            setRescheduleRide(null);
            toast.success('Ride rescheduled successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reschedule');
        }
    };

    if (loading) return <LoadingSpinner size="lg" text="Loading scheduled rides..." />;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiCalendar className="text-amber-500" /> Scheduled Rides
                    </h1>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                        {rides.length} ride{rides.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {rides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center"
                    >
                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiCalendar size={28} className="text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Scheduled Rides</h3>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {rides.map((ride, i) => (
                                <ScheduledRideCard
                                    key={ride._id}
                                    ride={ride}
                                    index={i}
                                    onCancel={handleCancel}
                                    onReschedule={() => setRescheduleRide(ride)}
                                    isCancelling={cancellingId === ride._id}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            <ScheduleRideModal
                isOpen={!!rescheduleRide}
                onClose={() => setRescheduleRide(null)}
                onSubmit={(newTime) => handleReschedule(rescheduleRide._id, newTime)}
                currentTime={rescheduleRide?.scheduledTime}
            />
        </div>
    );
};

const ScheduledRideCard = ({ ride, index, onCancel, onReschedule, isCancelling }) => {
    const scheduledDate = new Date(ride.scheduledTime);
    const now = new Date();
    const diff = scheduledDate - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isImminent = diff < 30 * 60 * 1000 && diff > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-all ${
                isImminent
                    ? 'border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-none shadow-lg'
                    : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            {/* Top Bar */}
            <div className={`px-5 py-3 flex items-center justify-between ${
                isImminent
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                    : 'bg-gray-50 dark:bg-gray-950'
            }`}>
                <div className="flex items-center gap-2">
                    <FiCalendar size={14} className={isImminent ? 'text-amber-600' : 'text-gray-400 dark:text-gray-500'} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        at {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Countdown */}
                {diff > 0 ? (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isImminent
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse'
                            : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                    }`}>
                        <FiClock size={10} className="inline mr-1" />
                        {hoursLeft > 0 && `${hoursLeft}h `}{minsLeft}m left
                    </span>
                ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <FiAlertCircle size={10} className="inline mr-1" /> Activating...
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5 pt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                        <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Pickup</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ride.pickupLocation?.address || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Drop</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ride.dropLocation?.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-900 dark:text-white">₹{ride.fare?.proposed || '-'}</span>
                        {ride.distance && (
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {ride.distance}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onReschedule}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                            title="Reschedule"
                        >
                            <FiEdit3 size={16} />
                        </button>
                        <button
                            onClick={() => onCancel(ride._id)}
                            disabled={isCancelling}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel"
                        >
                            {isCancelling ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiTrash2 size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ScheduledRides;
