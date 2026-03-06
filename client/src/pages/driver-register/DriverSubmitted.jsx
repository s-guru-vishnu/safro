import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiBell, FiArrowRight, FiInfo, FiAlertCircle } from 'react-icons/fi';
import OnboardingNavbar from '../../components/OnboardingNavbar';
import api from '../../services/api';

const DriverSubmitted = () => {
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/auth/application-status');
                if (res.data.applications && res.data.applications.length > 0) {
                    setStatus(res.data.applications[0].status);
                }
            } catch (err) {
                console.error('Failed to fetch status:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'pending':
                return {
                    title: 'Application Submitted!',
                    desc: 'Admin team will review your documents shortly.',
                    icon: <FiCheckCircle size={40} className="text-green-500" />,
                    iconBg: 'bg-green-100',
                    items: [
                        { icon: FiCheckCircle, text: 'Documents received successfully', color: 'text-green-500' },
                        { icon: FiClock, text: 'Wait for Admin Review', color: 'text-amber-500' },
                        { icon: FiBell, text: 'Verification in progress', color: 'text-teal-500' },
                    ]
                };
            case 'under_review':
                return {
                    title: 'Under Review',
                    desc: 'Your documents are currently being verified by our team.',
                    icon: <FiClock size={40} className="text-amber-500" />,
                    iconBg: 'bg-amber-100',
                    items: [
                        { icon: FiCheckCircle, text: 'Documents received', color: 'text-green-500' },
                        { icon: FiInfo, text: 'Team is checking your details', color: 'text-blue-500' },
                        { icon: FiBell, text: 'Check back soon', color: 'text-teal-500' },
                    ]
                };
            case 'meeting_scheduled':
                return {
                    title: 'Meeting Scheduled',
                    desc: 'Great! An admin has scheduled a verification meeting with you.',
                    icon: <FiCalendar size={40} className="text-blue-500" />,
                    iconBg: 'bg-blue-100',
                    items: [
                        { icon: FiCheckCircle, text: 'Documents verified', color: 'text-green-500' },
                        { icon: FiCalendar, text: 'Meeting is scheduled', color: 'text-blue-500' },
                        { icon: FiBell, text: 'Check your email/phone for details', color: 'text-teal-500' },
                    ]
                };
            case 'rejected':
                return {
                    title: 'Application Rejected',
                    desc: 'Unfortunately, your application was not approved at this time.',
                    icon: <FiAlertCircle size={40} className="text-red-500" />,
                    iconBg: 'bg-red-100',
                    items: [
                        { icon: FiAlertCircle, text: 'Application rejected', color: 'text-red-500' },
                        { icon: FiInfo, text: 'Contact support for details', color: 'text-gray-500' },
                    ]
                };
            default:
                return {
                    title: 'Application Status',
                    desc: 'We are processing your application.',
                    icon: <FiClock size={40} className="text-teal-500" />,
                    iconBg: 'bg-teal-100',
                    items: [
                        { icon: FiClock, text: 'Status: ' + status, color: 'text-teal-500' },
                    ]
                };
        }
    };

    const config = getStatusConfig();

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <OnboardingNavbar />

            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                    {config.icon}
                </motion.div>

                <motion.h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {config.title}
                </motion.h1>

                <motion.p className="text-gray-500 mb-8">
                    {config.desc}
                </motion.p>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left space-y-4 mb-8">
                    {config.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <item.icon size={20} className={item.color} />
                            <span className="text-sm text-gray-700">{item.text}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-8">
                    <p className="text-sm text-teal-700 font-medium">
                        "Safro ensures all drivers are verified by our admin team to maintain trust and safety."
                    </p>
                </div>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
                >
                    Back to Home <FiArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
};

const FiCalendar = ({ size, className }) => (
    <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        height={size}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

export default DriverSubmitted;
