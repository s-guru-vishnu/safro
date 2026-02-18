import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiBell, FiArrowRight } from 'react-icons/fi';
import OnboardingNavbar from '../../components/OnboardingNavbar';

const checkItems = [
    { icon: FiCheckCircle, text: 'Documents received successfully', color: 'text-green-500' },
    { icon: FiClock, text: 'Under Admin Review', color: 'text-amber-500' },
    { icon: FiBell, text: 'You\'ll be notified once your account is activated', color: 'text-teal-500' },
];

const DriverSubmitted = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <OnboardingNavbar />

            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <FiCheckCircle size={40} className="text-green-500" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-2"
                >
                    Application Submitted!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-500 mb-8"
                >
                    Thank you for applying to become a Safro driver. Our admin team will review your documents shortly.
                </motion.p>

                {/* Checklist */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left space-y-4 mb-8">
                    {checkItems.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.15 }}
                            className="flex items-center gap-3"
                        >
                            <item.icon size={20} className={item.color} />
                            <span className="text-sm text-gray-700">{item.text}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Branding message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-8"
                >
                    <p className="text-sm text-teal-700 font-medium">
                        "Safro ensures all drivers are verified by our admin team to maintain trust and safety."
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
                    >
                        Back to Home <FiArrowRight size={14} />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default DriverSubmitted;
