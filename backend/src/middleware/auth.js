const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION) || 86400000; // in milliseconds

// Generate JWT Token (matching the sub: email, role claims)
function generateToken(email, role, userId) {
  // jwt.sign expiresIn takes seconds or formatted string
  return jwt.sign({ sub: email, role: role, userId: userId }, JWT_SECRET, {
    expiresIn: Math.floor(JWT_EXPIRATION / 1000),
  });
}

// Authenticate request middleware
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const email = decoded.sub;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Your account has been disabled.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Admin authorization middleware
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'ROLE_ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

module.exports = {
  generateToken,
  authenticate,
  isAdmin,
};
