const express = require('express');
const router = express.Router();
const threatIntelService = require('../services/threatIntelService');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const feed = threatIntelService.getActiveThreatFeed();
    return res.status(200).json(feed);
  } catch (error) {
    console.error('Threat Intel API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
