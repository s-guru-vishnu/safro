const statusConfig = {
    requested: { label: 'Requested', className: 'bg-blue-50 text-blue-600' },
    negotiating: { label: 'Negotiating', className: 'bg-yellow-50 text-yellow-600' },
    accepted: { label: 'Accepted', className: 'bg-teal-50 text-teal-600' },
    driver_arrived: { label: 'Driver Arrived', className: 'bg-purple-50 text-purple-600' },
    otp_verified: { label: 'OTP Verified', className: 'bg-indigo-50 text-indigo-600' },
    on_trip: { label: 'On Trip', className: 'bg-orange-50 text-orange-600' },
    completed: { label: 'Completed', className: 'bg-green-50 text-green-600' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600' },
    pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-600' },
    verified: { label: 'Verified', className: 'bg-green-50 text-green-600' },
    suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600' },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-500' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${config.className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
};

export default StatusBadge;
