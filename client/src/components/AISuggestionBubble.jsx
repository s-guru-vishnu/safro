import { motion, AnimatePresence } from 'framer-motion';

const AISuggestionBubble = ({ suggestion, onDismiss }) => {
    if (!suggestion || !suggestion.compromise) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative my-3 mx-auto max-w-xs"
            >
                <div className="relative bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-md -z-10" />

                    {/* Content */}
                    <div className="flex items-center gap-2">
                        <motion.span
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="text-xl shrink-0"
                        >
                            💡
                        </motion.span>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-xs">AI Suggests</p>
                            <p className="text-white font-bold text-lg">₹{suggestion.compromise}</p>
                        </div>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-white/40 hover:text-white/80 text-sm transition-colors p-1"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {suggestion.explanation && (
                        <p className="text-white/50 text-xs mt-1.5 pl-8 leading-relaxed">
                            {suggestion.explanation}
                        </p>
                    )}

                    {/* Pointing arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-600/90 rotate-45 border-r border-b border-indigo-400/30" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AISuggestionBubble;
