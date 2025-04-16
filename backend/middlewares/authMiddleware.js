const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
  verifyToken: (req, res, next) => {
    // First try to get token from cookie
    let token = req.cookies.jwt;
    
    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Failed to authenticate token.' });
      }
      req.user = decoded; // Store user data in the request object
      next();
    });
  },
};

module.exports = authMiddleware;
