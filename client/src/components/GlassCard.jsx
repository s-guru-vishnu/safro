import { motion } from 'framer-motion';

const Card = ({ children, className = '', hoverEffect = true }) => {
    return (
        <motion.div
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-black/20 overflow-hidden ${className}`}
            whileHover={hoverEffect ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' } : {}}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    );
};

export default Card;
