import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
    CreditCard,
    Wallet,
    Banknote,
    ChevronRight,
    PlusCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
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
    const commission = Math.round(fare * 0.15); // Local display only
    const total = fare; // We don't add commission to ride fare, it's deducted from it, but user pays 'fare'

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
                name: 'Safro Ride',
                description: `Payment for ride ${ride._id}`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            ...response,
                            rideId: ride._id
                        });
                        if (verifyRes.data.status === 'success') {
                            toast.success('Payment Successful!');
                            onPaymentSuccess(verifyRes.data.ride);
                        }
                    } catch (err) {
                        toast.error('Verification failed');
                    }
                },
                prefill: {
                    name: '', // Will be filled by user info if available
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#6366f1'
                }
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
            toast.error('Insufficient balance. Please add money to your wallet.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/payment/wallet', { rideId: ride._id });
            if (res.data.status === 'success') {
                toast.success('Paid using wallet!');
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
            // For cash, we just notify the driver and wait for their confirmation
            // The back-end handles this by marking the method as cash and pending confirmation
            // Wait: our current verify endpoint is for online. For cash we need to let driver confirm.
            toast.success('Please pay ₹' + total + ' to the driver');
            setSelectedMethod('cash');
            // We don't call anything here yet, the driver must confirm
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (selectedMethod === 'razorpay') handleRazorpay();
        else if (selectedMethod === 'wallet') handleWalletPay();
        else if (selectedMethod === 'cash') handleCashSelection();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-md overflow-hidden relative border-indigo-500/30">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Payment Required</h2>
                    <p className="text-zinc-400 text-sm mb-6">Your ride is complete. Please settle the payment.</p>

                    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-400">Ride Fare</span>
                            <span className="text-white font-medium">₹{fare}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-white font-bold">Total Amount</span>
                            <span className="text-2xl font-bold text-indigo-400">₹{total}</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <button
                            onClick={() => setSelectedMethod('wallet')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedMethod === 'wallet'
                                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedMethod === 'wallet' ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                                    <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-semibold flex items-center gap-2">
                                        Safro Wallet
                                        {selectedMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <div className="text-xs text-zinc-400">Balance: ₹{walletBalance}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>

                        <button
                            onClick={() => setSelectedMethod('razorpay')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedMethod === 'razorpay'
                                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedMethod === 'razorpay' ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-semibold flex items-center gap-2">
                                        Online / Cards / UPI
                                        {selectedMethod === 'razorpay' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <div className="text-xs text-zinc-400">Powered by Razorpay</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>

                        <button
                            onClick={() => setSelectedMethod('cash')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedMethod === 'cash'
                                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedMethod === 'cash' ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                                    <Banknote className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-semibold flex items-center gap-2">
                                        Cash Payment
                                        {selectedMethod === 'cash' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <div className="text-xs text-zinc-400">Pay directly to driver</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                    </div>

                    <AnimatedButton
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                            selectedMethod === 'cash' ? 'Pay with Cash' : `Pay ₹${total}`}
                    </AnimatedButton>
                </div>
            </GlassCard>
        </div>
    );
};

export default PaymentScreen;
