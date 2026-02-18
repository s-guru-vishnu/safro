import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiShield, FiPhone, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

const SOS = () => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSOS = async () => {
        setSending(true);
        try {
            let location = null;
            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                }).catch(() => null);
                if (pos) {
                    location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                }
            }

            await api.post('/emergency/sos', {
                location,
                message: 'Emergency SOS triggered!'
            });
            setSent(true);
        } catch (err) {
            console.error('SOS error:', err);
        } finally {
            setSending(false);
        }
    };

    const tips = [
        { icon: FiPhone, text: 'Call 112 for national emergency helpline' },
        { icon: FiMapPin, text: 'Share your live location with a trusted contact' },
        { icon: FiShield, text: 'Stay in a public area while waiting for help' },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center py-8">
            <div className="max-w-sm w-full mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 p-8 text-center"
                >
                    {/* Pulsing Icon */}
                    <div className="relative mx-auto w-20 h-20 mb-6">
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-red-200 rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
                            className="absolute inset-1 bg-red-300 rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                <FiAlertTriangle size={24} className="text-white" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Emergency SOS</h2>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Press the button to alert your guardian and our safety team with your live location.
                    </p>

                    <button
                        onClick={handleSOS}
                        disabled={sending || sent}
                        className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${sent
                                ? 'bg-green-500 text-white cursor-default'
                                : sending
                                    ? 'bg-red-400 text-white cursor-wait'
                                    : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] shadow-md hover:shadow-lg'
                            }`}
                    >
                        {sending ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending Alert...
                            </span>
                        ) : sent ? (
                            <span className="flex items-center justify-center gap-2">
                                <FiCheckCircle size={16} /> Alert Sent Successfully
                            </span>
                        ) : (
                            '🚨  SEND SOS ALERT'
                        )}
                    </button>

                    {sent && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl p-3"
                        >
                            Your emergency alert has been sent to your guardian and our safety team.
                        </motion.p>
                    )}
                </motion.div>

                {/* Safety Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 bg-white rounded-2xl border border-gray-200 p-5"
                >
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Safety Tips</h3>
                    <div className="space-y-3">
                        {tips.map((tip, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                    <tip.icon size={14} className="text-gray-400" />
                                </div>
                                <span className="text-sm text-gray-600">{tip.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SOS;
