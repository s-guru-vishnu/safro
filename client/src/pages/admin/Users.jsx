import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiChevronLeft, FiChevronRight, FiTruck, FiChevronDown, FiChevronUp, FiStar } from 'react-icons/fi';
import RatingStars from '../../components/RatingStars';
import ConfirmModal from '../../components/ConfirmModal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [expandedDriver, setExpandedDriver] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, userName: '', currentStatus: false });

    useEffect(() => {
        fetchUsers();
    }, [filter, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const query = filter ? `&role=${filter}` : '';
            const res = await api.get(`/admin/users?page=${page}&limit=15${query}`);
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = (userId, userName, currentStatus) => {
        setConfirmModal({
            isOpen: true,
            userId,
            userName,
            currentStatus
        });
    };

    const executeSuspend = async () => {
        const { userId, currentStatus } = confirmModal;
        try {
            const res = await api.put(`/admin/users/${userId}/suspend`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: res.data.user.isSuspended } : u));
        } catch (err) {
            console.error(err);
        }
    };

    // No admin filter — admins are excluded from the list
    const roles = ['', 'rider', 'driver'];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FiUsers className="text-teal-600" /> Manage Users</h1>
                    <p className="text-sm text-gray-500 mt-1">{pagination.total || 0} total users (riders & drivers)</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {roles.map(r => (
                        <button
                            key={r}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${filter === r ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            onClick={() => { setFilter(r); setPage(1); }}
                        >
                            {r || 'All'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
                                    ) : users.map(user => (
                                        <>
                                            <tr key={user._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => user.role === 'driver' ? setExpandedDriver(expandedDriver === user._id ? null : user._id) : null}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-7 h-7 ${user.role === 'driver' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                                            {user.role === 'driver' ? <FiTruck size={12} /> : user.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-900">{user.name}</span>
                                                            {user.role === 'driver' && (
                                                                <span className="ml-1.5 text-indigo-500">
                                                                    {expandedDriver === user._id ? <FiChevronUp size={12} className="inline" /> : <FiChevronDown size={12} className="inline" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                                                <td className="px-5 py-3.5 text-gray-500">{user.phone || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${user.role === 'driver' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.isSuspended ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                        }`}>
                                                        {user.isSuspended ? 'Suspended' : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 text-xs">
                                                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSuspend(user._id, user.name, user.isSuspended); }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${user.isSuspended
                                                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Driver Details Expandable Row */}
                                            {user.role === 'driver' && expandedDriver === user._id && (
                                                <tr key={`${user._id}-details`}>
                                                    <td colSpan={7} className="px-5 py-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="bg-indigo-50/50 rounded-xl p-4 my-2 border border-indigo-100">
                                                                <h4 className="text-xs font-bold text-indigo-700 mb-3 uppercase tracking-wider">Driver Details</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Vehicle Type</p>
                                                                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.driverProfile?.vehicleType || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Model</p>
                                                                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.driverProfile?.vehicleModel || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Number</p>
                                                                        <p className="text-sm font-semibold text-gray-900 uppercase">{user.driverProfile?.vehicleNumber || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Color</p>
                                                                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.driverProfile?.vehicleColor || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">License Number</p>
                                                                        <p className="text-sm font-semibold text-gray-900">{user.driverProfile?.licenseNumber || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">City</p>
                                                                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.driverProfile?.city || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Rating</p>
                                                                        <RatingStars rating={user.driverProfile?.rating} count={user.driverProfile?.totalRides} size={12} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Total Rides</p>
                                                                        <p className="text-sm font-semibold text-gray-900">{user.driverProfile?.totalRides || 0}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Availability</p>
                                                                        <p className={`text-sm font-semibold ${user.driverProfile?.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                                                                            {user.driverProfile?.isAvailable ? 'Available' : 'Offline'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Driver Status</p>
                                                                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.driverProfile?.status || '—'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                            <FiChevronLeft size={16} />
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => (
                            <button
                                key={i}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === i + 1 ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                )}

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={executeSuspend}
                    title={`${confirmModal.currentStatus ? 'Unsuspend' : 'Suspend'} User?`}
                    message={`Are you sure you want to ${confirmModal.currentStatus ? 'unsuspend' : 'suspend'} ${confirmModal.userName}? This user will ${confirmModal.currentStatus ? 'regain' : 'lose'} access to the platform.`}
                    confirmText={confirmModal.currentStatus ? 'Unsuspend' : 'Suspend'}
                    type={confirmModal.currentStatus ? 'success' : 'danger'}
                />
            </div>
        </div>
    );
};

export default Users;
