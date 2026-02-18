import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const AdminAIInsights = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const { data } = await api.get('/admin/ai-insights');
                setInsights(data);
            } catch (err) {
                console.error('Failed to load AI insights:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-gray-800/50 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!insights) return null;

    const cards = [
        {
            label: 'Avg Negotiated Fare',
            value: `₹${insights.avgNegotiatedFare || 0}`,
            sub: `${insights.totalCompletedRides || 0} rides`,
            icon: '💰',
            color: 'from-emerald-50 to-emerald-100/50',
            border: 'border-emerald-200',
            textColor: 'text-emerald-700'
        },
        {
            label: 'AI Flagged Rides',
            value: insights.flaggedRides || 0,
            sub: 'Last 30 days',
            icon: '⚠️',
            color: insights.flaggedRides > 0 ? 'from-red-50 to-red-100/50' : 'from-gray-50 to-gray-100/50',
            border: insights.flaggedRides > 0 ? 'border-red-200' : 'border-gray-200',
            textColor: insights.flaggedRides > 0 ? 'text-red-700' : 'text-gray-700'
        },
        {
            label: 'Lowball Offers',
            value: insights.lowballOffers || 0,
            sub: '<50% of AI suggested',
            icon: '📉',
            color: 'from-amber-50 to-amber-100/50',
            border: 'border-amber-200',
            textColor: 'text-amber-700'
        },
        {
            label: 'Top Driver',
            value: insights.topDrivers?.[0]?.name || 'N/A',
            sub: insights.topDrivers?.[0]
                ? `${insights.topDrivers[0].completedRides} rides • ₹${insights.topDrivers[0].avgFare} avg`
                : 'No data',
            icon: '🏆',
            color: 'from-indigo-50 to-indigo-100/50',
            border: 'border-indigo-200',
            textColor: 'text-indigo-700'
        }
    ];

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧠</span>
                <h3 className="text-gray-900 font-bold text-lg">AI Insights</h3>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider">30 days</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-4 shadow-sm`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{card.icon}</span>
                        </div>
                        <p className={`${card.textColor} font-bold text-xl truncate`}>{card.value}</p>
                        <p className="text-gray-900 font-semibold text-xs mt-1">{card.label}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{card.sub}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdminAIInsights;
