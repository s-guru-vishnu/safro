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
            className="bg-white dark:bg-gray-900 border border-teal-100/50 rounded-2xl p-5 mt-4 relative overflow-hidden shadow-sm ring-1 ring-black/5"
        >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-teal-50 dark:bg-teal-900/20 rounded-full blur-xl" />

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
                    <span className="text-teal-600 dark:text-teal-400 text-lg">💡</span>
                </div>
                <div>
                    <h4 className="text-gray-900 dark:text-white font-bold text-sm">AI Fare Insights</h4>
                    <span className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                        {source === 'ai' ? 'Powered by GROQ AI' : 'Algorithmic estimate'}
                    </span>
                </div>
            </div>

            {/* Fare Range */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-800"
                >
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Min</p>
                    <p className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">₹{minFare}</p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-teal-200 dark:border-teal-800 ring-1 ring-teal-100/50"
                >
                    <p className="text-teal-700 dark:text-teal-400 text-[10px] sm:text-xs mb-1 font-bold truncate w-full">Recommended</p>
                    <p className="text-teal-900 font-black text-lg sm:text-xl">₹{suggestedFare}</p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-50 dark:bg-gray-950 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-800"
                >
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Max</p>
                    <p className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">₹{maxFare}</p>
                </motion.div>
            </div>

            {/* Fare Range Bar */}
            <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-400 via-teal-500 to-gray-400 rounded-full"
                />
            </div>

            {/* Reasoning */}
            {reasoning && (
                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed flex items-start gap-1.5">
                    {reasoning}
                </p>
            )}
        </motion.div>
    );
};

export default AIFareCard;
