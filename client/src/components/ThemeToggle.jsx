import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = ({ className = '' }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-[56px] h-[28px] rounded-full cursor-pointer border-none outline-none transition-colors duration-300 flex items-center ${
                isDark
                    ? 'bg-gray-800 shadow-inner shadow-black/30'
                    : 'bg-gray-200 shadow-inner shadow-gray-300/50'
            } ${className}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Sun icon (left side) */}
            <div className={`absolute left-[6px] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-[20px] h-[20px] transition-opacity duration-300 ${
                isDark ? 'opacity-40' : 'opacity-0'
            }`}>
                <FiSun size={11} className="text-gray-400" />
            </div>

            {/* Moon icon (right side) */}
            <div className={`absolute right-[6px] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-[20px] h-[20px] transition-opacity duration-300 ${
                isDark ? 'opacity-0' : 'opacity-40'
            }`}>
                <FiMoon size={11} className="text-gray-500" />
            </div>

            {/* Sliding knob */}
            <motion.div
                className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-teal-600 shadow-md shadow-teal-500/30 z-20 flex items-center justify-center"
                animate={{ x: isDark ? 26 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {isDark ? (
                    <FiMoon size={11} className="text-white" />
                ) : (
                    <FiSun size={11} className="text-white" />
                )}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
