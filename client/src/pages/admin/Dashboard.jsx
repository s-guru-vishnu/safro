import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiTruck, FiDollarSign, FiActivity, FiCheckCircle, FiXCircle, FiPlus, FiBarChart2, FiArrowRight, FiFileText, FiClock, FiMapPin, FiCalendar } from 'react-icons/fi';
import AdminAIInsights from '../../components/AdminAIInsights';
import DriverTrackingMap from '../../components/DriverTrackingMap';
import api from '../../services/api';

const statusColors = {
    requested: 'bg-blue-50 text-blue-600',
    negotiating: 'bg-yellow-50 text-yellow-600',
    accepted: 'bg-teal-50 text-teal-600',
    driver_arrived: 'bg-purple-50 text-purple-600',
    otp_verified: 'bg-indigo-50 text-indigo-600',
    on_trip: 'bg-orange-50 text-orange-600',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
};

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [recentRides, setRecentRides] = useState([]);
    const [pendingApplications, setPendingApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAppsList, setShowAppsList] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, ridesRes, appsRes] = await Promise.all([
                    api.get('/admin/analytics'),
                    api.get('/admin/rides?page=1&limit=5'),
                    api.get('/admin/driver-applications?status=pending&limit=10')
                ]);
                setAnalytics(analyticsRes.data);
                setRecentRides(ridesRes.data.rides || []);
                setPendingApplications(appsRes.data.applications || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleApplicationAction = async (id, action) => {
        try {
            setIsActionLoading(true);
            await api.put(`/admin/driver-applications/${id}/${action}`);
            setPendingApplications(prev => prev.filter(app => app._id !== id));
            setSelectedApp(null);
        } catch (err) {
            console.error(err);
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleScheduleOffline = async (id) => {
        const location = window.prompt("Enter offline verification location:", "Main Office - HR Dept");
        const scheduledDate = window.prompt("Enter date (YYYY-MM-DD):", new Date(Date.now() + 86400000).toISOString().split('T')[0]);

        if (!location || !scheduledDate) return;

        try {
            setIsActionLoading(true);
            await api.put(`/admin/driver-applications/${id}/schedule-meeting`, {
                location,
                scheduledDate,
                notes: "Please bring original Aadhaar, License, and RC for verification."
            });
            setPendingApplications(prev => prev.filter(app => app._id !== id));
            setSelectedApp(null);
            alert('Offline verification request sent via SMS!');
        } catch (err) {
            console.error(err);
            alert('Failed to schedule: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        { icon: <FiUsers />, label: 'Total Users', value: analytics?.totalUsers || 0, bg: 'bg-blue-50', color: 'text-blue-600' },
        { icon: <FiTruck />, label: 'Total Rides', value: analytics?.totalRides || 0, bg: 'bg-teal-50', color: 'text-teal-600' },
        { icon: <FiCheckCircle />, label: 'Completed', value: analytics?.completedRides || 0, bg: 'bg-green-50', color: 'text-green-600' },
        { icon: <FiXCircle />, label: 'Cancelled', value: analytics?.cancelledRides || 0, bg: 'bg-red-50', color: 'text-red-600' },
        { icon: <FiActivity />, label: 'Active', value: analytics?.activeRides || 0, bg: 'bg-yellow-50', color: 'text-yellow-600' },
        { icon: <FiDollarSign />, label: 'Revenue', value: `₹${analytics?.totalRevenue || 0}`, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Platform overview and analytics</p>
                    </div>
                    <Link to="/admin/create-driver" className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-sm">
                        <FiPlus size={14} /> Create Driver
                    </Link>
                </div>

                {/* AI Insights Section */}
                <AdminAIInsights />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            className="bg-white rounded-xl border border-gray-200 p-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center text-base mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Driver Tracking Map */}
                <DriverTrackingMap />

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    {/* User Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">User Breakdown</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-gray-500">Riders</span>
                                    <span className="font-semibold text-gray-900">{analytics?.totalRiders || 0}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${analytics?.totalUsers ? (analytics.totalRiders / analytics.totalUsers * 100) : 0}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-gray-500">Drivers</span>
                                    <span className="font-semibold text-gray-900">{analytics?.totalDrivers || 0}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${analytics?.totalUsers ? (analytics.totalDrivers / analytics.totalUsers * 100) : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Last 7 Days */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Last 7 Days Ride Count</h3>
                        {analytics?.recentRidesByDay?.length > 0 ? (
                            <div className="flex items-end gap-3 h-48">
                                {analytics.recentRidesByDay.map((day, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-xs font-bold text-gray-900">{day.count}</span>
                                        <div
                                            className="w-full bg-teal-500 rounded-t-md transition-all hover:bg-teal-600 cursor-help"
                                            style={{ height: `${Math.max(day.count * 10, 8)}px` }}
                                            title={`${day.count} rides on ${day._id}`}
                                        />
                                        <span className="text-[10px] text-gray-400">{day._id.slice(5)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No ride data available</p>
                        )}
                    </div>
                </div>

                {/* Regional Analytics */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    {/* Drivers per Taluk */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiUsers className="text-teal-600" /> Drivers per Taluk
                        </h3>
                        <div className="space-y-4">
                            {analytics?.driversByTaluk?.length > 0 ? (
                                analytics.driversByTaluk.map((taluk, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-500">{taluk._id}</span>
                                            <span className="font-bold text-gray-900">{taluk.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 rounded-full h-1.5">
                                            <div 
                                                className="bg-teal-500 h-1.5 rounded-full transition-all" 
                                                style={{ width: `${(taluk.count / analytics.totalDrivers) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">No regional data available</p>
                            )}
                        </div>
                    </div>

                    {/* Activity per District */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiActivity className="text-blue-600" /> Activity per District
                        </h3>
                        <div className="space-y-4">
                            {analytics?.ridesByDistrict?.length > 0 ? (
                                analytics.ridesByDistrict.map((district, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-500">{district._id}</span>
                                            <span className="font-bold text-gray-900">{district.count} rides</span>
                                        </div>
                                        <div className="w-full bg-gray-50 rounded-full h-1.5">
                                            <div 
                                                className="bg-blue-500 h-1.5 rounded-full transition-all" 
                                                style={{ width: `${(district.count / analytics.totalRides) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">No activity data available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Rides Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Recent Rides</h3>
                        <Link to="/admin/rides" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors">
                            View All Rides <FiArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fare</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentRides.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">No rides yet</td></tr>
                                ) : recentRides.map(ride => (
                                    <tr key={ride._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-gray-900">{ride.riderId?.name || '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{ride.driverId?.name || 'Unassigned'}</td>
                                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                                            {ride.pickupLocation?.address?.slice(0, 20) || '—'} → {ride.dropLocation?.address?.slice(0, 20) || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-gray-900">₹{ride.negotiatedFare || ride.proposedFare || ride.fare?.final || ride.fare?.proposed || 0}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[ride.status] || 'bg-gray-100 text-gray-500'}`}>
                                                {ride.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid sm:grid-cols-4 gap-4">
                    <Link to="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition-all group">
                        <FiUsers className="text-teal-600 mb-2" size={20} />
                        <h4 className="text-sm font-bold text-gray-900">Manage Users</h4>
                        <p className="text-xs text-gray-500 mt-1">View riders & drivers</p>
                    </Link>
                    <Link to="/admin/rides" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition-all group">
                        <FiTruck className="text-teal-600 mb-2" size={20} />
                        <h4 className="text-sm font-bold text-gray-900">Ride Monitoring</h4>
                        <p className="text-xs text-gray-500 mt-1">Track live negotiations</p>
                    </Link>
                    <button
                        onClick={() => setShowAppsList(true)}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-amber-200 transition-all group text-left relative"
                    >
                        <FiFileText className="text-amber-600 mb-2" size={20} />
                        {pendingApplications.length > 0 && (
                            <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                {pendingApplications.length}
                            </span>
                        )}
                        <h4 className="text-sm font-bold text-gray-900">Pending Apps</h4>
                        <p className="text-xs text-gray-500 mt-1">Review new applicants</p>
                    </button>
                    <Link to="/admin/create-driver" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition-all group">
                        <FiPlus className="text-teal-600 mb-2" size={20} />
                        <h4 className="text-sm font-bold text-gray-900">Onboard Driver</h4>
                        <p className="text-xs text-gray-500 mt-1">Directly create driver</p>
                    </Link>
                </div>

                {/* Modals & Overlays */}
                <AnimatePresence>
                    {showAppsList && (
                        <div className="fixed inset-0 z-[1040] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowAppsList(false)}
                                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[1050]"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col z-[1100]"
                            >
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <FiFileText className="text-amber-600" /> Pending Applications
                                    </h2>
                                    <button onClick={() => setShowAppsList(false)} className="text-gray-400 hover:text-gray-600 px-2 py-1 text-2xl">&times;</button>
                                </div>
                                <div className="overflow-y-auto p-6">
                                    {pendingApplications.length === 0 ? (
                                        <div className="text-center py-20">
                                            <FiCheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                                            <p className="text-gray-500 font-medium">All caught up! No pending applications.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {pendingApplications.map(app => (
                                                <div
                                                    key={app._id}
                                                    onClick={() => setSelectedApp(app)}
                                                    className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-teal-200 hover:bg-teal-50/10 cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-teal-600 font-bold">
                                                            {app.userId?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{app.userId?.name}</div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">{app.vehicleType} • {app.city}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center justify-end gap-1">
                                                            <FiClock /> {new Date(app.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <span className="text-xs font-semibold text-teal-600">View Details &rarr;</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {selectedApp && (
                        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedApp(null)}
                                className="absolute inset-0 bg-gray-900/80 backdrop-blur-md z-[1210]"
                            />
                            <motion.div
                                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-[1220]"
                            >
                                <div className="p-6 bg-teal-600 text-white flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedApp.userId?.name}</h2>
                                        <p className="text-teal-100 text-xs">Driver Registration Details</p>
                                    </div>
                                    <button onClick={() => setSelectedApp(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                                </div>
                                <div className="overflow-y-auto p-8 space-y-8">
                                    {/* Personal Info */}
                                    <section>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FiUsers /> Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs text-gray-500">Full Name</p>
                                                <p className="font-semibold text-gray-900">{selectedApp.userId?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Phone Number</p>
                                                <p className="font-semibold text-gray-900">{selectedApp.userId?.phone}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Email Address</p>
                                                <p className="font-semibold text-gray-900">{selectedApp.userId?.email}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Vehicle Info */}
                                    <section>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FiTruck /> Vehicle Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Vehicle Type</p>
                                                <p className="font-bold text-gray-900 capitalize">{selectedApp.vehicleType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Vehicle Number</p>
                                                <p className="font-bold text-gray-900 uppercase">{selectedApp.vehicleNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">City of Operation</p>
                                                <p className="font-semibold text-gray-900">{selectedApp.city}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">License Number</p>
                                                <p className="font-semibold text-gray-900 uppercase">{selectedApp.licenseNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Taluk</p>
                                                <p className="font-bold text-teal-600">{selectedApp.taluk}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Documents List (Visual place holder for now as files are not handles yet, but showing names) */}
                                    <section>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FiFileText /> Submitted Documents
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                                                        <FiFileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">Driver's License</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{selectedApp.licenseNumber}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase mr-2">Uploaded</span>
                                                    {selectedApp.licenseImage && (
                                                        <button
                                                            onClick={() => setPreviewImage(selectedApp.licenseImage)}
                                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <FiMapPin size={12} /> View Doc
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                        <FiFileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">Vehicle RC</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{selectedApp.rcNumber || 'Document'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase mr-2">Uploaded</span>
                                                    {selectedApp.rcDocument && (
                                                        <button
                                                            onClick={() => setPreviewImage(selectedApp.rcDocument)}
                                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <FiMapPin size={12} /> View Doc
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedApp.aadhaarImage && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                            <FiFileText size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">Aadhaar Card</p>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{selectedApp.aadhaarNumber}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase mr-2">Uploaded</span>
                                                        <button
                                                            onClick={() => setPreviewImage(selectedApp.aadhaarImage)}
                                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <FiMapPin size={12} /> View Doc
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedApp.insuranceDocument && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                                            <FiFileText size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">Vehicle Insurance</p>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{selectedApp.insurancePolicyNumber || 'Policy Document'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase mr-2">Uploaded</span>
                                                        <button
                                                            onClick={() => setPreviewImage(selectedApp.insuranceDocument)}
                                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <FiMapPin size={12} /> View Doc
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                                    <button
                                        onClick={() => handleScheduleOffline(selectedApp._id)}
                                        disabled={isActionLoading}
                                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        <FiCalendar /> Request Offline Docs
                                    </button>
                                    <button
                                        onClick={() => handleApplicationAction(selectedApp._id, 'approve')}
                                        disabled={isActionLoading}
                                        className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApplicationAction(selectedApp._id, 'reject')}
                                        disabled={isActionLoading}
                                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Image Preview Modal */}
                    {previewImage && (
                        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPreviewImage(null)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-xl z-[1410]"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-4xl w-full max-h-[85vh] z-[1420] flex flex-col items-center"
                            >
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute -top-12 right-0 text-white hover:text-gray-300 text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-all"
                                >
                                    <FiXCircle /> Close Preview
                                </button>
                                <div className="w-full h-full rounded-2xl overflow-auto bg-gray-900 border border-white/10 shadow-2xl custom-scrollbar flex items-center justify-center">
                                    <div
                                        style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                                        className="origin-center"
                                    >
                                        <img
                                            src={previewImage}
                                            alt="Document Preview"
                                            className="max-h-[70vh] w-auto h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center gap-3">
                                    <div className="flex bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-1">
                                        <button
                                            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                                            className="px-3 py-1.5 text-white hover:bg-white/20 rounded-lg text-sm font-bold transition-all"
                                            title="Zoom Out"
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-1.5 text-white text-xs font-bold border-x border-white/10 flex items-center">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                        <button
                                            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                                            className="px-3 py-1.5 text-white hover:bg-white/20 rounded-lg text-sm font-bold transition-all"
                                            title="Zoom In"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setZoomLevel(1)}
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        Reset Zoom
                                    </button>
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = previewImage;
                                            link.download = `document-${Date.now()}.png`;
                                            link.click();
                                        }}
                                        className="px-6 py-2 bg-teal-500 text-white rounded-xl font-bold text-xs hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                                    >
                                        Download Image
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
