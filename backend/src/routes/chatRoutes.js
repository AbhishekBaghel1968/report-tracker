const express = require('express');
const router = express.Router();
const { ChatMessage, Complaint, User } = require('../models');
const { authenticate } = require('../middleware/auth');

// Protect all chat routes
router.use(authenticate);

/**
 * Fetch messages for a specific case
 */
router.get('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const user = req.user;

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Authorization check: User must be the citizen who filed it, the assigned officer, or an Admin
    const isCitizen = complaint.userId == user.id;
    const isOfficer = complaint.officerId == user.id;
    const isAdmin = user.role === 'ROLE_ADMIN';

    if (!isCitizen && !isOfficer && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to view this chat history.' });
    }

    const messages = await ChatMessage.findAll({
      where: { complaintId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Fetch chat messages error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Send a message via REST endpoint (fallback or helper)
 */
router.post('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Authorization check
    const isCitizen = complaint.userId == user.id;
    const isOfficer = complaint.officerId == user.id;
    const isAdmin = user.role === 'ROLE_ADMIN';

    if (!isCitizen && !isOfficer && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to send messages in this room.' });
    }

    const newMessage = await ChatMessage.create({
      complaintId,
      senderId: user.id,
      message: message.trim()
    });

    const populated = await ChatMessage.findByPk(newMessage.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }]
    });

    // Emit live to socket room if active
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${complaintId}`).emit('chat_message', populated);
    }

    return res.status(200).json(populated);
  } catch (error) {
    console.error('Send chat message error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
