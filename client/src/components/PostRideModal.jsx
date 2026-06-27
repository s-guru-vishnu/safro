import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiCheckCircle, 
    FiDollarSign, 
    FiArrowRight, 
    FiInfo,
    FiAward,
    FiPieChart,
    FiLoader,
    FiUser
} from 'react-icons/fi';
import { Banknote } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import AnimatedButton from './AnimatedButton';

const PostRideModal = ({ ride, isOpen, onClose, onRefreshStats }) => {
    const [loading, setLoading] = React.useState(false);

    if (!ride || !isOpen) return null;

    const fare = ride.negotiatedFare || ride.fare?.final || ride.fare?.proposed || 0;

    // Determine current state
    const isWaiting = ride.paymentStatus === 'Pending';
    const needsCashConfirmation = ride.paymentStatus === 'Driver Confirmation' && ride.paymentMethod === 'cash';
    const isPaid = ride.paymentStatus === 'Paid';

    const handleConfirmCash = async () => {
        setLoading(true);
        try {
            await api.post('/payment/confirm-cash', { rideId: ride._id });
            toast.success('Cash payment confirmed!');
            if (onRefreshStats) onRefreshStats();
            // The ride will update via socket to 'Paid', and this modal will show the summary
        } catch (err) {
            console.error('Confirm cash failed:', err);
            toast.error(err.response?.data?.message || 'Failed to confirm cash');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        setLoading(true);
        try {
            await api.post('/payment/confirm-payment', { rideId: ride._id });
            onClose();
        } catch (err) {
            console.error('Finalization failed:', err);
            toast.error('Failed to finalize ride.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                    />
                    
                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-sm relative z-10"
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            {/* Header Gradient */}
                            <div className="h-2 bg-[#148e85] w-full" />
                            
                            <div className="p-6">
                                {isWaiting && (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-[#148e85]/5 rounded-full flex items-center justify-center mb-6 relative">
                                            <FiLoader className="text-[#148e85] animate-spin" size={40} />
                                            <div className="absolute inset-0 border-4 border-[#148e85]/20 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Payment Pending</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed max-w-[250px]">
                                            Great ride! Please wait while the rider completes the payment.
                                        </p>
                                        
                                        <div className="mt-8 w-full p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-800">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                                <FiUser className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Estimated Fare</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">₹{fare}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {needsCashConfirmation && (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-[#148e85] text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#148e85]/20">
                                            <Banknote size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Collect Cash</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                                            Rider has selected <span className="font-bold text-gray-900 dark:text-white">Cash Payment</span>. Please confirm once you receive the amount.
                                        </p>

                                        <div className="my-4 w-full p-4 bg-[#148e85]/5 rounded-3xl border border-[#148e85]/10 text-center">
                                            <p className="text-[10px] text-[#148e85] font-bold uppercase tracking-widest mb-1">Receive Exact Amount</p>
                                            <p className="text-3xl font-black text-[#148e85]">₹{fare}</p>
                                        </div>

                                        <AnimatedButton
                                            onClick={handleConfirmCash}
                                            disabled={loading}
                                            className="w-full py-5 rounded-2xl font-black text-lg bg-[#148e85] hover:opacity-90 text-white shadow-xl shadow-[#148e85]/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {loading ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <FiCheckCircle size={20} />
                                                    <span>Confirm Payment</span>
                                                </>
                                            )}
                                        </AnimatedButton>
                                    </div>
                                )}

                                {isPaid && (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-[#148e85]/10 text-[#148e85] rounded-full flex items-center justify-center mb-4 border-2 border-[#148e85] shadow-sm">
                                            <FiCheckCircle size={32} />
                                        </div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Payment Received!</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-medium">The trip has been successfully finalized.</p>

                                        <AnimatedButton
                                            onClick={handleFinalize}
                                            disabled={loading}
                                            className="w-full mt-6 py-4 rounded-xl font-black text-base bg-gray-900 hover:bg-black text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Done</span>
                                                    <FiArrowRight />
                                                </>
                                            )}
                                        </AnimatedButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PostRideModal;
