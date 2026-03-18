import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMapPin, FiSearch, FiX, FiAlertTriangle, FiNavigation, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { searchLocations, getNearbyLocations, reverseGeocode, getPlaceDetails } from '../../services/locationService';

const LocationAutocomplete = ({ 
    placeholder = "Search location...", 
    icon, 
    value = '', 
    onChange, 
    onSelect, 
    activeColor = 'teal' 
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selecting, setSelecting] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);

    // Sync with external value updates
    useEffect(() => {
        if (value !== undefined) {
            setQuery(value);
        }
    }, [value]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback(async (text) => {
        if (!text || text.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const results = await searchLocations(text);
            setSuggestions(results);
            if (results.length === 0) {
                setError('No results found');
            }
        } catch (err) {
            console.error('Autocomplete error:', err);
            setError('Search failed. Using manual input.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFocus = async () => {
        setIsOpen(true);
        if (!query) {
            setLoading(true);
            try {
                // Get nearby places on focus if empty
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        // For nearby, we can just use the current location or search nearby
                        const nearby = await getNearbyLocations(latitude, longitude);
                        setSuggestions(nearby);
                        setLoading(false);
                    },
                    (err) => {
                        console.warn('Geolocation failed', err);
                        setLoading(false);
                    },
                    { timeout: 5000 }
                );
            } catch (err) {
                setLoading(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setQuery(text);
        if (onChange) onChange(text);
        setIsOpen(true);
        setActiveIndex(-1);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (text.length >= 2) {
            debounceTimer.current = setTimeout(() => {
                fetchSuggestions(text);
            }, 300);
        } else if (text.length === 0) {
            setSuggestions([]);
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                handleSelect(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = async (location) => {
        if (location.isCurrentLocation) {
            setQuery(location.name);
            setIsOpen(false);
            if (onSelect) onSelect(location);
            return;
        }

        setSelecting(true);
        try {
            const details = await getPlaceDetails(location.id);
            if (details) {
                const displayName = details.name || details.address;
                setQuery(displayName);
                setIsOpen(false);
                setSuggestions([]);
                if (onSelect) onSelect(details);
                if (onChange) onChange(displayName);
            } else {
                // Fallback to what we have if details fail
                const displayName = location.name || location.address;
                setQuery(displayName);
                setIsOpen(false);
                if (onSelect) onSelect(location);
            }
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setSelecting(false);
        }
    };

    const clearInput = () => {
        setQuery('');
        setSuggestions([]);
        if (onChange) onChange('');
        if (onSelect) onSelect(null);
    };

    return (
        <div className="relative w-full" ref={wrapperRef} onKeyDown={handleKeyDown}>
            <div className="relative group">
                <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isOpen ? `text-${activeColor}-600` : 'text-gray-400'}`}>
                    {icon || <FiSearch size={18} />}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={`w-full pl-11 pr-10 py-3.5 bg-gray-50/50 backdrop-blur-sm border border-gray-200 rounded-2xl text-sm transition-all duration-300 outline-none focus:bg-white focus:ring-4 focus:ring-${activeColor}-500/10 focus:border-${activeColor}-500 group-hover:bg-white text-gray-800 font-medium`}
                />

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {(loading || selecting) ? (
                        <div className={`w-4 h-4 border-2 border-${activeColor}-500 border-t-transparent rounded-full animate-spin`} />
                    ) : query && (
                        <button 
                            type="button" 
                            onClick={clearInput}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (suggestions.length > 0 || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar pt-2">
                            {error ? (
                                <div className="p-6 flex flex-col items-center text-center gap-2">
                                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                                        <FiAlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{error}</p>
                                        <p className="text-xs text-gray-400 mt-1">Try typing manually or checking your connection.</p>
                                    </div>
                                </div>
                            ) : (
                                <ul className="pb-2">
                                    {suggestions.map((loc, index) => (
                                        <li key={loc.id || index}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(loc)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                className={`w-full text-left px-4 py-3 flex items-start gap-4 transition-all duration-200 ${
                                                    activeIndex === index ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                                                }`}
                                            >
                                                <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                                                    loc.isCurrentLocation ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {loc.isCurrentLocation ? <FiNavigation size={16} /> : <FiMapPin size={16} />}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-800 truncate">
                                                            {loc.name}
                                                        </span>
                                                        {loc.isCurrentLocation && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">Nearby</span>
                                                        )}
                                                    </div>
                                                    {loc.address && loc.address !== loc.name && (
                                                        <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                                                            <span>{loc.address}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
};

export default LocationAutocomplete;
