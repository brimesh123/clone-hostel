const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const token = req.cookies.jwt; // Extract token from cookie
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