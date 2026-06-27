import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiStar, 
    FiX, 
    FiCheckCircle, 
    FiMessageSquare, 
    FiHeart,
    FiThumbsUp,
    FiArrowRight
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import AnimatedButton from './AnimatedButton';

const RatingModal = ({ ride, isOpen, onClose, onSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState('rating'); // 'rating', 'submitting', 'success'

    const handleSubmit = async () => {
        if (rating === 0) return toast.error('Please select a rating');

        setSubmitting(true);
        try {
            await api.post(`/rides/${ride._id}/rate`, {
                rating,
                review: comment
            });
            setStatus('success');
            if (onSubmitted) onSubmitted();
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="h-2 bg-[#148e85] w-full" />
                    
                    {status === 'rating' ? (
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center mb-8">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Rate your Ride</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-1 font-medium">
                                    <FiHeart className="w-3 h-3 text-red-500" />
                                    Your feedback matters most
                                </p>
                            </div>

                            <div className="flex justify-center gap-3 mb-10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform active:scale-95"
                                    >
                                        <motion.div
                                            animate={{ 
                                                scale: (hover || rating) >= star ? 1.2 : 1,
                                                color: (hover || rating) >= star ? '#fbbf24' : '#e5e7eb'
                                            }}
                                        >
                                            <FiStar
                                                size={42}
                                                className={`${(hover || rating) >= star ? 'fill-amber-400' : 'fill-gray-100'} transition-all duration-300`}
                                            />
                                        </motion.div>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3 mb-8">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                    <FiMessageSquare className="w-3 h-3" /> Add a Comment
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="How was your experience with the driver?"
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#148e85] focus:border-transparent outline-none transition-all resize-none h-28"
                                />
                            </div>

                            <AnimatedButton
                                onClick={handleSubmit}
                                disabled={rating === 0 || submitting}
                                className={`w-full py-5 rounded-2xl font-black text-lg tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                                    rating === 0 || submitting ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-[#148e85] hover:opacity-90 text-white shadow-[#148e85]/20'
                                }`}
                            >
                                {submitting ? (
                                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Submit Feedback</span>
                                        <FiArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </AnimatedButton>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                                className="w-24 h-24 bg-[#148e85]/5 text-[#148e85] rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-[#148e85] shadow-lg shadow-[#148e85]/10"
                            >
                                <FiThumbsUp size={48} />
                            </motion.div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Thank You!</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[240px] mx-auto font-medium">
                                Your feedback helps us maintain a high standard of service for everyone.
                            </p>
                            
                            <div className="mt-10 flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#148e85] animate-pulse" />
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Returning you to safety...</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default RatingModal;
