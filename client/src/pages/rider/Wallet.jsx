import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Wallet as WalletIcon,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    CreditCard,
    Loader2,
    CheckCircle2,
    Zap,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import AnimatedButton from '../../components/AnimatedButton';
import LoadingSpinner from '../../components/LoadingSpinner';

const Wallet = () => {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ spent: 0, added: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            // Fetch profile separately to ensure it loads even if transactions fail
            try {
                const profileRes = await api.get('/auth/profile');
                setUser(profileRes.data.user);
            } catch (err) {
                console.error('Error fetching profile:', err);
                toast.error('Failed to load user profile');
            }

            // Fetch transactions separately
            try {
                const transRes = await api.get('/payment/transactions');
                const transactionsData = transRes.data.transactions || [];
                setTransactions(transactionsData);

                const currentStats = transactionsData.reduce((acc, t) => {
                    const amt = Number(t.amount) || 0;
                    if (t.type === 'credit') acc.added += amt;
                    if (t.type === 'debit') acc.spent += Math.abs(amt);
                    return acc;
                }, { spent: 0, added: 0 });
                setStats(currentStats);
            } catch (err) {
                console.error('Error fetching transactions:', err);
            }

        } catch (err) {
            console.error('Unexpected error in fetchWalletData:', err);
        } finally {
            setLoading(false);
        }
    };

    const [showAllTransactions, setShowAllTransactions] = useState(false);

    const handleAddMoney = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setActionLoading(true);
        if (!user) {
            toast.error('User profile not loaded. Please refresh.');
            setActionLoading(false);
            return;
        }

        try {
            const { data: order } = await api.post('/payment/create-order', {
                amount: parseFloat(amount)
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
                amount: order.amount,
                currency: order.currency,
                name: 'Safro Wallet',
                description: 'Add money to wallet',
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            ...response,
                            isWalletTopup: true
                        });
                        if (verifyRes.data.status === 'success') {
                            toast.success('Funds added successfully!');
                            fetchWalletData();
                            setShowAddMoney(false);
                            setAmount('');
                        }
                    } catch (err) {
                        toast.error('Verification failed');
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
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to initiate top-up';
            toast.error(errorMsg);
            console.error('Top-up initiation error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wallet</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your Safro credits and payments</p>
                    </div>
                    <AnimatedButton
                        onClick={() => setShowAddMoney(true)}
                        className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Add Money
                    </AnimatedButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <GlassCard className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden relative p-8 min-h-[200px] flex flex-col justify-between shadow-sm">
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Available Balance</p>
                            <h2 className="text-5xl font-black text-gray-900 dark:text-white">₹{(user?.walletBalance || 0).toLocaleString()}</h2>
                        </div>
                        <div className="relative z-10 flex gap-6 mt-6">
                            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Secure Payments
                            </div>
                            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm font-bold">
                                <RotateCcw className="w-4 h-4 text-amber-600" /> Instant Refunds
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-50 dark:bg-teal-900/20 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-50" />
                    </GlassCard>

                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <ArrowDownLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">₹{stats.spent.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Added</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">₹{stats.added.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Recent Transactions
                        </h3>
                        {transactions.length > 5 && (
                            <button 
                                onClick={() => setShowAllTransactions(!showAllTransactions)}
                                className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:text-teal-400 transition-colors"
                            >
                                {showAllTransactions ? 'Show Less' : 'View All'}
                            </button>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[164px]">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center h-full flex flex-col justify-center">
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No transactions yet</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your payments will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((t) => (
                                    <div key={t._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${t.type === 'credit' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                                {t.type === 'credit' ? <Plus size={16} /> : <ArrowDownLeft size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{t.description}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-black ${t.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {t.type === 'credit' ? '+' : '-'}₹{Math.abs(t.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Money Modal */}
            {showAddMoney && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Money</h2>
                            <button onClick={() => setShowAddMoney(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Enter the amount you wish to add to your Safro wallet.</p>
                        <div className="relative mb-8">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-teal-600 dark:text-teal-400">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-2xl py-5 pl-10 pr-6 text-3xl font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all font-mono"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[100, 500, 1000].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val.toString())}
                                    className="bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-gray-900 dark:text-white font-bold transition-all text-sm shadow-sm"
                                >
                                    +₹{val}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <AnimatedButton
                                onClick={handleAddMoney}
                                disabled={actionLoading}
                                className="w-full py-4 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                            >
                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Pay'}
                            </AnimatedButton>
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                            <AlertCircle size={10} /> Powered by Razorpay Secure
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
