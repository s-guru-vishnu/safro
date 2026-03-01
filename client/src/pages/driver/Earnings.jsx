import { useState, useEffect } from 'react';
import { FiDollarSign, FiTruck, FiStar, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';
import RatingStars from '../../components/RatingStars';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const statusColors = {
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
    on_trip: 'bg-orange-50 text-orange-600',
    accepted: 'bg-teal-50 text-teal-600',
};

const Earnings = () => {
    const [stats, setStats] = useState(null);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    const { socket } = useSocket();
    const { user } = useAuth();

    const fetchEarningsData = () => {
        Promise.all([
            api.get('/drivers/stats'),
            api.get('/rides/history?limit=5')
        ]).then(([statsRes, ridesRes]) => {
            setStats(statsRes.data);
            setRides(ridesRes.data.rides);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEarningsData();
    }, []);

    // Socket listener for real-time earnings updates
    useEffect(() => {
        if (!socket || !user) return;

        // Join driver room if not already joined
        socket.emit('joinRoom', { userId: user._id, role: 'driver' });

        const handleRideStatusChanged = (data) => {
            if (data.status === 'completed') {
                // Fetch fresh stats when a ride is completed
                fetchEarningsData();
            }
        };

        socket.on('rideStatusChanged', handleRideStatusChanged);

        return () => {
            socket.off('rideStatusChanged', handleRideStatusChanged);
        };
    }, [socket, user]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const statCards = [
        { icon: <FiDollarSign />, label: 'Total Earnings', value: `₹${stats?.totalEarnings || 0}`, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { icon: <FiTruck />, label: 'Total Rides', value: stats?.totalRides || 0, bg: 'bg-teal-50', color: 'text-teal-600' },
        {
            icon: <FiStar />,
            label: 'Rating',
            component: <RatingStars rating={stats?.rating || 0} count={stats?.reviewCount || 0} size={10} showCount={false} />,
            value: stats?.rating?.toFixed(1) || '—',
            bg: 'bg-yellow-50',
            color: 'text-yellow-600'
        },
        { icon: <FiDollarSign />, label: 'Avg per Ride', value: `₹${stats?.totalRides > 0 ? Math.round(stats.totalEarnings / stats.totalRides) : 0}`, bg: 'bg-blue-50', color: 'text-blue-600' },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
                    <p className="text-sm text-gray-500 mt-1">Your earnings overview</p>
                </div>

                {/* Big earning card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-6 text-center mb-6"
                >
                    <p className="text-gray-400 text-xs mb-1">Total Earnings</p>
                    <h2 className="text-3xl font-bold text-white mb-1">₹{stats?.totalEarnings || 0}</h2>
                    <p className="text-gray-500 text-xs">{stats?.totalRides || 0} rides completed</p>
                </motion.div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-xl border border-gray-200 p-4"
                        >
                            <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-lg flex items-center justify-center mb-2`}>
                                {s.icon}
                            </div>
                            <div className="flex flex-col">
                                {s.component ? (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-gray-900">{s.value}</p>
                                        {s.component}
                                    </div>
                                ) : (
                                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                                )}
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Rides */}
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Recent Rides</h3>
                {rides.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <p className="text-sm text-gray-400">No rides yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rides.map(ride => (
                            <div key={ride._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[ride.status] || 'bg-gray-100 text-gray-500'}`}>
                                        {ride.status?.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full" />
                                        <span className="truncate">{ride.pickupLocation?.address || 'Pickup'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span className="truncate">{ride.dropLocation?.address || 'Drop'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-900">₹{ride.negotiatedFare || ride.proposedFare || ride.fare || 0}</span>
                                    <span className="text-xs text-gray-400">{ride.distance} km</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Earnings;
