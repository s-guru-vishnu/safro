import { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import './Admin.css';

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
        <div className="admin-page">
            <div className="page-header">
                <h2>Emergency Alerts</h2>
                <p>{alerts.length} alerts received</p>
            </div>

            {alerts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Shield size={48} className="text-gray-300" /></div>
                    <h3>No Active Alerts</h3>
                    <p>Emergency SOS alerts from riders will appear here in real-time</p>
                </div>
            ) : (
                <AnimatePresence>
                    {alerts.map((alert, idx) => (
                        <motion.div
                            key={idx}
                            className="alert-card"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="alert-header">
                                <span className="alert-user">
                                    <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
                                    {alert.userName} ({alert.role})
                                </span>
                                <span className="alert-time">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="alert-message">{alert.message}</p>
                            <div className="alert-details">
                                <span className="lex items-center gap-1"><Phone size={12} /> {alert.userPhone}</span>
                                {alert.location && (
                                    <span className="flex items-center gap-1">
                                        • <MapPin size={12} /> {alert.location.latitude?.toFixed(4)}, {alert.location.longitude?.toFixed(4)}
                                    </span>
                                )}
                                {alert.guardianPhone && ` • Guardian: ${alert.guardianPhone}`}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
};

export default Alerts;
