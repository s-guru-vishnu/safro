import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUserPlus, FiPhone, FiCopy, FiCheck, FiUsers, FiDollarSign, FiClock, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const SplitFareModal = ({ isOpen, onClose, rideId, splitFareData, onUpdate }) => {
    const [splitFare, setSplitFare] = useState(splitFareData || null);
    const [phone, setPhone] = useState('');
    const [inviting, setInviting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(!splitFareData);
    const { socket } = useSocket();

    useEffect(() => {
        if (isOpen && rideId && !splitFareData) {
            fetchSplitFare();
        }
        if (splitFareData) setSplitFare(splitFareData);
    }, [isOpen, rideId, splitFareData]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !splitFare) return;

        const handleUpdate = (data) => {
            if (data.splitFare?._id === splitFare._id) {
                setSplitFare(data.splitFare);
                if (onUpdate) onUpdate(data.splitFare);
            }
        };

        socket.on('splitFareUpdated', handleUpdate);
        socket.on('splitFareResponse', handleUpdate);
        socket.on('splitFarePayment', handleUpdate);

        return () => {
            socket.off('splitFareUpdated', handleUpdate);
            socket.off('splitFareResponse', handleUpdate);
            socket.off('splitFarePayment', handleUpdate);
        };
    }, [socket, splitFare?._id]);

    const fetchSplitFare = async () => {
        try {
            const { data } = await api.get(`/split-fare/${rideId}`);
            setSplitFare(data.splitFare);
        } catch {
            // No split fare exists yet
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSplit = async () => {
        try {
            const { data } = await api.post('/split-fare/create', { rideId });
            setSplitFare(data.splitFare);
            toast.success('Split fare enabled!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create split');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!phone.trim()) return;
        setInviting(true);
        try {
            const { data } = await api.post('/split-fare/invite', {
                splitFareId: splitFare._id,
                phone: phone.trim()
            });
            setSplitFare(data.splitFare);
            setPhone('');
            toast.success('Invite sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to invite');
        } finally {
            setInviting(false);
        }
    };

    const handleCopyLink = () => {
        if (!splitFare?.inviteCode) return;
        const link = `${window.location.origin}/rider/split-fare/join/${splitFare.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Invite link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemove = async (userId) => {
        try {
            const { data } = await api.delete(`/split-fare/${splitFare._id}/remove/${userId}`);
            setSplitFare(data.splitFare);
            toast.success('Passenger removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove');
        }
    };

    if (!isOpen) return null;

    const getStatusBadge = (inviteStatus, paymentStatus) => {
        if (paymentStatus === 'paid') return { label: 'Paid', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
        if (inviteStatus === 'accepted') return { label: 'Accepted', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' };
        if (inviteStatus === 'rejected') return { label: 'Declined', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
        if (inviteStatus === 'expired') return { label: 'Expired', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
        return { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' };
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
                        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <FiX size={18} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiUsers className="text-violet-500" /> Split Fare
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Split the ride cost with friends</p>
                    </div>

                    <div className="p-6 space-y-5">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : !splitFare ? (
                            /* No split yet — create */
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FiUsers size={28} className="text-violet-500" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Split the cost</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Share the fare equally with your co-passengers</p>
                                <button
                                    onClick={handleCreateSplit}
                                    className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all"
                                >
                                    Enable Split Fare
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Fare Summary */}
                                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-wider font-bold">Total Fare</span>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">₹{splitFare.totalFare}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-wider font-bold">Per Person</span>
                                            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
                                                ₹{splitFare.passengers?.filter(p => p.inviteStatus === 'accepted').length > 0
                                                    ? Math.ceil(splitFare.totalFare / splitFare.passengers.filter(p => p.inviteStatus === 'accepted').length)
                                                    : splitFare.totalFare}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex-1 bg-violet-200 dark:bg-violet-800/40 rounded-full h-1.5">
                                            <div
                                                className="bg-violet-600 h-1.5 rounded-full transition-all"
                                                style={{
                                                    width: `${splitFare.passengers?.length
                                                        ? (splitFare.passengers.filter(p => p.paymentStatus === 'paid').length / splitFare.passengers.filter(p => p.inviteStatus === 'accepted').length) * 100
                                                        : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                            {splitFare.passengers?.filter(p => p.paymentStatus === 'paid').length}/{splitFare.passengers?.filter(p => p.inviteStatus === 'accepted').length} paid
                                        </span>
                                    </div>
                                </div>

                                {/* Invite Form */}
                                <form onSubmit={handleInvite} className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <FiPhone className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                                        <input
                                            type="tel"
                                            placeholder="Phone number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500 text-gray-700 dark:text-gray-200"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={inviting || !phone.trim()}
                                        className="px-4 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                    >
                                        {inviting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiUserPlus size={16} />}
                                    </button>
                                </form>

                                {/* Share Link */}
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                                >
                                    {copied ? <><FiCheck size={14} className="text-emerald-500" /> Copied!</> : <><FiCopy size={14} /> Copy Invite Link</>}
                                </button>

                                {/* Passengers List */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                        Passengers ({splitFare.passengers?.length || 0}/{splitFare.maxPassengers})
                                    </h4>
                                    <div className="space-y-2">
                                        {splitFare.passengers?.map((p, i) => {
                                            const badge = getStatusBadge(p.inviteStatus, p.paymentStatus);
                                            const isCreator = p.userId === splitFare.createdBy || p.userId?._id === splitFare.createdBy;
                                            return (
                                                <div key={p._id || i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                                                        {(p.name || p.phone || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {p.name || p.phone}
                                                            {isCreator && <span className="text-[9px] text-violet-500 ml-1">(organizer)</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">₹{p.amount || 0}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                    {!isCreator && p.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => handleRemove(p.userId?._id || p.userId)}
                                                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <FiTrash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Expiry Info */}
                                {splitFare.inviteExpiry && new Date(splitFare.inviteExpiry) > new Date() && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                                        <FiClock size={12} />
                                        Invites expire {new Date(splitFare.inviteExpiry).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SplitFareModal;
