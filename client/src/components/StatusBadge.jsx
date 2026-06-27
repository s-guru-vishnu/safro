const statusConfig = {
    requested: { label: 'Requested', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    negotiating: { label: 'Negotiating', className: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    accepted: { label: 'Accepted', className: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
    driver_arrived: { label: 'Driver Arrived', className: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
    otp_verified: { label: 'OTP Verified', className: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
    on_trip: { label: 'On Trip', className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
    completed: { label: 'Completed', className: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
    pending: { label: 'Pending', className: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    verified: { label: 'Verified', className: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    suspended: { label: 'Suspended', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${config.className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
};

export default StatusBadge;
