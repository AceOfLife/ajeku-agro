// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'your_very_secure_secret_key';

module.exports = {
  // Authentication middleware to verify JWT and attach user to the request
  authenticate: (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Received token:', authHeader);

    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    try {
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Decoded token:', decoded);
      
      req.user = decoded;
      next();
    } catch (ex) {
      console.error('Token verification failed:', ex.message);
      
      if (ex.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(400).json({ message: 'Invalid token' });
    }
  },

  // Authorization middleware for admin users only
  authorizeAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  },

  // General role-based authorization middleware
  authorizeRole: (allowedRoles) => {
    return (req, res, next) => {
      if (req.user && allowedRoles.includes(req.user.role)) {
        next();
      } else {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    };
  }
};