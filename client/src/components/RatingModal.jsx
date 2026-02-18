import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

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
            await api.post('/api/reviews', {
                rideId: ride._id,
                rating,
                comment
            });
            setStatus('success');
            if (onSubmitted) onSubmitted();
            setTimeout(() => {
                onClose();
            }, 2000);
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
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {status === 'rating' ? (
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">How was your ride?</h2>
                                <p className="text-sm text-gray-500 mt-1">Rate your experience with the driver</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <FiX className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 focus:outline-none transition-transform active:scale-90"
                                >
                                    <FiStar
                                        size={36}
                                        className={`${(hover || rating) >= star
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-200'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Comment (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us more about your trip..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none h-24"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || submitting}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <FiCheckCircle size={40} />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                        <p className="text-gray-500">Your feedback helps us maintain a high standard of service.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RatingModal;
