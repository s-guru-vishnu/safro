import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
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
                    <div className="empty-state-icon">🛡️</div>
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
                                    <FiAlertTriangle style={{ marginRight: '0.5rem' }} />
                                    {alert.userName} ({alert.role})
                                </span>
                                <span className="alert-time">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="alert-message">{alert.message}</p>
                            <div className="alert-details">
                                📞 {alert.userPhone}
                                {alert.location && ` • 📍 ${alert.location.latitude?.toFixed(4)}, ${alert.location.longitude?.toFixed(4)}`}
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
