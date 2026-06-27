import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CustomDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option", 
    label,
    icon: Icon,
    disabled = false,
    error = null,
    searchable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (opt) => {
        onChange(opt);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-outfit">
                    {label}
                </label>
            )}
            
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    relative w-full cursor-pointer flex items-center justify-between
                    pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border rounded-xl transition-all outline-none
                    ${isOpen ? 'ring-2 ring-teal-500 border-transparent bg-white shadow-sm' : 'border-gray-200 dark:border-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-teal-400'}
                    ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}
                `}
            >
                {Icon && (
                    <Icon 
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isOpen ? 'text-teal-500' : 'text-gray-400 dark:text-gray-500'}`} 
                        size={16} 
                    />
                )}
                
                <span className={`text-sm truncate ${value ? 'text-gray-900 dark:text-white border-gray-900' : 'text-gray-400 dark:text-gray-500'}`}>
                    {value || placeholder}
                </span>

                <FiChevronDown 
                    className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-500' : ''}`} 
                    size={16} 
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="absolute z-[100] left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                    >
                        {searchable && (
                            <div className="relative p-2 border-b border-gray-50 bg-gray-50 dark:bg-gray-950/50">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={14} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-500 transition-all font-outfit"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        
                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <div
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={`
                                            px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between
                                            ${value === opt ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                            ${idx !== filteredOptions.length - 1 ? 'border-b border-gray-50' : ''}
                                        `}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {value === opt && <FiCheck size={14} />}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-gray-400 dark:text-gray-500 text-xs italic">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <p className="text-[11px] text-red-500 mt-1 ml-1">{error}</p>}
        </div>
    );
};

export default CustomDropdown;
