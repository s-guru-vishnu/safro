import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHome, FiBriefcase, FiMapPin, FiStar } from 'react-icons/fi';
import LocationAutocomplete from './LocationAutocomplete';

const FavoriteLocationModal = ({ isOpen, onClose, onSave }) => {
    const [label, setLabel] = useState('Home');
    const [customName, setCustomName] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSelectLocation = (loc) => {
        if (!loc) {
            setLocation(null);
            return;
        }
        setLocation({
            address: loc.name || loc.address,
            coordinates: { lat: loc.lat, lng: loc.lng }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) return;
        
        setLoading(true);
        try {
            await onSave({
                label,
                customName: label === 'Custom' ? customName : undefined,
                address: location.address,
                coordinates: location.coordinates
            });
            handleClose();
        } catch (err) {
            // Error handled by parent explicitly or inside hook
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setLabel('Home');
        setCustomName('');
        setLocation(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800"
                >
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <FiX size={20} />
                    </button>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FiStar className="text-amber-500" /> Save Location
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Label Picker */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location Type</label>
                            <div className="flex gap-3">
                                {[ 
                                    { id: 'Home', icon: FiHome }, 
                                    { id: 'Work', icon: FiBriefcase }, 
                                    { id: 'Custom', icon: FiMapPin } 
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setLabel(type.id)}
                                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                                            label === type.id
                                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                                                : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                    >
                                        <type.icon size={18} />
                                        <span className="text-xs font-bold">{type.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Name */}
                        {label === 'Custom' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name this location</label>
                                <input
                                    type="text"
                                    required
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="e.g. Gym, College, Parent's House"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </motion.div>
                        )}

                        {/* Address Search */}
                        <div className="relative !z-[3000]">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Address</label>
                            <LocationAutocomplete
                                placeholder="Search for location..."
                                onSelect={handleSelectLocation}
                                onChange={(val) => { if(!val) setLocation(null); }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!location || loading}
                            className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                        >
                            {loading ? 'Saving...' : 'Save Location'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FavoriteLocationModal;
