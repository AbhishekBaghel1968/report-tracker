const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

async function officerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const email = decoded.sub;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Your account has been disabled.' });
    }

    if (user.role !== 'ROLE_OFFICER') {
      return res.status(403).json({ error: 'Forbidden: Officer permissions required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Officer authorization error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = officerAuth;
