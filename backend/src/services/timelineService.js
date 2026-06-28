const { ComplaintTimeline } = require('../models');

/**
 * Creates an event entry in the complaint_timeline table and broadcasts it via Socket.IO.
 * 
 * @param {string} complaintId - The tracking ID (e.g. COMP-101)
 * @param {string} stage - The current stage (e.g. SUBMITTED, UNDER_REVIEW, etc.)
 * @param {string} message - Descriptive log message
 * @param {string} updatedBy - Name of the user making the update
 * @param {string} role - Role of the user
 * @param {object} [io] - Socket.IO server instance
 */
async function createTimelineEvent(complaintId, stage, message, updatedBy, role, io = null) {
  try {
    const entry = await ComplaintTimeline.create({
      complaintId,
      stage: stage.toUpperCase(),
      message,
      updatedBy: updatedBy || 'System',
      role: role || 'SYSTEM',
    });

    if (io) {
      // Broadcast to all clients tracking this complaint or general updates
      io.emit('timeline_entry_created', entry);
      console.log(`Socket: Emitted timeline_entry_created for ${complaintId}`);
    }
    return entry;
  } catch (error) {
    console.error('Error creating automatic timeline event:', error);
  }
}

module.exports = {
  createTimelineEvent,
};
