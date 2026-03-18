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
            const res = await api.post('/payment/wallet', { rideId: ride._id });
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
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-lg relative z-10"
            >
                <GlassCard className="border-white/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
                    {/* Header Splash */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent -z-10" />
                    
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">Settle Payment</h2>
                                <p className="text-slate-400 mt-1 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Secure Transaction
                                </p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>

                        {/* Price Display Block */}
                        <div className="relative mb-8 group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                            <div className="relative bg-slate-900/50 border border-white/10 rounded-3xl p-6 flex justify-between items-center backdrop-blur-xl">
                                <div>
                                    <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">Total Fare</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-indigo-400 text-xl font-bold">₹</span>
                                        <span className="text-4xl font-black text-white">{total}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-tighter">Ride ID</div>
                                    <code className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                                        {ride._id.slice(-8).toUpperCase()}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3 mb-8">
                            {methods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedMethod === method.id;
                                return (
                                    <motion.button
                                        key={method.id}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                            isSelected 
                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${method.color} shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold tracking-tight">{method.name}</span>
                                                {isSelected && <motion.div layoutId="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-4 h-4 text-indigo-400" /></motion.div>}
                                            </div>
                                            <span className="text-slate-400 text-xs block truncate">{method.desc}</span>
                                        </div>

                                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                                            isSelected 
                                            ? 'bg-indigo-500/20 text-indigo-300' 
                                            : 'bg-white/5 text-slate-500'
                                        }`}>
                                            {method.badge}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Wallet Offer Card (Subtle hint) */}
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-8 flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-lg">
                                <Coins className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-xs text-emerald-200/70">
                                Pay via <span className="text-emerald-400 font-bold underline underline-offset-2">Safro Wallet</span> to earn 2% instant cashback on this ride.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <AnimatedButton
                            onClick={handlePayment}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black text-lg tracking-wide shadow-2xl flex items-center justify-center gap-3 transition-all ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            } bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/20`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{selectedMethod === 'cash' ? 'Pay directly with Cash' : `Complete Payment of ₹${total}`}</span>
                                    <ArrowRightLeft className="w-5 h-5 opacity-50" />
                                </>
                            )}
                        </AnimatedButton>
                        
                        <p className="text-center text-slate-500 text-[10px] mt-6 font-medium uppercase tracking-[0.2em]">
                            End-to-end encrypted • Licensed SafePay Partner
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default PaymentScreen;
