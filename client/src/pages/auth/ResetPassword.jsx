import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const emailOrPhone = searchParams.get('id') || '';
    const otp = searchParams.get('otp') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!emailOrPhone || !otp) {
            navigate('/forgot-password');
        }
    }, [emailOrPhone, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
        }

        setLoading(true);
        try {
            await resetPassword(emailOrPhone, otp, newPassword);
            toast.success('Password reset successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
                    <p className="text-sm text-gray-500">Create a new strong password for your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="Min 8 characters, A-z, 0-9, @"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                        {!loading && <FiArrowRight size={14} />}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
