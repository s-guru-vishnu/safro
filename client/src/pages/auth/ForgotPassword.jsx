import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../services/api';

const ForgotPassword = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(emailOrPhone);
            toast.success('OTP sent successfully!');
            navigate(`/verify-otp?id=${encodeURIComponent(emailOrPhone)}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
                    <p className="text-sm text-gray-500">Enter your email or phone to receive an OTP</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone</label>
                        <div className="relative">
                            <FiMail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="name@gmail.com or Phone"
                                value={emailOrPhone}
                                onChange={(e) => setEmailOrPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                        {!loading && <FiArrowRight size={14} />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-2">
                        <FiArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
