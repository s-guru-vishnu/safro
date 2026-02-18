import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { FiTruck, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

const Rides = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchRides();
    }, [filter, page]);

    const fetchRides = async () => {
        try {
            const query = filter ? `&status=${filter}` : '';
            const res = await api.get(`/admin/rides?page=${page}&limit=15${query}`);
            setRides(res.data.rides);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statuses = ['', 'requested', 'negotiating', 'accepted', 'on_trip', 'completed', 'cancelled'];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FiTruck className="text-teal-600" /> All Rides</h1>
                        <p className="text-sm text-gray-500 mt-1">{pagination.total || 0} total rides</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {statuses.map(s => (
                        <button
                            key={s}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${filter === s
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            onClick={() => { setFilter(s); setPage(1); }}
                        >
                            {s || 'All'}
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
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fare</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rides.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">No rides found</td></tr>
                                    ) : rides.map(ride => (
                                        <tr key={ride._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-gray-900">{ride.riderId?.name || '—'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{ride.driverId?.name || 'Unassigned'}</td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">
                                                {ride.pickupLocation?.address?.slice(0, 15) || '—'} → {ride.dropLocation?.address?.slice(0, 15) || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-900">₹{ride.negotiatedFare || ride.proposedFare || ride.fare || 0}</td>
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
            </div>
        </div>
    );
};

export default Rides;
