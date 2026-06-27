import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCreditCard, FiDollarSign, FiSmartphone, FiCheckCircle,
    FiArrowRight, FiInfo, FiShield, FiCornerDownRight
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import SplitFareStatus from '../../components/SplitFareStatus';

const PaymentScreen = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [method, setMethod] = useState('cash');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [splitFare, setSplitFare] = useState(null);
    const [myShare, setMyShare] = useState(null);

    useEffect(() => {
        fetchRideDetails();
    }, [rideId]);

    const fetchRideDetails = async () => {
        try {
            const { data } = await api.get(`/rides/${rideId}`);
            setRide(data.ride);
            if (data.ride.paymentStatus === 'Paid') {
                setPaymentSuccess(true);
            }
        } catch (err) {
            toast.error('Failed to load ride details');
            navigate('/rider/home');
        } finally {
            setLoading(false);
        }
    };

    // Fetch split fare data if ride has splitFareId
    useEffect(() => {
        if (ride?.splitFareId) {
            fetchSplitFare();
        }
    }, [ride?.splitFareId]);

    const fetchSplitFare = async () => {
        try {
            const { data } = await api.get(`/split-fare/${rideId}`);
            setSplitFare(data.splitFare);
            // Find current user's share
            const entry = data.splitFare?.passengers?.find(
                p => p.userId === user?._id || p.userId?._id === user?._id || p.userId?.toString() === user?._id
            );
            if (entry) {
                setMyShare(entry.amount);
                if (entry.paymentStatus === 'paid') {
                    setPaymentSuccess(true);
                }
                // Default to wallet for split fares (no cash)
                setMethod('wallet');
            }
        } catch {
            // No split fare
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        try {
            // Split fare payment flow
            if (splitFare) {
                if (method === 'wallet') {
                    const { data } = await api.post('/split-fare/pay', {
                        splitFareId: splitFare._id,
                        method: 'wallet'
                    });
                    if (data.status === 'success') {
                        setPaymentSuccess(true);
                        setSplitFare(data.splitFare);
                        toast.success('Your share has been paid!');
                    }
                } else if (method === 'razorpay') {
                    // Create order for individual share amount
                    const { data: order } = await api.post('/payment/create-order', { amount: myShare });
                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
                        amount: order.amount,
                        currency: order.currency,
                        name: "Safro Split Fare",
                        description: `Split payment for ride #${rideId.substr(-6)}`,
                        order_id: order.id,
                        handler: async (response) => {
                            try {
                                await api.post('/payment/verify', { ...response, rideId });
                                setPaymentSuccess(true);
                                toast.success('Split payment verified!');
                            } catch (err) {
                                toast.error(err.response?.data?.message || 'Verification failed');
                            }
                        },
                        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
                        theme: { color: "#7c3aed" }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                }
                setProcessing(false);
                return;
            }

            // Regular (non-split) payment flow
            if (method === 'wallet') {
                const { data } = await api.post('/payment/pay-wallet', { rideId });
                if (data.status === 'success') {
                    setPaymentSuccess(true);
                    toast.success('Paid successfully via Wallet!');
                }
            } else if (method === 'razorpay') {
                if (!user) {
                    toast.error('User profile not loaded. Please refresh.');
                    setProcessing(false);
                    return;
                }
                // Razorpay Flow
                const { data: order } = await api.post('/payment/create-order', { rideId });

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
                    amount: order.amount,
                    currency: order.currency,
                    name: "Safro Ride",
                    description: `Payment for ride #${rideId.substr(-6)}`,
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            const { data: verifyData } = await api.post('/payment/verify', {
                                ...response,
                                rideId
                            });
                            if (verifyData.status === 'success') {
                                setPaymentSuccess(true);
                                toast.success('Payment verified successfully!');
                            }
                        } catch (err) {
                            toast.error(err.response?.data?.message || 'Payment verification failed');
                        }
                    },
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || '',
                        contact: user?.phone || ''
                    },
                    theme: { color: "#0d9488" }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                rzp.on('payment.failed', (response) => {
                    toast.error('Payment failed: ' + response.error.description);
                });
            } else {
                // Cash Payment
                toast.success('Cash payment requested. Please pay the driver.');
                // For cash, we just wait for driver confirmation or navigate back
                navigate('/rider/history');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment initiation failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    if (paymentSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl text-center border border-teal-100"
                >
                    <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiCheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Your ride has been paid for. Thank you for choosing Safro!</p>

                    <button
                        onClick={() => navigate('/rider/home')}
                        className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                    >
                        Back to Home <FiArrowRight />
                    </button>
                </motion.div>
            </div>
        );
    }

    const fare = ride?.negotiatedFare || ride?.fare?.final || ride?.fare?.proposed;
    const isSplit = !!splitFare;
    const displayFare = isSplit ? myShare : fare;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complete Payment</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Select your preferred payment method</p>
                </header>

                <div className="grid gap-6">
                    {/* Ride Summary Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Ride Summary</h2>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{isSplit ? 'Your Share' : 'Total Fare'}</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white">₹{displayFare || fare}</p>
                                {isSplit && (
                                    <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">of ₹{fare} total</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                    <FiShield size={14} /> Secured by Safro
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-dashed border-gray-100 dark:border-gray-800 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-teal-50 dark:bg-teal-900/20 mt-1.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mb-1 uppercase tracking-tight">Pickup</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{ride?.pickupLocation?.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mb-1 uppercase tracking-tight">Dropoff</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{ride?.dropLocation?.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Split Fare Status */}
                    {isSplit && (
                        <SplitFareStatus splitFare={splitFare} />
                    )}

                    {/* Payment Methods */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">Payment Methods</h2>

                        {/* Wallet */}
                        <label className={`
                            relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-gray-900
                            ${method === 'wallet' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-transparent hover:border-gray-200 dark:border-gray-700'}
                        `}>
                            <input
                                type="radio"
                                className="hidden"
                                name="payment"
                                value="wallet"
                                checked={method === 'wallet'}
                                onChange={(e) => setMethod(e.target.value)}
                            />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'wallet' ? 'bg-teal-50 dark:bg-teal-900/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                                <FiSmartphone size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Safro Wallet</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Balance: ₹{user?.walletBalance || 0}</p>
                            </div>
                            {method === 'wallet' && <FiCheckCircle className="text-teal-500" size={24} />}
                        </label>

                        {/* Razorpay */}
                        <label className={`
                            relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-gray-900
                            ${method === 'razorpay' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-transparent hover:border-gray-200 dark:border-gray-700'}
                        `}>
                            <input
                                type="radio"
                                className="hidden"
                                name="payment"
                                value="razorpay"
                                checked={method === 'razorpay'}
                                onChange={(e) => setMethod(e.target.value)}
                            />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'razorpay' ? 'bg-teal-50 dark:bg-teal-900/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                                <FiCreditCard size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Online Payment</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Cards, UPI, Netbanking (Razorpay)</p>
                            </div>
                            {method === 'razorpay' && <FiCheckCircle className="text-teal-500" size={24} />}
                        </label>

                        {/* Cash — disabled for split fares */}
                        {!isSplit && (
                        <label className={`
                            relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-gray-900
                            ${method === 'cash' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-transparent hover:border-gray-200 dark:border-gray-700'}
                        `}>
                            <input
                                type="radio"
                                className="hidden"
                                name="payment"
                                value="cash"
                                checked={method === 'cash'}
                                onChange={(e) => setMethod(e.target.value)}
                            />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'cash' ? 'bg-teal-50 dark:bg-teal-900/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                                <FiDollarSign size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Cash Payment</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pay the driver directly</p>
                            </div>
                            {method === 'cash' && <FiCheckCircle className="text-teal-500" size={24} />}
                        </label>
                        )}
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={processing}
                        className={`
                            w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg
                            ${processing ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' : isSplit ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-600/20' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20'}
                        `}
                    >
                        {processing ? <LoadingSpinner size="sm" /> : <>Confirm & Pay ₹{displayFare || fare} <FiArrowRight /></>}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                        <FiInfo size={12} /> Digital payments get an extra 2% cashback to your wallet!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentScreen;
