import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { verifyOtpForReset } from '../../services/api';

const VerifyOTP = () => {
    const [searchParams] = useSearchParams();
    const emailOrPhone = searchParams.get('id') || '';
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!emailOrPhone) {
            navigate('/forgot-password');
        }
    }, [emailOrPhone, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOtpForReset(emailOrPhone, otp);
            toast.success('OTP verified!');
            navigate(`/reset-password?id=${encodeURIComponent(emailOrPhone)}&otp=${encodeURIComponent(otp)}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
            <motion.div
                className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Verify OTP</h2>
                    <p className="text-sm text-gray-500">Enter the 6-digit code sent to {emailOrPhone}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                maxLength="4"
                                placeholder="4-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-400 text-sm tracking-widest transition-all outline-none text-center"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                        {!loading && <FiArrowRight size={14} />}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default VerifyOTP;
