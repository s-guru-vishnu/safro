import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiCheck, FiClock, FiDollarSign, FiMapPin } from 'react-icons/fi';
import AISuggestionBubble from './AISuggestionBubble';
import io from 'socket.io-client';

const NegotiationChat = ({ ride, onComplete }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [offerAmount, setOfferAmount] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [timer, setTimer] = useState(300);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const chatEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!ride?._id) return;

        socketRef.current = io('http://localhost:5001');
        socketRef.current.emit('joinRide', { rideId: ride._id });

        socketRef.current.on('receiveOffer', (data) => {
            setMessages(prev => [...prev, data]);
            if (data.type === 'accept') {
                setAgreed(true);
            }
        });

        socketRef.current.on('aiSuggestion', (data) => {
            if (data.rideId === ride._id) {
                setAiSuggestion(data);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [ride?._id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (agreed || timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [agreed, timer]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleSendOffer = (e) => {
        e.preventDefault();
        if (!offerAmount || agreed) return;

        const msg = {
            rideId: ride._id,
            sender: user._id,
            role: user.role,
            amount: parseFloat(offerAmount),
            type: 'offer',
            timestamp: new Date().toISOString()
        };

        socketRef.current.emit('sendOffer', msg);
        setMessages(prev => [...prev, msg]);
        setOfferAmount('');
    };

    const handleAccept = () => {
        if (messages.length === 0) return;
        const lastOffer = [...messages].reverse().find(m => m.type === 'offer');
        if (!lastOffer) return;

        const msg = {
            rideId: ride._id,
            sender: user._id,
            role: user.role,
            amount: lastOffer.amount,
            type: 'accept',
            timestamp: new Date().toISOString()
        };

        socketRef.current.emit('sendOffer', msg);
        setMessages(prev => [...prev, msg]);
        setAgreed(true);
        if (onComplete) onComplete(lastOffer.amount);
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
                        <h3 className="text-sm font-bold text-gray-900">Negotiation</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {ride?.pickupLocation?.address} → {ride?.dropLocation?.address}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${agreed ? 'bg-green-100 text-green-700' :
                        timer <= 60 ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {agreed ? <FiCheck size={12} /> : <FiClock size={12} />}
                        {agreed ? 'Agreed' : formatTime(timer)}
                    </div>
                </div>

                {ride?.proposedFare > 0 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded-lg border border-gray-200">
                        <FiDollarSign className="text-teal-600" size={14} />
                        <span className="text-xs text-gray-500">Proposed fare:</span>
                        <span className="text-sm font-bold text-gray-900">₹{ride.proposedFare}</span>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        <p>Send the first offer to start negotiating</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, i) => {
                        const isOwn = msg.sender === user._id;
                        const isAccept = msg.type === 'accept';

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[240px] px-4 py-2.5 rounded-xl text-sm ${isAccept
                                    ? 'bg-green-100 text-green-700 border border-green-200 font-bold'
                                    : isOwn
                                        ? 'bg-gray-900 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                    }`}>
                                    {isAccept ? (
                                        <span className="flex items-center gap-1.5">
                                            <FiCheck size={14} /> Deal! ₹{msg.amount}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-xs opacity-70 capitalize">{msg.role}</span>
                                            <p className="font-bold mt-0.5">₹{msg.amount}</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={chatEndRef} />
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && !agreed && (
                <AISuggestionBubble
                    suggestion={aiSuggestion}
                    onDismiss={() => setAiSuggestion(null)}
                />
            )}

            {/* Input Area */}
            {!agreed ? (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <form onSubmit={handleSendOffer} className="flex gap-2">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">₹</span>
                            <input
                                type="number"
                                placeholder="Your offer"
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5"
                        >
                            <FiSend size={14} /> Send
                        </button>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={handleAccept}
                                className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all flex items-center gap-1.5"
                            >
                                <FiCheck size={14} /> Accept
                            </button>
                        )}
                    </form>
                </div>
            ) : (
                <div className="px-4 py-4 bg-green-50 border-t border-green-100 text-center">
                    <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2">
                        <FiCheck /> Price agreed! Ride confirmed.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default NegotiationChat;
