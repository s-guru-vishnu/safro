import { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('sosAlert', (data) => {
                setAlerts(prev => [data, ...prev]);
            });
            return () => socket.off('sosAlert');
        }
    }, [socket]);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Alerts</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alerts.length} alerts received</p>
                </div>

                {alerts.length === 0 ? (
                    <div className="text-center py-20">
                        <Shield size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Alerts</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Emergency SOS alerts from riders will appear here in real-time</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {alerts.map((alert, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 shadow-sm p-5"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                                            <AlertTriangle size={16} />
                                            {alert.userName} ({alert.role})
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{alert.message}</p>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1"><Phone size={12} /> {alert.userPhone}</span>
                                        {alert.location && (
                                            <span className="flex items-center gap-1">
                                                • <MapPin size={12} /> {alert.location.latitude?.toFixed(4)}, {alert.location.longitude?.toFixed(4)}
                                            </span>
                                        )}
                                        {alert.guardianPhone && <span>• Guardian: {alert.guardianPhone}</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
