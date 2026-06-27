import { FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';

const SplitFareStatus = ({ splitFare }) => {
    if (!splitFare) return null;

    const accepted = splitFare.passengers?.filter(p => p.inviteStatus === 'accepted') || [];
    const paid = accepted.filter(p => p.paymentStatus === 'paid');
    const progress = accepted.length > 0 ? (paid.length / accepted.length) * 100 : 0;
    const isSettled = splitFare.status === 'settled';

    return (
        <div className={`rounded-xl p-4 border ${isSettled ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/30'}`}>
            <div className="flex items-center gap-2 mb-3">
                <FiUsers size={14} className={isSettled ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isSettled ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
                    Split Fare {isSettled ? '— Settled' : ''}
                </span>
            </div>

            {/* Avatars Row */}
            <div className="flex items-center gap-1 mb-3">
                {accepted.map((p, i) => (
                    <div
                        key={p._id || i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            p.paymentStatus === 'paid'
                                ? 'bg-emerald-500 text-white border-emerald-300 dark:border-emerald-600'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                        title={`${p.name} — ₹${p.amount} ${p.paymentStatus === 'paid' ? '✓' : '⏳'}`}
                    >
                        {p.paymentStatus === 'paid' ? <FiCheckCircle size={14} /> : (p.name || '?')[0].toUpperCase()}
                    </div>
                ))}
                {accepted.length === 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">No passengers yet</span>
                )}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isSettled ? 'bg-emerald-500' : 'bg-violet-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {paid.length}/{accepted.length} paid
                </span>
            </div>

            {/* Individual amounts */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {accepted.map((p, i) => (
                    <span
                        key={p._id || i}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.paymentStatus === 'paid'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        {(p.name || 'User').split(' ')[0]}: ₹{p.amount} {p.paymentStatus === 'paid' ? '✓' : ''}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default SplitFareStatus;
