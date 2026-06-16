// middlewares/roleMiddleware.js
module.exports = function(allowedRoles) {
    return function(req, res, next) {
      const userRole = req.user.role;  // Assume req.user is populated with the authenticated user
  
      if (allowedRoles.includes(userRole)) {
        next(); // User has the correct role
      } else {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
    };
  };
  