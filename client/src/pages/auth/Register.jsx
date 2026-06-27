import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Register = () => {
    const [searchParams] = useSearchParams();
    const prefilledPhone = searchParams.get('phone') || '';

    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: prefilledPhone,
        role: 'rider',
        guardianPhone: '', guardianEmail: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (prefilledPhone) {
            toast('Welcome! Please complete your profile.', { icon: '👋' });
        }
    }, [prefilledPhone]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Frontend validation
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!gmailRegex.test(form.email)) {
                throw new Error('Only Gmail addresses are allowed');
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(form.password)) {
                throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
            }

            const user = await register(form);
            toast.success('Registration successful!');
            const routes = { rider: '/rider/home', driver: '/driver/dashboard', admin: '/admin/dashboard' };
            navigate(routes[user.role] || '/');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Registration failed';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ icon: Icon, label, ...props }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                <input
                    {...props}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all outline-none"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
            <motion.div
                className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="text-center mb-8">
                    <img src="/Logo.png" alt="Safro" className="w-12 h-12 object-contain mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Join Safro and start negotiating your rides</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <InputField icon={FiUser} label="Full Name" type="text" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
                        <InputField icon={FiMail} label="Email" type="email" name="email" placeholder="name@example.com" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Min 8 characters, A-z, 0-9, @"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all outline-none"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>
                        <InputField icon={FiPhone} label="Phone" type="tel" name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} required />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <InputField icon={FiPhone} label="Guardian Phone (optional)" type="tel" name="guardianPhone" placeholder="Emergency contact" value={form.guardianPhone} onChange={handleChange} />
                        <InputField icon={FiMail} label="Guardian Email (optional)" type="email" name="guardianEmail" placeholder="Guardian email" value={form.guardianEmail} onChange={handleChange} />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                        {!loading && <FiArrowRight size={14} />}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    <span className="px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Or</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                </div>

                <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/google`}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:shadow-sm text-sm font-medium"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>Sign up with Google</span>
                </a>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:text-teal-400 font-semibold transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
