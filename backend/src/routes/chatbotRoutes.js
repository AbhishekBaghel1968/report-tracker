const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    const responseText = await aiService.getChatbotResponse(message);
    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
