import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiNavigation, FiCheckCircle, FiX, FiDollarSign, FiArrowRight } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import SplitFareStatus from '../../components/SplitFareStatus';
import LoadingSpinner from '../../components/LoadingSpinner';

const SplitFareDetail = () => {
    const { rideId, code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [splitFare, setSplitFare] = useState(null);
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (code) {
            joinByCode();
        } else if (rideId) {
            fetchDetails();
        }
    }, [rideId, code]);

    // Socket listener
    useEffect(() => {
        if (!socket || !splitFare) return;
        const handleUpdate = (data) => {
            if (data.splitFare?._id === splitFare._id) {
                setSplitFare(data.splitFare);
            }
        };
        socket.on('splitFareUpdated', handleUpdate);
        socket.on('splitFarePayment', handleUpdate);
        return () => {
            socket.off('splitFareUpdated', handleUpdate);
            socket.off('splitFarePayment', handleUpdate);
        };
    }, [socket, splitFare?._id]);

    const joinByCode = async () => {
        try {
            const { data } = await api.post(`/split-fare/join/${code}`);
            setSplitFare(data.splitFare);
            if (data.splitFare.rideId) {
                const rideRes = await api.get(`/rides/${typeof data.splitFare.rideId === 'string' ? data.splitFare.rideId : data.splitFare.rideId._id}`);
                setRide(rideRes.data.ride);
            }
            toast.success(data.message || 'Joined split fare!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async () => {
        try {
            const { data } = await api.get(`/split-fare/${rideId}`);
            setSplitFare(data.splitFare);
            const rideRes = await api.get(`/rides/${rideId}`);
            setRide(rideRes.data.ride);
        } catch (err) {
            toast.error('Failed to load split fare details');
            navigate('/rider/home');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (response) => {
        setResponding(true);
        try {
            const { data } = await api.post('/split-fare/respond', {
                splitFareId: splitFare._id,
                response
            });
            setSplitFare(data.splitFare);
            toast.success(response === 'accepted' ? 'Invite accepted!' : 'Invite declined');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to respond');
        } finally {
            setResponding(false);
        }
    };

    const handlePay = async () => {
        setPaying(true);
        try {
            const { data } = await api.post('/split-fare/pay', {
                splitFareId: splitFare._id,
                method: 'wallet'
            });
            setSplitFare(data.splitFare);
            toast.success('Payment successful!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    if (!splitFare) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">This split fare doesn't exist or has expired.</p>
                </div>
            </div>
        );
    }

    // Find current user's passenger entry
    const myEntry = splitFare.passengers?.find(p =>
        p.userId === user?._id || p.userId?._id === user?._id || p.userId?.toString() === user?._id
    );
    const myShare = myEntry?.amount || 0;
    const needsResponse = myEntry?.inviteStatus === 'invited';
    const canPay = myEntry?.inviteStatus === 'accepted' && myEntry?.paymentStatus === 'pending';
    const hasPaid = myEntry?.paymentStatus === 'paid';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-lg mx-auto px-4 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiUsers size={28} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Split Fare</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {splitFare.passengers?.find(p => p.userId === splitFare.createdBy || p.userId?._id === splitFare.createdBy)?.name || 'Someone'} invited you to split
                    </p>
                </motion.div>

                {/* Ride Info */}
                {ride && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
                    >
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Ride Details</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <FiMapPin className="text-teal-500 mt-0.5 flex-shrink-0" size={14} />
                                <div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Pickup</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{ride.pickupLocation?.address}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <FiNavigation className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                                <div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Drop</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{ride.dropLocation?.address}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Your Share */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Total Fare</span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">₹{splitFare.totalFare}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-bold uppercase">Your Share</span>
                            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">₹{myShare}</p>
                        </div>
                    </div>

                    <SplitFareStatus splitFare={splitFare} />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    {needsResponse && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleRespond('rejected')}
                                disabled={responding}
                                className="py-3.5 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiX size={16} /> Decline
                            </button>
                            <button
                                onClick={() => handleRespond('accepted')}
                                disabled={responding}
                                className="py-3.5 rounded-xl font-bold text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {responding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiCheckCircle size={16} /> Accept</>}
                            </button>
                        </div>
                    )}

                    {canPay && (
                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                        >
                            {paying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiDollarSign size={16} /> Pay ₹{myShare} via Wallet</>}
                        </button>
                    )}

                    {hasPaid && (
                        <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <FiCheckCircle className="mx-auto text-emerald-500 mb-2" size={24} />
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">Payment Complete</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Your share of ₹{myShare} has been paid</p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/rider/home')}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-1"
                    >
                        Back to Home <FiArrowRight size={14} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default SplitFareDetail;
