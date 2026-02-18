/**
 * Role-Based Access Control Middleware
 * Restricts access to specific user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'driver', 'rider')
 */
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
