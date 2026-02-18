import { motion } from 'framer-motion';

const AIFareCard = ({ prediction, loading }) => {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-4 mt-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-400/30 animate-pulse" />
                    <span className="text-indigo-300 text-sm font-medium">AI analyzing fare...</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-700/30 rounded-xl animate-pulse" />
                    ))}
                </div>
            </motion.div>
        );
    }

    if (!prediction || !prediction.suggestedFare) return null;

    const { minFare, suggestedFare, maxFare, reasoning, source } = prediction;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-5 mt-4 relative overflow-hidden"
        >
            {/* Sparkle decoration */}
            <div className="absolute top-2 right-3 text-yellow-400 text-lg animate-pulse">✨</div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                </div>
                <div>
                    <h4 className="text-white font-semibold text-sm">AI Fare Insights</h4>
                    <span className="text-indigo-300/60 text-xs capitalize">
                        {source === 'ai' ? 'Powered by GROQ AI' : 'Algorithmic estimate'}
                    </span>
                </div>
            </div>

            {/* Fare Range */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30"
                >
                    <p className="text-gray-400 text-xs mb-1">Min</p>
                    <p className="text-green-400 font-bold text-lg">₹{minFare}</p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-indigo-600/20 rounded-xl p-3 text-center border border-indigo-500/40 ring-1 ring-indigo-500/20"
                >
                    <p className="text-indigo-300 text-xs mb-1 font-medium">Recommended</p>
                    <p className="text-white font-bold text-xl">₹{suggestedFare}</p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30"
                >
                    <p className="text-gray-400 text-xs mb-1">Max</p>
                    <p className="text-orange-400 font-bold text-lg">₹{maxFare}</p>
                </motion.div>
            </div>

            {/* Fare Range Bar */}
            <div className="relative h-2 bg-gray-700/50 rounded-full mb-3 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-indigo-500 to-orange-500 rounded-full"
                />
            </div>

            {/* Reasoning */}
            {reasoning && (
                <p className="text-gray-400 text-xs leading-relaxed flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5 shrink-0">💡</span>
                    {reasoning}
                </p>
            )}
        </motion.div>
    );
};

export default AIFareCard;
