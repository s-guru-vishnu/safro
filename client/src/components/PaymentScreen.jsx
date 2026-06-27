import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
    CreditCard,
    Wallet,
    Banknote,
    ChevronRight,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    ArrowRightLeft,
    Sparkles,
    Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import AnimatedButton from './AnimatedButton';

const PaymentScreen = ({ ride, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [walletBalance, setWalletBalance] = useState(0);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const res = await api.get('/auth/profile');
                setWalletBalance(res.data.user.walletBalance || 0);
            } catch (err) {
                console.error('Error fetching wallet:', err);
            }
        };
        fetchWallet();
    }, []);

    const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
    const total = fare;

    const handleRazorpay = async () => {
        setLoading(true);
        try {
            const { data: order } = await api.post('/payment/create-order', {
                rideId: ride._id,
                amount: total
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
                amount: order.amount,
                currency: order.currency,
                name: 'Safro',
                description: `Complete payment for your ride`,
                order_id: order.id,
                handler: async (response) => {
                    setLoading(true);
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            ...response,
                            rideId: ride._id
                        });
                        if (verifyRes.data.status === 'success') {
                            toast.success('Payment Received! Rating driver...');
                            onPaymentSuccess(verifyRes.data.ride);
                        }
                    } catch (err) {
                        toast.error('Verification failed');
                    } finally {
                        setLoading(false);
                    }
                },
                theme: { color: '#6366f1' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error('Failed to initiate Razorpay');
        } finally {
            setLoading(false);
        }
    };

    const handleWalletPay = async () => {
        if (walletBalance < total) {
            toast.error('Insufficient balance.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/payment/pay-wallet', { rideId: ride._id });
            if (res.data.status === 'success') {
                toast.success('Paid via Wallet!');
                onPaymentSuccess(res.data.ride);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Wallet payment failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCashSelection = async () => {
        setLoading(true);
        try {
            const res = await api.post('/payment/initiate-cash', { rideId: ride._id });
            if (res.data.status === 'success') {
                toast.success('Cash payment initiated. Driver will confirm shortly.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate cash payment');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (selectedMethod === 'razorpay') handleRazorpay();
        else if (selectedMethod === 'wallet') handleWalletPay();
        else if (selectedMethod === 'cash') handleCashSelection();
    };

    const methods = [
        {
            id: 'wallet',
            name: 'Safro Wallet',
            desc: `Balance: ₹${walletBalance}`,
            icon: Wallet,
            color: 'from-emerald-500 to-teal-600',
            badge: walletBalance >= total ? 'Sufficient' : 'Low Balance'
        },
        {
            id: 'razorpay',
            name: 'Online Payment',
            desc: 'Cards, UPI, Netbanking',
            icon: CreditCard,
            color: 'from-indigo-500 to-purple-600',
            badge: 'Secure'
        },
        {
            id: 'cash',
            name: 'Cash to Driver',
            desc: 'Pay after the ride',
            icon: Banknote,
            color: 'from-amber-500 to-orange-600',
            badge: 'Traditional'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    {/* Top Accent Bar */}
                    <div className="h-2 bg-[#148e85] w-full" />
                    
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settle Payment</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-2 font-medium">
                                    <ShieldCheck className="w-4 h-4 text-[#148e85]" />
                                    Secure & Encrypted Transaction
                                </p>
                            </div>
                            <div className="bg-[#148e85]/5 p-3 rounded-2xl border border-[#148e85]/10">
                                <Sparkles className="w-6 h-6 text-[#148e85]" />
                            </div>
                        </div>

                        {/* Price Display Block */}
                        <div className="bg-gray-900 rounded-3xl p-6 flex justify-between items-center relative overflow-hidden mb-6 shadow-xl shadow-gray-200">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#148e85]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full -ml-12 -mb-12 blur-2xl" />

                            <div className="relative">
                                <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Fare</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-[#148e85] text-xl font-bold">₹</span>
                                    <span className="text-4xl font-black text-white">{total}</span>
                                </div>
                            </div>
                            <div className="text-right relative">
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-black mb-1 uppercase tracking-widest">Ride ID</div>
                                <code className="text-xs text-[#148e85] font-mono bg-[#148e85]/10 px-3 py-1.5 rounded-xl border border-[#148e85]/20">
                                    {ride._id.slice(-8).toUpperCase()}
                                </code>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-2 mb-6">
                            {methods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedMethod === method.id;
                                const isWallet = method.id === 'wallet';
                                const lowBalance = isWallet && walletBalance < total;

                                return (
                                    <motion.button
                                        key={method.id}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`w-full group relative flex items-center gap-4 p-3 rounded-3xl border transition-all duration-300 ${
                                            isSelected 
                                            ? 'bg-[#148e85]/5 border-[#148e85] shadow-lg shadow-[#148e85]/10' 
                                            : 'bg-white border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <div className={`p-3.5 rounded-2xl shadow-sm shrink-0 group-hover:scale-110 transition-transform ${
                                            method.id === 'wallet' ? 'bg-[#148e85]' : 
                                            method.id === 'razorpay' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-500'
                                        }`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-black tracking-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{method.name}</span>
                                                {isSelected && <motion.div layoutId="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-4 h-4 text-[#148e85]" /></motion.div>}
                                            </div>
                                            <span className={`text-xs block truncate font-medium ${lowBalance ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {method.desc}
                                            </span>
                                        </div>

                                        <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            isSelected 
                                            ? (lowBalance ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-[#148e85] text-white')
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                        }`}>
                                            {method.badge}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Wallet Offer Card */}
                        <div className="bg-[#148e85]/5 border border-[#148e85]/10 rounded-3xl p-4 mb-6 flex items-center gap-4">
                            <div className="bg-[#148e85]/20 p-2.5 rounded-xl">
                                <Sparkles className="w-5 h-5 text-[#148e85]" />
                            </div>
                            <p className="text-[11px] text-[#148e85] font-medium leading-relaxed">
                                Pay via <span className="text-[#148e85] font-black">Safro Wallet</span> to earn up to <span className="bg-[#148e85]/20 text-[#148e85] px-1.5 py-0.5 rounded font-bold">2% cashback</span> on this ride.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <AnimatedButton
                            onClick={handlePayment}
                            disabled={loading || (selectedMethod === 'wallet' && walletBalance < total)}
                            className={`w-full py-4 rounded-2xl font-black text-lg tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                                loading || (selectedMethod === 'wallet' && walletBalance < total)
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                                : 'bg-[#148e85] hover:opacity-90 text-white shadow-[#148e85]/20'
                            }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{selectedMethod === 'cash' ? 'Pay directly with Cash' : `Pay ₹${total}`}</span>
                                    <ArrowRightLeft className="w-5 h-5" />
                                </>
                            )}
                        </AnimatedButton>
                        
                        <div className="flex flex-col items-center mt-4 space-y-1">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                End-to-end encrypted • Licensed SafePay Partner
                            </p>
                            <div className="w-12 h-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentScreen;
