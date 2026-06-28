const { ComplaintTimeline } = require('../models');
const { createTimelineEvent } = require('../services/timelineService');

/**
 * GET /api/timeline/:complaintId
 * Returns complete timeline for a specific tracking ID
 */
async function getTimelineByComplaintId(req, res) {
  try {
    const { complaintId } = req.params;
    const timeline = await ComplaintTimeline.findAll({
      where: { complaintId },
      order: [['createdAt', 'ASC']],
    });
    return res.status(200).json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * POST /api/timeline
 * Create a new timeline entry manually (requires authentication)
 */
async function createTimelineEntry(req, res) {
  try {
    const { complaintId, stage, message, updatedBy, role } = req.body;
    if (!complaintId || !stage || !message) {
      return res.status(400).json({ error: 'Required fields complaintId, stage, and message are missing' });
    }

    // Default to the authenticated user's details if not provided
    const authorName = updatedBy || req.user?.name || 'System';
    const authorRole = role || req.user?.role || 'SYSTEM';

    const entry = await createTimelineEvent(
      complaintId,
      stage,
      message,
      authorName,
      authorRole,
      req.app.get('io')
    );

    return res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating timeline entry:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getTimelineByComplaintId,
  createTimelineEntry,
};
