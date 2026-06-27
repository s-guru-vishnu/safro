import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { verifyOtpForReset, forgotPassword } from '../../services/api';

const VerifyOTP = () => {
    const [searchParams] = useSearchParams();
    const emailOrPhone = searchParams.get('id') || '';
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [cooldown, setCooldown] = useState(60);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (!emailOrPhone) {
            navigate('/forgot-password');
            return;
        }

        const timer = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [emailOrPhone, navigate]);

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;

        setResending(true);
        try {
            const response = await forgotPassword(emailOrPhone);
            const devOtp = response.data?.otp;
            toast.success(`OTP sent successfully!`);
            setCooldown(60);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

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
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <motion.div
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Verify OTP</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter the 6-digit code sent to {emailOrPhone}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Enter OTP</label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm tracking-widest transition-all outline-none text-center"
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

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={cooldown > 0 || resending}
                            className={`font-medium transition-colors ${cooldown > 0 || resending
                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:text-teal-400'
                                }`}
                        >
                            {resending ? 'Sending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyOTP;
