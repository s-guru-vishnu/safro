import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            const routes = { rider: '/rider/home', driver: '/driver/dashboard', admin: '/admin/dashboard' };
            navigate(routes[user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
                    <img src="/Logo.png" alt="Safro" className="w-12 h-12 object-contain mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-sm text-gray-500">Sign in to your Safro account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <div className="relative">
                            <FiMail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        <div className="flex justify-end mt-1">
                            <Link to="/forgot-password" size="sm" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <FiArrowRight size={14} />}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="px-4 text-xs text-gray-400 font-medium">Or</span>
                    <div className="flex-1 border-t border-gray-200" />
                </div>

                <a
                    href="http://localhost:5001/api/auth/google"
                    className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-all hover:shadow-sm text-sm font-medium"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>Sign in with Google</span>
                </a>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
