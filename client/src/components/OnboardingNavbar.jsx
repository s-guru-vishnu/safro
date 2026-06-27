import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiHelpCircle, FiMail, FiPhone, FiChevronDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const OnboardingNavbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const helpRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <>
            <nav className={`fixed top-0 w-full z-50 bg-gray-900 transition-shadow duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                S
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-white leading-tight">Safro</span>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase leading-none hidden sm:block">
                                    Driver Onboarding
                                </span>
                            </div>
                        </Link>

                        {/* Right – Help */}
                        <div className="relative" ref={helpRef}>
                            <button
                                onClick={() => setHelpOpen(!helpOpen)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <FiHelpCircle size={16} />
                                <span className="hidden sm:inline">Help</span>
                                <FiChevronDown className={`text-gray-400 dark:text-gray-500 transition-transform ${helpOpen ? 'rotate-180' : ''}`} size={14} />
                            </button>

                            <AnimatePresence>
                                {helpOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50"
                                    >
                                        <a
                                            href="mailto:safro.2026.safro@gmail.com"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <FiMail size={14} className="text-teal-500" />
                                            Contact Support
                                        </a>
                                        <a
                                            href="tel:+911234567890"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <FiPhone size={14} className="text-teal-500" />
                                            Call Us
                                        </a>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="h-16" />
        </>
    );
};

export default OnboardingNavbar;
