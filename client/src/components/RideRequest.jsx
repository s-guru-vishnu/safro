import { useState } from 'react';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const RideRequest = ({ onRideCreated }) => {
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [fare, setFare] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check for active ride first
            const activeRes = await api.get('/rides/active');
            if (activeRes.data.ride) {
                toast.error('You already have an active ride.');
                setLoading(false);
                return;
            }

            // Get browser geolocation
            let coords = { lat: 0, lng: 0 };
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
                coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            } catch (geoErr) {
                console.warn('Geolocation unavailable, using defaults:', geoErr.message);
            }

            const res = await api.post('/rides/request', {
                pickupLocation: { address: pickup, coordinates: coords },
                dropLocation: { address: drop, coordinates: coords },
                proposedFare: fare,
                distance: '5 km',
                duration: '15 mins'
            });

            toast.success('Ride requested! Waiting for drivers...');
            if (onRideCreated) onRideCreated(res.data);

            setPickup('');
            setDrop('');
            setFare('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request ride');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FiNavigation className="text-teal-600" />
                Request a Ride
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-3.5 text-teal-600" size={16} />
                    <input
                        type="text"
                        placeholder="Pickup Location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
                        required
                    />
                </div>

                <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-3.5 text-red-500" size={16} />
                    <input
                        type="text"
                        placeholder="Drop Location"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
                        required
                    />
                </div>

                <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-500 text-sm font-semibold">₹</span>
                    <input
                        type="number"
                        placeholder="Propose your fare"
                        value={fare}
                        onChange={(e) => setFare(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md flex justify-center items-center gap-2"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>Request Negotiation <FiNavigation size={14} /></>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default RideRequest;
