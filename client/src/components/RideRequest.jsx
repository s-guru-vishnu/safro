import { useState, useEffect } from 'react';
import { FiMapPin, FiNavigation, FiHome, FiBriefcase, FiStar, FiClock, FiCalendar, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { reverseGeocode } from '../services/locationService';
import { calculateDistance } from '../utils/distanceCalculator';
import LocationAutocomplete from './map/LocationAutocomplete';
import { useFavorites } from '../hooks/useFavorites';
import SplitFareModal from './SplitFareModal';

const RideRequest = ({ onRideCreated, onCoordsChange }) => {
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [fare, setFare] = useState('');
    const [loading, setLoading] = useState(false);
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [distance, setDistance] = useState(0);
    const [crowdZoneAlert, setCrowdZoneAlert] = useState(null);
    const [activeInput, setActiveInput] = useState('pickup');
    const [estimateData, setEstimateData] = useState(null);

    const { favorites } = useFavorites();

    // Schedule mode
    const [mode, setMode] = useState('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Split fare
    const [splitEnabled, setSplitEnabled] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [createdRideId, setCreatedRideId] = useState(null);

    // Auto-detect current location for pickup on mount
    useEffect(() => {
        if (!pickup && !pickupCoords) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setPickupCoords({ lat: latitude, lng: longitude });
                    try {
                        const loc = await reverseGeocode(latitude, longitude);
                        if (loc) {
                            setPickup(loc.name || loc.address || 'Current Location');
                        } else {
                            setPickup('Current Location');
                        }
                    } catch {
                        setPickup('Current Location');
                    }
                },
                (err) => {
                    console.warn('Geolocation not available:', err.message);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    }, []);

    // Notify parent of coordinate changes so main map can show route preview
    useEffect(() => {
        if (onCoordsChange) {
            onCoordsChange({ pickupCoords, dropCoords });
        }
    }, [pickupCoords, dropCoords]);

    const handlePickupSelect = (place) => {
        setPickup(place.name || place.address);
        setPickupCoords({ lat: place.lat, lng: place.lng });
        setActiveInput('drop');
    };

    const handleDropSelect = (place) => {
        setDrop(place.name || place.address);
        setDropCoords({ lat: place.lat, lng: place.lng });
    };

    // Auto-calculate distance
    useEffect(() => {
        const fetchEstimate = async () => {
            if (pickupCoords && dropCoords) {
                try {
                    const res = await api.post('/rides/estimate', {
                        pickup: pickupCoords,
                        drop: dropCoords
                    });
                    setDistance(res.data.distanceKm);
                    setEstimateData(res.data);
                    if (!fare) {
                        setFare(res.data.estimatedFare);
                    }
                } catch (err) {
                    console.warn("Failed to fetch estimate, falling back:", err);
                    const dist = calculateDistance(pickupCoords, dropCoords);
                    setDistance(dist);
                    setEstimateData(null);
                    if (!fare) setFare(Math.max(50, Math.round(dist * 25)));
                }
            }
        };
        fetchEstimate();
    }, [pickupCoords, dropCoords]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'schedule') {
                if (!scheduleDate || !scheduleTime) {
                    toast.error('Please select a date and time for scheduling.');
                    setLoading(false);
                    return;
                }
                const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`);
                await api.post('/rides/schedule', {
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
                    duration: estimateData?.durationMin ? `${estimateData.durationMin} mins` : `${Math.round((distance || 0) * 3)} mins`,
                    scheduledTime: scheduledTime.toISOString()
                });

                toast.success('Ride scheduled successfully! 🗓️');
                setPickup(''); setDrop(''); setFare(''); setScheduleDate(''); setScheduleTime('');
                setPickupCoords(null); setDropCoords(null);
                setMode('now');
                return;
            }

            // Book Now mode
            const activeRes = await api.get('/rides/active');
            if (activeRes.data.ride) {
                toast.error('You already have an active ride.');
                setLoading(false);
                return;
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
                duration: estimateData?.durationMin ? `${estimateData.durationMin} mins` : `${Math.round((distance || 0) * 3)} mins`
            });

            toast.success('Ride requested! Waiting for drivers...');
            if (onRideCreated) onRideCreated(res.data.ride);

            // Open split modal if enabled
            if (splitEnabled) {
                setCreatedRideId(res.data.ride._id);
                setShowSplitModal(true);
            }

            setPickup('');
            setDrop('');
            setFare('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request ride');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSelect = (fav) => {
        const loc = {
            name: fav.label === 'Custom' ? fav.customName : fav.label,
            address: fav.address,
            lat: fav.coordinates.lat,
            lng: fav.coordinates.lng
        };
        if (activeInput === 'pickup') {
            setPickup(loc.name);
            handlePickupSelect(loc);
        } else {
            setDrop(loc.name);
            handleDropSelect(loc);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6"
        >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiNavigation className="text-teal-600 dark:text-teal-400" />
                Request a Ride
            </h2>

            {/* Book Now / Schedule Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
                <button
                    type="button"
                    onClick={() => setMode('now')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        mode === 'now'
                            ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    <FiNavigation size={12} /> Book Now
                </button>
                <button
                    type="button"
                    onClick={() => setMode('schedule')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        mode === 'schedule'
                            ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    <FiCalendar size={12} /> Schedule
                </button>
            </div>

            {/* Quick Select Favorites */}
            {favorites.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-1">
                    {favorites.map(fav => {
                        let Icon = FiStar;
                        if (fav.label === 'Home') Icon = FiHome;
                        if (fav.label === 'Work') Icon = FiBriefcase;
                        
                        return (
                            <button
                                key={fav._id}
                                type="button"
                                onClick={() => handleQuickSelect(fav)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 dark:hover:bg-teal-900/30 dark:hover:border-teal-700 dark:hover:text-teal-400 transition-colors shrink-0"
                            >
                                <Icon size={12} />
                                {fav.label === 'Custom' ? fav.customName : fav.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative" onClick={() => setActiveInput('pickup')}>
                    <LocationAutocomplete
                        placeholder="Pickup Location"
                        icon={<FiMapPin size={18} className="text-teal-600 dark:text-teal-400" />}
                        value={pickup}
                        onChange={setPickup}
                        onSelect={handlePickupSelect}
                        activeColor="teal"
                    />
                </div>

                <div className="relative" onClick={() => setActiveInput('drop')}>
                    <LocationAutocomplete
                        placeholder="Drop Location"
                        icon={<FiMapPin size={18} className="text-red-500" />}
                        value={drop}
                        onChange={setDrop}
                        onSelect={handleDropSelect}
                        activeColor="red"
                    />
                </div>

                {estimateData && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-xs text-teal-700 dark:text-teal-400 font-bold block mb-0.5">Estimated Fare</span>
                            <span className="text-sm text-teal-600 dark:text-teal-400 block leading-tight">Based on {estimateData.distanceKm}km & {estimateData.durationMin}min</span>
                        </div>
                        <span className="text-xl font-black text-teal-800">₹{estimateData.estimatedFare}</span>
                    </div>
                )}

                <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-500 dark:text-gray-400 text-sm font-semibold">₹</span>
                    <input
                        type="number"
                        placeholder="Propose your fare"
                        value={fare}
                        onChange={(e) => setFare(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
                        required
                    />
                </div>

                {/* Date & Time Pickers (Schedule Mode) */}
                {mode === 'schedule' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <FiCalendar className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                max={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                                className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-200"
                                required
                            />
                        </div>
                        <div className="relative">
                            <FiClock className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-200"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Split Fare Toggle */}
                {mode === 'now' && (
                    <button
                        type="button"
                        onClick={() => setSplitEnabled(!splitEnabled)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            splitEnabled
                                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-400'
                                : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <FiUsers size={16} />
                            Split Fare with Friends
                        </span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${splitEnabled ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${splitEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                    </button>
                )}

                <button
                    type="submit"
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex justify-center items-center gap-2 ${
                        mode === 'schedule'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : mode === 'schedule' ? (
                        <><FiCalendar size={14} /> Schedule Ride</>
                    ) : (
                        <>Request Negotiation {distance > 0 && `(${distance}km)`} <FiNavigation size={14} /></>
                    )}
                </button>
            </form>

            {crowdZoneAlert && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl flex gap-2">
                    <FiMapPin className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                        <span className="font-bold">Smart Pickup Tip:</span> {crowdZoneAlert}
                    </p>
                </div>
            )}

            {/* Split Fare Modal */}
            <SplitFareModal
                isOpen={showSplitModal}
                onClose={() => setShowSplitModal(false)}
                rideId={createdRideId}
            />
        </motion.div>
    );
};

export default RideRequest;
