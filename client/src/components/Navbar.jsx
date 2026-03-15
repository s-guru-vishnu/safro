import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiHome, FiMapPin, FiInfo, FiShield, FiHelpCircle,
    FiGrid, FiList, FiDollarSign, FiToggleLeft, FiToggleRight, FiUsers, FiTruck, FiBarChart2, FiCreditCard,
    FiBell, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [hasActiveRide, setHasActiveRide] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { socket } = useSocket();
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    useEffect(() => {
        if (user?.role === 'rider') {
            api.get('/rides/active').then(res => {
                const ride = res.data.ride;
                if (ride && ['confirmed', 'accepted', 'driver_arrived', 'otp_verified', 'on_trip'].includes(ride.status)) {
                    setHasActiveRide(true);
                } else {
                    setHasActiveRide(false);
                }
            }).catch(() => setHasActiveRide(false));
        }
    }, [location.pathname, user]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
    }, [location.pathname]);

    // Socket Notifications Listener
    useEffect(() => {
        if (!socket || !user) return;

        const addNotification = (notif) => {
            notificationSound.play().catch(e => console.log('Sound play blocked by browser policy'));
            setNotifications(prev => [{
                id: Date.now(),
                read: false,
                timestamp: new Date(),
                ...notif
            }, ...prev].slice(0, 20)); // Keep last 20
        };

        // Listen for SOS (Admins)
        if (user.role === 'admin') {
            socket.on('sosAlert', (data) => {
                addNotification({
                    type: 'sos',
                    title: '🚨 EMERGENCY SOS',
                    message: `${data.userName} triggered an alert!`,
                    icon: <FiAlertCircle className="text-red-500" />,
                    link: '/admin/alerts'
                });
            });
        }

        // Listen for New Ride Requests (Drivers)
        if (user.role === 'driver') {
            socket.on('newRideRequest', (ride) => {
                addNotification({
                    type: 'request',
                    title: '🚕 New Ride Request',
                    message: `From: ${ride.pickupLocation?.address?.substring(0, 25)}...`,
                    icon: <FiTruck className="text-teal-500" />,
                    link: '/driver/dashboard'
                });
            });
        }

        // Listen for Status Changes (All)
        socket.on('rideAccepted', (data) => {
            addNotification({
                type: 'status',
                title: '📈 Ride Accepted',
                message: 'A driver has accepted the ride!',
                icon: <FiCheckCircle className="text-emerald-500" />,
                link: user.role === 'rider' ? '/rider/tracking' : '/driver/dashboard'
            });
        });

        socket.on('rideStarted', (data) => {
            addNotification({
                type: 'status',
                title: '🚗 Ride Started',
                message: 'The trip has officially begun.',
                icon: <FiTruck className="text-blue-500" />,
                link: user.role === 'rider' ? '/rider/tracking' : '/driver/dashboard'
            });
        });

        socket.on('rideCompleted', (data) => {
            addNotification({
                type: 'status',
                title: '✨ Ride Completed',
                message: 'You have reached your destination.',
                icon: <FiCheckCircle className="text-teal-500" />,
                link: user.role === 'rider' ? '/rider/history' : '/driver/earnings'
            });
        });

        socket.on('rideCancelled', (data) => {
            addNotification({
                type: 'status',
                title: '❌ Ride Cancelled',
                message: 'The ride has been cancelled.',
                icon: <FiAlertCircle className="text-red-500" />,
                link: user.role === 'rider' ? '/rider/home' : '/driver/dashboard'
            });
        });

        return () => {
            socket.off('sosAlert');
            socket.off('newRideRequest');
            socket.off('rideAccepted');
            socket.off('rideStarted');
            socket.off('rideCompleted');
            socket.off('rideCancelled');
        };
    }, [socket, user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = (e) => {
        e.stopPropagation();
        setNotifications([]);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const publicLinks = [
        { path: '/', label: 'Home', icon: <FiHome /> },
        { path: '/rider/home', label: 'Book Ride', icon: <FiMapPin /> },
        { path: '/driver/register', label: 'Drive', icon: <FiTruck /> },
    ];

    const getRoleLinks = () => {
        if (!user) return [];
        switch (user.role) {
            case 'rider':
                const hasActiveApplication = user.driverApplicationStatus &&
                    ['pending', 'under_review', 'meeting_scheduled'].includes(user.driverApplicationStatus);

                const links = [
                    { path: '/rider/home', label: 'Book Ride', icon: <FiMapPin /> },
                    { path: '/rider/history', label: 'My Rides', icon: <FiList /> },
                    { path: '/rider/tracking', label: 'Tracking', icon: <FiGrid /> },
                    {
                        path: hasActiveApplication ? '/driver/submitted' : '/driver/register',
                        label: hasActiveApplication ? 'Drive Status' : 'Drive',
                        icon: <FiTruck />
                    },
                    { path: '/rider/wallet', label: 'Wallet', icon: <FiCreditCard /> },
                ];

                return hasActiveRide ? links.filter(link => link.path !== '/rider/home') : links;
            case 'driver':
                return [
                    { path: '/driver/dashboard', label: 'Dashboard', icon: <FiGrid /> },
                    { path: '/driver/requests', label: 'Requests', icon: <FiList /> },
                    { path: '/driver/earnings', label: 'Earnings', icon: <FiDollarSign /> },
                ];
            case 'admin':
                return [
                    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiBarChart2 /> },
                    { path: '/admin/users', label: 'Drivers', icon: <FiUsers /> },
                    { path: '/admin/rides', label: 'Rides', icon: <FiTruck /> },
                ];
            default:
                return [];
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className={`fixed top-0 w-full z-[1001] transition-all duration-300 bg-white ${scrolled ? 'shadow-md border-b border-gray-100' : ''
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <img src="/Logo.png" alt="Safro" className="w-9 h-9 object-contain" />
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
                            {user && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setNotificationsOpen(!notificationsOpen);
                                            setProfileOpen(false);
                                            if (!notificationsOpen) markAllRead();
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all relative"
                                    >
                                        <FiBell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {notificationsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                            >
                                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                                    <button onClick={clearNotifications} className="text-[10px] text-gray-400 hover:text-red-500 font-medium">Clear all</button>
                                                </div>
                                                <div className="max-h-[350px] overflow-y-auto">
                                                    {notifications.length === 0 ? (
                                                        <div className="py-12 text-center">
                                                            <FiBell className="mx-auto text-gray-200 mb-2" size={32} />
                                                            <p className="text-xs text-gray-400">No new alerts</p>
                                                        </div>
                                                    ) : (
                                                        notifications.map((notif) => (
                                                            <Link
                                                                key={notif.id}
                                                                to={notif.link}
                                                                onClick={() => setNotificationsOpen(false)}
                                                                className="flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    {notif.icon}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 leading-tight mb-0.5">{notif.title}</p>
                                                                    <p className="text-[11px] text-gray-500 leading-snug truncate">{notif.message}</p>
                                                                    <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium">
                                                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

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
                                                <div className="h-px bg-gray-100 my-1 mx-2" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors"
                                                >
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
                                    <Link to="/register" className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-sm">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Right Side */}
                        <div className="flex lg:hidden items-center gap-2">
                            {user && (
                                <button
                                    onClick={() => {
                                        setNotificationsOpen(!notificationsOpen);
                                        setMenuOpen(false);
                                        if (!notificationsOpen) markAllRead();
                                    }}
                                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all relative"
                                >
                                    <FiBell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Mobile Toggle */}
                            <button
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => {
                                    setMenuOpen(!menuOpen);
                                    setNotificationsOpen(false);
                                }}
                            >
                                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Notifications Dropdown (Shared logic but separate trigger) */}
            <AnimatePresence>
                {notificationsOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-16 z-[1000] bg-white border-b border-gray-200 shadow-lg lg:hidden"
                    >
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                            <button onClick={clearNotifications} className="text-[10px] text-gray-400 hover:text-red-500 font-medium">Clear all</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto px-2">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <FiBell className="mx-auto text-gray-200 mb-2" size={32} />
                                    <p className="text-xs text-gray-400">No new alerts</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <Link
                                        key={notif.id}
                                        to={notif.link}
                                        onClick={() => setNotificationsOpen(false)}
                                        className="flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {notif.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 leading-tight mb-0.5">{notif.title}</p>
                                            <p className="text-[11px] text-gray-500 leading-snug truncate">{notif.message}</p>
                                            <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium">
                                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-16 z-[1000] bg-white border-b border-gray-200 shadow-lg lg:hidden"
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
                                        <Link to="/register" className="block mx-4 py-3 bg-teal-600 text-white text-center text-sm font-semibold rounded-lg">
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
