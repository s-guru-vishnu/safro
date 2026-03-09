import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiCompass, FiSearch, FiX, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { searchLocations, getNearbyLocations } from '../../services/locationService';

const LocationInput = ({ placeholder, icon, value, onChange, onSelect, activeColor = 'teal' }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const wrapperRef = useRef(null);
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    // Sync external value changes (e.g., from map click reverse geocoding)
    useEffect(() => {
        if (value && value !== query) {
            setQuery(value);
        }
    }, [value]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch user's current location when input is focused and empty
    const handleFocus = async () => {
        setIsOpen(true);
        if (!query) {
            setLoading(true);
            try {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const nearby = await getNearbyLocations(latitude, longitude);
                        setSuggestions(nearby);
                        setLoading(false);
                        setError(null);
                    },
                    (geoErr) => {
                        console.warn('Geolocation denied or unavailable.');
                        setLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } catch (err) {
                setLoading(false);
            }
        }
    };

    // Handle typing with 300ms debounce
    const handleInputChange = (e) => {
        const text = e.target.value;
        setQuery(text);
        onChange && onChange(text);
        setIsOpen(true);
        setError(null);

        if (debounceTimeout) clearTimeout(debounceTimeout);

        if (text.length >= 3) {
            setLoading(true);
            const timeout = setTimeout(async () => {
                try {
                    const results = await searchLocations(text);
                    setSuggestions(results);
                    if (results.length === 0) {
                        setError('No locations found');
                    }
                } catch (err) {
                    setError('Location search unavailable. Please type manually.');
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            }, 300);
            setDebounceTimeout(timeout);
        } else {
            setSuggestions([]);
            setLoading(false);
        }
    };

    const handleSelect = (location) => {
        setQuery(location.name || location.address);
        onChange && onChange(location.name || location.address);
        onSelect && onSelect(location);
        setIsOpen(false);
    };

    const clearInput = () => {
        setQuery('');
        onChange && onChange('');
        setSuggestions([]);
        onSelect && onSelect(null);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative flex items-center">
                <div className={`absolute left-3.5 text-${activeColor}-600`}>
                    {icon || <FiMapPin size={16} />}
                </div>

                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-${activeColor}-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800`}
                />

                <div className="absolute right-3.5 flex items-center">
                    {loading ? (
                        <div className={`w-4 h-4 border-2 border-${activeColor}-500 border-t-transparent rounded-full animate-spin`} />
                    ) : query ? (
                        <button type="button" onClick={clearInput} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1">
                            <FiX size={16} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Dropdown Suggestions */}
            <AnimatePresence>
                {isOpen && (suggestions.length > 0 || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                    >
                        {error ? (
                            <div className="p-4 flex items-start gap-3 text-red-600 bg-red-50/50">
                                <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">{error}</p>
                                    <p className="text-xs text-red-500 mt-0.5 opacity-80">You can still type your address manually to proceed.</p>
                                </div>
                            </div>
                        ) : (
                            <ul className="py-2">
                                {suggestions.map((loc, idx) => (
                                    <li key={loc.id || idx}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(loc)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3 transition-colors focus:bg-gray-50 focus:outline-none"
                                        >
                                            <div className="mt-0.5 text-gray-400">
                                                {loc.isCurrentLocation ? <FiCompass className="text-blue-500" /> : <FiMapPin />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {loc.name}
                                                </p>
                                                {loc.address && loc.address !== loc.name && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        {loc.address}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationInput;
