import { useState, useEffect } from 'react';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import mapService from '../services/mapService';
import { calculateDistance } from '../utils/distanceCalculator';
import MapView from './map/MapView';

const RideRequest = ({ onRideCreated }) => {
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [fare, setFare] = useState('');
    const [loading, setLoading] = useState(false);
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [distance, setDistance] = useState(0);
    const [crowdZoneAlert, setCrowdZoneAlert] = useState(null);

    // Geocode pickup
    const handlePickupBlur = async () => {
        if (!pickup) return;
        const results = await mapService.searchLocation(pickup);
        if (results.length > 0) {
            setPickupCoords({ lat: results[0].lat, lng: results[0].lng });
            // Check for crowd zones
            try {
                const czRes = await api.get(`/map/check-crowd-zones?lat=${results[0].lat}&lng=${results[0].lng}`);
                if (czRes.data.inZone) {
                    setCrowdZoneAlert(czRes.data.message);
                } else {
                    setCrowdZoneAlert(null);
                }
            } catch (err) {
                console.warn('CrowdZone check failed (non-blocking)');
            }
        }
    };

    // Geocode drop
    const handleDropBlur = async () => {
        if (!drop) return;
        const results = await mapService.searchLocation(drop);
        if (results.length > 0) {
            setDropCoords({ lat: results[0].lat, lng: results[0].lng });
        }
    };

    // Auto-calculate distance
    useEffect(() => {
        if (pickupCoords && dropCoords) {
            const dist = calculateDistance(pickupCoords, dropCoords);
            setDistance(dist);
            // Dynamic fare suggestion base (e.g., ₹20/km)
            if (!fare) setFare(Math.max(50, Math.round(dist * 25)));
        }
    }, [pickupCoords, dropCoords]);

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
                pickupLocation: {
                    address: pickup,
                    coordinates: pickupCoords ? { lat: pickupCoords.lat, lng: pickupCoords.lng } : { lat: 0, lng: 0 }
                },
                dropLocation: {
                    address: drop,
                    coordinates: dropCoords ? { lat: dropCoords.lat, lng: dropCoords.lng } : { lat: 0, lng: 0 }
                },
                proposedFare: fare,
                distance: `${distance || 0} km`,
                duration: `${Math.round((distance || 0) * 3)} mins` // Simple Estimate
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
                        onBlur={handlePickupBlur}
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
                        onBlur={handleDropBlur}
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
                        <>Request Negotiation {distance > 0 && `(${distance}km)`} <FiNavigation size={14} /></>
                    )}
                </button>
            </form>

            {/* Map Preview (Only if coordinates exist) */}
            {(pickupCoords || dropCoords) && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Route Preview</span>
                        {distance > 0 && (
                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                {distance} km
                            </span>
                        )}
                    </div>
                    <div className="h-40 rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                        <MapView
                            pickupCoordinates={pickupCoords}
                            dropCoordinates={dropCoords}
                        />
                    </div>
                </div>
            )}

            {crowdZoneAlert && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2">
                    <FiMapPin className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                        <span className="font-bold">Smart Pickup Tip:</span> {crowdZoneAlert}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default RideRequest;
