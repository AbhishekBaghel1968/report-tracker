const { Complaint, User, EvidenceFile, EvidenceUpload, OfficerNote, ChatMessage } = require('../models');
const pdfService = require('../services/pdfService');

/**
 * Controller to generate and download complaint reports as PDF.
 * Route: GET /api/reports/:complaintId/pdf
 */
async function downloadComplaintPDF(req, res) {
  try {
    const { complaintId } = req.params;
    
    // Find the complaint and load all relevant forensic telemetry relationships
    const complaint = await Complaint.findOne({
      where: { complaintId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: EvidenceUpload, as: 'evidenceUploads' },
        { model: OfficerNote, as: 'officerNotes' },
        { model: ChatMessage, as: 'chatMessages', include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }] }
      ]
    });
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with ID: ' + complaintId });
    }

    // Assemble the complete chronological timeline history (matching timelineController.js logic)
    const timeline = [];

    // 1. Complaint submitted
    timeline.push({
      id: 'evt-submitted',
      type: 'SUBMITTED',
      title: 'Complaint Submitted',
      description: `Complaint ${complaint.complaintId} was filed successfully by citizen ${complaint.user?.name || 'Anonymous'}.`,
      timestamp: complaint.createdAt,
      category: 'incident',
      updatedBy: complaint.user?.name || 'Anonymous',
      role: 'ROLE_CITIZEN'
    });

    // 2. AI Security Assessment
    if (complaint.aiRiskScore) {
      timeline.push({
        id: 'evt-ai-assessment',
        type: 'AI_ASSESSMENT',
        title: 'AI Security Assessment Completed',
        description: `Risk Score: ${complaint.aiRiskScore}%, Category Match: ${complaint.aiCategory || 'General'}, Fraud Risk: ${complaint.fraudRiskLevel || 'LOW'}.`,
        timestamp: complaint.createdAt,
        category: 'forensics',
        updatedBy: 'AI Analyzer Engine',
        role: 'SYSTEM'
      });
    }

    // 3. Officer assignment
    if (complaint.officerId) {
      timeline.push({
        id: 'evt-assigned',
        type: 'ASSIGNED',
        title: 'Investigator Assigned',
        description: `Case file assigned to Cyber Defense Officer ${complaint.officer?.name || 'Unassigned'}.`,
        timestamp: complaint.updatedAt,
        category: 'milestone',
        updatedBy: 'Sentinel Administrator',
        role: 'ROLE_ADMIN'
      });
    }

    // 4. Status update
    if (complaint.status !== 'SUBMITTED') {
      timeline.push({
        id: 'evt-status-change',
        type: 'STATUS_UPDATE',
        title: 'Caseload Status Shift',
        description: `Status updated to ${(complaint.status || '').replace('_', ' ')}.`,
        timestamp: complaint.updatedAt,
        category: 'milestone',
        updatedBy: complaint.officer?.name || 'Sentinel Administrator',
        role: complaint.officer?.name ? 'ROLE_OFFICER' : 'ROLE_ADMIN'
      });
    }

    // 5. Citizen evidence files
    if (complaint.evidenceFiles) {
      complaint.evidenceFiles.forEach((file) => {
        timeline.push({
          id: `evt-cit-file-${file.id}`,
          type: 'CITIZEN_EVIDENCE',
          title: `Evidence File Attached`,
          description: `Citizen uploaded file "${file.fileName}". Sha256: ${file.fileHash || 'Pending'}, Size: ${file.fileSize ? (file.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}.`,
          timestamp: file.uploadedAt || complaint.createdAt,
          category: 'evidence',
          updatedBy: complaint.user?.name || 'Anonymous',
          role: 'ROLE_CITIZEN'
        });
      });
    }

    // 6. Officer uploads
    if (complaint.evidenceUploads) {
      complaint.evidenceUploads.forEach((file) => {
        timeline.push({
          id: `evt-off-file-${file.id}`,
          type: 'OFFICER_EVIDENCE',
          title: `Forensic Log Uploaded`,
          description: `Investigator uploaded forensic evidence file "${file.fileName}". Forensics SHA-256: ${file.fileHash || 'Pending'}.`,
          timestamp: file.uploadedAt,
          category: 'forensics',
          updatedBy: complaint.officer?.name || 'Cyber Officer',
          role: 'ROLE_OFFICER'
        });
      });
    }

    // 7. Officer notes
    if (complaint.officerNotes) {
      complaint.officerNotes.forEach((note) => {
        timeline.push({
          id: `evt-note-${note.id}`,
          type: 'OFFICER_NOTE',
          title: `Investigation Log Entry`,
          description: `Note logged: "${note.note}" by ${note.officerName || 'Cyber Officer'}.`,
          timestamp: note.createdAt,
          category: 'investigation',
          updatedBy: note.officerName || 'Cyber Officer',
          role: 'ROLE_OFFICER'
        });
      });
    }

    // 8. Chat messages
    if (complaint.chatMessages) {
      complaint.chatMessages.forEach((msg) => {
        const senderRole = msg.sender?.role ? msg.sender.role.replace('ROLE_', '') : 'SYSTEM';
        timeline.push({
          id: `evt-chat-${msg.id}`,
          type: 'CHAT_MESSAGE',
          title: `Chat Log Transmission`,
          description: `[${senderRole}] ${msg.sender?.name}: "${msg.message}"`,
          timestamp: msg.createdAt,
          category: 'chat',
          updatedBy: msg.sender?.name || 'System',
          role: msg.sender?.role || 'SYSTEM'
        });
      });
    }

    // Sort timeline items chronologically (oldest first)
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Sort officer notes in complaint object by date descending for layout rendering
    if (complaint.officerNotes) {
      complaint.officerNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${complaint.complaintId}-report.pdf"`);

    // Stream the generated PDF
    await pdfService.generateComplaintPDF(res, complaint, timeline);

  } catch (error) {
    console.error('Error generating and downloading report PDF:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }
}

module.exports = {
  downloadComplaintPDF
};
