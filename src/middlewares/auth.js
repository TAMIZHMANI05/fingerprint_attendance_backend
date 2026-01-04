const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../configs/config');
const httpError = require('../utils/httpError');

// Verify JWT token and attach user to request
const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return httpError(next, new Error('No token provided'), req, 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return httpError(next, new Error('Invalid token'), req, 401);
        }
        if (err.name === 'TokenExpiredError') {
            return httpError(next, new Error('Token expired'), req, 401);
        }
        return httpError(next, err, req, 401);
    }
};

// Check if user has required role(s)
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return httpError(next, new Error('User not authenticated'), req, 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return httpError(next, new Error('Insufficient permissions'), req, 403);
        }

        next();
    };
};

module.exports = {
    verifyToken,
    requireRole
};

