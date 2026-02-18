import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiHome, FiMapPin, FiInfo, FiShield, FiHelpCircle,
    FiGrid, FiList, FiDollarSign, FiToggleLeft, FiToggleRight, FiUsers, FiTruck, FiBarChart2
} from 'react-icons/fi';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const publicLinks = [
        { path: '/', label: 'Home', icon: <FiHome /> },
        { path: '/rider/home', label: 'Book Ride', icon: <FiMapPin /> },
        { path: '/driver/register', label: 'Drive', icon: <FiTruck /> },
        { path: '/#safety', label: 'Safety', icon: <FiShield /> },
        { path: '/#faq', label: 'FAQ', icon: <FiHelpCircle /> },
    ];

    const getRoleLinks = () => {
        if (!user) return [];
        switch (user.role) {
            case 'rider':
                return [
                    { path: '/rider/home', label: 'Book Ride', icon: <FiMapPin /> },
                    { path: '/rider/history', label: 'My Rides', icon: <FiList /> },
                    { path: '/rider/tracking', label: 'Tracking', icon: <FiGrid /> },
                    { path: '/driver/register', label: 'Drive', icon: <FiTruck /> },
                    { path: '/rider/profile', label: 'Profile', icon: <FiUser /> },
                ];
            case 'driver':
                return [
                    { path: '/driver/dashboard', label: 'Dashboard', icon: <FiGrid /> },
                    { path: '/driver/requests', label: 'Requests', icon: <FiList /> },
                    { path: '/driver/earnings', label: 'Earnings', icon: <FiDollarSign /> },
                    { path: '/driver/profile', label: 'Profile', icon: <FiUser /> },
                ];
            case 'admin':
                return [
                    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiBarChart2 /> },
                    { path: '/admin/users', label: 'Drivers', icon: <FiUsers /> },
                    { path: '/admin/rides', label: 'Rides', icon: <FiTruck /> },
                    { path: '/admin/profile', label: 'Profile', icon: <FiUser /> },
                ];
            default:
                return [];
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white ${scrolled ? 'shadow-md border-b border-gray-100' : ''
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                S
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-gray-900 leading-tight">Safro</span>
                                <span className="text-[9px] text-gray-400 font-medium tracking-wider uppercase leading-none hidden sm:block">
                                    Ride the Price You Decide
                                </span>
                            </div>
                        </Link>

                        {/* Center Links (Desktop) */}
                        <div className="hidden lg:flex items-center gap-1">
                            {(user ? getRoleLinks() : publicLinks).map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${isActive(link.path)
                                        ? 'text-teal-700 bg-teal-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side */}
                        <div className="hidden lg:flex items-center gap-3">
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-bold">
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
                                        <FiChevronDown className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {profileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50"
                                            >
                                                <div className="px-4 py-2 border-b border-gray-100">
                                                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                                                </div>
                                                <Link to={`/${user.role}/profile`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                                                    <FiUser size={14} /> Profile
                                                </Link>
                                                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                                                    <FiLogOut size={14} /> Logout
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                        Login
                                    </Link>
                                    <Link to="/register" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-16 z-40 bg-white border-b border-gray-200 shadow-lg lg:hidden"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {(user ? getRoleLinks() : publicLinks).map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(link.path)
                                        ? 'text-teal-700 bg-teal-50'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}

                            <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
                                {user ? (
                                    <>
                                        <Link to={`/${user.role}/profile`} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                                            <FiUser /> Profile
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                                            <FiLogOut /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                                            Login
                                        </Link>
                                        <Link to="/register" className="block mx-4 py-3 bg-gray-900 text-white text-center text-sm font-semibold rounded-lg">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spacer for fixed nav */}
            <div className="h-16" />
        </>
    );
};

export default Navbar;
