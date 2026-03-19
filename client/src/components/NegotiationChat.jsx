import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiCheck, FiClock, FiDollarSign, FiMessageCircle, FiXCircle } from 'react-icons/fi';
import AISuggestionBubble from './AISuggestionBubble';
import api from '../services/api';
import toast from 'react-hot-toast';

const NegotiationChat = ({ ride: initialRide, onRideUpdate }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [activeRide, setActiveRide] = useState(initialRide);
    const [offerAmount, setOfferAmount] = useState(initialRide?.fare?.proposed || initialRide?.proposedFare || '');
    const [textMessage, setTextMessage] = useState('');
    const [inputMode, setInputMode] = useState('message'); // Default to message (Chat-First)
    const [timer, setTimer] = useState(300);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    const isConfirmed = activeRide?.status === 'confirmed' || activeRide?.status === 'ongoing';

    // 1. Fetch history and sync state on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/negotiation/${initialRide._id}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch negotiation history:', err);
                toast.error('Failed to load chat history');
            } finally {
                setLoading(false);
            }
        };

        if (initialRide?._id) {
            fetchHistory();
            if (socket) {
                // Join ride room and request full resync
                socket.emit('joinRide', { rideId: initialRide._id });
                socket.emit('resyncRide', { rideId: initialRide._id });
            }
        }
    }, [initialRide?._id, socket]);

    // 2. Socket Listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewOffer = (negotiation) => {
            setMessages(prev => {
                // Avoid duplicate if we just sent it
                if (prev.some(m => m._id === negotiation._id)) return prev;
                return [...prev, negotiation];
            });
            // If it's from someone else, notify/vibrate? (Optional UI polish)
        };

        const handleNewMessage = (negotiation) => {
            setMessages(prev => {
                if (prev.some(m => m._id === negotiation._id)) return prev;
                return [...prev, negotiation];
            });
        };

        const handleOfferAccepted = ({ negotiation, ride }) => {
            setMessages(prev => {
                return prev.map(m =>
                    m._id === negotiation._id ? { ...m, status: 'accepted' } : m
                );
            });
            setActiveRide(ride);
            if (onRideUpdate) onRideUpdate(ride);
            toast.success('Price agreed! Ride confirmed.');
        };

        const handleRideResync = ({ ride, messages: history }) => {
            setActiveRide(ride);
            setMessages(history);
            if (onRideUpdate) onRideUpdate(ride);
        };

        const handleAiSuggestion = (data) => {
            if (data.rideId === activeRide?._id) {
                setAiSuggestion(data);
            }
        };

        socket.on('newOffer', handleNewOffer);
        socket.on('newMessage', handleNewMessage);
        socket.on('offerAccepted', handleOfferAccepted);
        socket.on('rideResync', handleRideResync);
        socket.on('aiSuggestion', handleAiSuggestion);

        return () => {
            socket.off('newOffer', handleNewOffer);
            socket.off('newMessage', handleNewMessage);
            socket.off('offerAccepted', handleOfferAccepted);
            socket.off('rideResync', handleRideResync);
            socket.off('aiSuggestion', handleAiSuggestion);
        };
    }, [socket, activeRide?._id, onRideUpdate]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isConfirmed || timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [isConfirmed, timer]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleSendOffer = async (e) => {
        if (e) e.preventDefault();
        if (!offerAmount || isConfirmed) return;

        try {
            const amount = parseFloat(offerAmount);
            await api.post('/negotiation/offer', {
                rideId: activeRide._id,
                amount,
                type: 'offer'
            });
            setOfferAmount('');
            setInputMode('message');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send offer');
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!textMessage.trim()) return;

        try {
            await api.post('/negotiation/offer', {
                rideId: activeRide._id,
                text: textMessage.trim(),
                type: 'message'
            });
            setTextMessage('');
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    const handleAcceptOffer = async (negotiationId) => {
        if (isConfirmed) return;
        try {
            const res = await api.put(`/negotiation/accept/${negotiationId}`);
            setActiveRide(res.data.ride);
            if (onRideUpdate) onRideUpdate(res.data.ride);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept offer');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[550px]"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Live Negotiation</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {activeRide?.pickupLocation?.address} → {activeRide?.dropLocation?.address}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isConfirmed ? 'bg-green-100 text-green-700' :
                        timer <= 60 ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {isConfirmed ? <FiCheck size={12} /> : <FiClock size={12} />}
                        {isConfirmed ? 'Confirmed' : formatTime(timer)}
                    </div>
                </div>

                {activeRide?.negotiatedFare > 0 ? (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                        <FiCheck className="text-green-600" size={14} />
                        <span className="text-xs text-green-700">Final Price:</span>
                        <span className="text-sm font-bold text-green-900">₹{activeRide.negotiatedFare}</span>
                    </div>
                ) : activeRide?.fare?.proposed > 0 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded-lg border border-gray-200">
                        <FiDollarSign className="text-teal-600" size={14} />
                        <span className="text-xs text-gray-500">Original Budget:</span>
                        <span className="text-sm font-bold text-gray-900">₹{activeRide.fare.proposed}</span>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
                        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs">Loading history...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        <p>Ask a question or make an offer to start</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg, i) => {
                            const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                            const isOffer = msg.type === 'offer';
                            const isAccepted = msg.status === 'accepted';

                            return (
                                <motion.div
                                    key={msg._id || i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${isOwn
                                        ? 'bg-gray-900 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                        } ${isOffer && isAccepted ? 'border-2 border-green-500 !bg-green-50 !text-green-900 ring-4 ring-green-100' : ''} ${isOffer ? 'min-w-[260px]' : ''}`}>

                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {isOwn ? 'You' : (msg.sender?.name || msg.role)}
                                            </span>
                                            <span className="text-[10px] opacity-40">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {isOffer ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 py-1">
                                                    <div className={`p-2 rounded-lg ${isOwn ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                                                        <FiDollarSign className={isOwn ? 'text-teal-400' : 'text-teal-600'} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] opacity-60 font-medium">FARE OFFER</p>
                                                        <p className="text-lg font-bold">₹{msg.amount}</p>
                                                    </div>
                                                </div>

                                                {/* Inline Actions for recipient if offer is active */}
                                                {!isOwn && msg.status === 'active' && !isConfirmed && (
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={() => handleAcceptOffer(msg._id)}
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <FiCheck size={14} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setInputMode('offer');
                                                                setOfferAmount(msg.amount);
                                                            }}
                                                            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 text-xs font-bold py-2 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <FiDollarSign size={14} /> Negotiate
                                                        </button>
                                                    </div>
                                                )}

                                                {isAccepted && (
                                                    <div className="flex items-center justify-center gap-1 bg-green-600 text-white text-[10px] font-black py-1 rounded-md mt-1 italic uppercase tracking-widest">
                                                        <FiCheck /> Agreed & Locked
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && !isConfirmed && (
                <AISuggestionBubble
                    suggestion={aiSuggestion}
                    onDismiss={() => setAiSuggestion(null)}
                />
            )}

            {/* Input Area */}
            {!isConfirmed ? (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-col gap-3">
                        {/* Tab Switcher */}
                        <div className="flex bg-gray-200 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setInputMode('message')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode === 'message' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FiMessageCircle size={14} /> Chat
                            </button>
                            <button
                                onClick={() => setInputMode('offer')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode === 'offer' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FiDollarSign size={14} /> Make Offer
                            </button>
                        </div>

                        {inputMode === 'message' ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ask about distance, time, bags..."
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none placeholder:text-gray-400"
                                />
                                <button
                                    type="submit"
                                    className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
                                >
                                    <FiSend size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <form onSubmit={handleSendOffer} className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Enter your final offer"
                                            value={offerAmount}
                                            onChange={(e) => setOfferAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-white border-2 border-teal-500 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-200 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center gap-2"
                                    >
                                        <FiDollarSign /> Send Offer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('message')}
                                        className="bg-gray-200 text-gray-600 p-3 rounded-xl hover:bg-gray-300"
                                    >
                                        <FiXCircle size={20} />
                                    </button>
                                </form>
                                <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                                    Send an offer only when you're ready to lock the price
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-green-50 border-t border-green-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <FiCheck className="text-green-600" size={24} />
                    </div>
                    <h4 className="text-green-900 font-bold">Booking Confirmed at ₹{activeRide?.negotiatedFare}</h4>
                    <p className="text-green-700 text-xs mt-1">Please proceed to the pickup location. Live chat remains active.</p>

                    {/* Chat remains available for messages even after confirmation */}
                    <div className="w-full mt-4">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Message for coordination..."
                                value={textMessage}
                                onChange={(e) => setTextMessage(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-green-200 rounded-lg text-sm focus:ring-1 focus:ring-green-400 outline-none"
                            />
                            <button type="submit" className="bg-green-600 text-white p-2 rounded-lg">
                                <FiSend size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default NegotiationChat;
