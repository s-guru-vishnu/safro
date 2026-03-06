import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const SocketContext = createContext({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, token } = useAuth();

    useEffect(() => {
        if (user && token) {
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                auth: { token } // JWT for server-side validation
            });

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected:', newSocket.id);
                setIsConnected(true);
                newSocket.emit('joinRoom', { userId: user._id, role: user.role });
            });

            newSocket.on('reconnect', () => {
                console.log('🔄 Socket reconnected:', newSocket.id);
                setIsConnected(true);
                newSocket.emit('joinRoom', { userId: user._id, role: user.role });
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.warn('⚠️ Socket connection error:', err.message);
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
