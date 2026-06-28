const { Complaint, User, EvidenceFile, OfficerNote, EvidenceUpload, AuditLog } = require('../models');
const aiAnalyzer = require('../services/aiAnalyzer');
const { createTimelineEvent } = require('../services/timelineService');

/**
 * Handle AI analyzer evaluation requests.
 * Runs AI diagnostics and optionally updates database records.
 */
async function analyzeComplaint(req, res) {
  try {
    const { title, description, complaintId } = req.body;

    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description is required for evaluation.' });
    }

    // Run the AI/NLP classification analysis
    const analysis = await aiAnalyzer.analyzeComplaintData(title, description);

    let updatedRecord = null;

    // If database complaintId is supplied, persist findings to database
    if (complaintId) {
      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: `Complaint record not found for ID: ${complaintId}` });
      }

      // Update AI columns in DB
      complaint.aiCategory = analysis.category;
      complaint.aiPriority = analysis.severity;
      complaint.aiRiskScore = analysis.riskScore;
      complaint.aiIocs = JSON.stringify(analysis.keywords);
      complaint.aiRecommendation = analysis.recommendation;
      // Also update standard aiSummary for backwards compatibility with legacy UI cards
      complaint.aiSummary = `Category: ${analysis.category}. Risk: ${analysis.riskScore}%. Priority: ${analysis.severity}.`;

      await complaint.save();

      // Automatically create a timeline event log
      try {
        await createTimelineEvent(
          complaint.complaintId,
          'AI_ASSESSMENT',
          `AI forensics analysis scan executed. Risk Score: ${analysis.riskScore}%, Category: ${analysis.category}, Severity: ${analysis.severity}.`,
          req.user.name,
          req.user.role,
          req.app.get('io')
        );
      } catch (err) {
        console.error('Failed to create timeline event log for AI assessment:', err);
      }

      // Log action to AuditLog
      try {
        await AuditLog.create({
          userId: req.user.id,
          userName: req.user.name,
          action: 'AI_ANALYSIS_RUN',
          details: `User executed security analysis scan on complaint ID: ${complaint.complaintId}. Classified: ${analysis.category}, Risk: ${analysis.riskScore}%.`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });
      } catch (err) {
        console.error('Failed to log AI analysis audit entry:', err);
      }

      // Retrieve enriched record with associations populated
      updatedRecord = await Complaint.findByPk(complaintId, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
          { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
          { model: EvidenceFile, as: 'evidenceFiles' },
          { model: OfficerNote, as: 'officerNotes' },
          { model: EvidenceUpload, as: 'evidenceUploads' },
        ],
      });

      // Emit live updates to Socket.IO channels
      const io = req.app.get('io');
      if (io) {
        io.emit('complaint_updated', updatedRecord);
      }
    }

    return res.status(200).json({
      success: true,
      analysis,
      complaint: updatedRecord
    });

  } catch (error) {
    console.error('AI complaint analyzer controller error:', error);
    return res.status(500).json({ error: 'Internal Server Error during AI diagnostics.' });
  }
}

module.exports = {
  analyzeComplaint
};
