import { motion } from 'framer-motion';

const AnimatedButton = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const variants = {
        primary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
        teal: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
        danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
        outline: 'bg-transparent border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white',
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant] || variants.primary}
                ${className}
            `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
        >
            {children}
        </motion.button>
    );
};

export default AnimatedButton;
