const { Complaint, User, EvidenceFile, OfficerNote, EvidenceUpload, Notification, AuditLog } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { createTimelineEvent } = require('../services/timelineService');

// 1. Get Dashboard Stats for current officer
async function getDashboardStats(req, res) {
  try {
    const officerId = req.user.id;

    const total = await Complaint.count({ where: { officerId } });
    const submitted = await Complaint.count({ where: { officerId, status: 'SUBMITTED' } });
    const underReview = await Complaint.count({ where: { officerId, status: 'UNDER_REVIEW' } });
    const investigating = await Complaint.count({ where: { officerId, status: 'INVESTIGATING' } });
    const resolved = await Complaint.count({ where: { officerId, status: 'RESOLVED' } });
    const rejected = await Complaint.count({ where: { officerId, status: 'REJECTED' } });

    // Pending review = SUBMITTED + UNDER_REVIEW
    const pendingReview = submitted + underReview;

    return res.status(200).json({
      assignedCases: total,
      underInvestigation: investigating,
      resolvedCases: resolved,
      pendingReview: pendingReview,
      statusBreakdown: {
        SUBMITTED: submitted,
        UNDER_REVIEW: underReview,
        INVESTIGATING: investigating,
        RESOLVED: resolved,
        REJECTED: rejected,
      }
    });
  } catch (error) {
    console.error('Get officer stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 2. Get Cases assigned to the officer with pagination, search, and filters
async function getAssignedCases(req, res) {
  try {
    const officerId = req.user.id;
    const { page = 1, limit = 10, search, status, priority, category } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { officerId };

    if (search) {
      where[Op.or] = [
        { complaintId: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    if (category) {
      where.category = category;
    }

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: EvidenceUpload, as: 'evidenceUploads' },
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit, 10));

    return res.status(200).json({
      cases: rows,
      totalCount: count,
      totalPages,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error('Get assigned cases error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 3. Get specific Complaint Details (must be assigned to this officer)
async function getCaseDetails(req, res) {
  try {
    const officerId = req.user.id;
    const { id } = req.params;

    const complaint = await Complaint.findOne({
      where: { id, officerId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: OfficerNote, as: 'officerNotes' },
        { model: EvidenceUpload, as: 'evidenceUploads' },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Case not found or not assigned to this officer.' });
    }

    // Sort officer notes by date descending in memory to guarantee database compatibility
    if (complaint.officerNotes) {
      complaint.officerNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json(complaint);
  } catch (error) {
    console.error('Get case details error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 4. Update Complaint Status (must be assigned to this officer)
async function updateCaseStatus(req, res) {
  try {
    const officerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const ALLOWED_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
    if (!status || !ALLOWED_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing status value.' });
    }

    const complaint = await Complaint.findOne({ where: { id, officerId } });
    if (!complaint) {
      return res.status(404).json({ error: 'Case not found or not assigned to this officer.' });
    }

    complaint.status = status.toUpperCase();
    await complaint.save();

    // Automatically create timeline event for status change by officer
    let timelineMessage = `Complaint status updated to ${status.replace('_', ' ')}`;
    let timelineStage = status.toUpperCase();
    if (timelineStage === 'INVESTIGATING') {
      timelineMessage = 'Investigation started by assigned officer';
    } else if (timelineStage === 'RESOLVED') {
      timelineMessage = 'Complaint resolved successfully';
    } else if (timelineStage === 'REJECTED') {
      timelineMessage = 'Complaint rejected';
    } else if (timelineStage === 'UNDER_REVIEW') {
      timelineMessage = 'Officer started reviewing complaint';
    }

    await createTimelineEvent(
      complaint.complaintId,
      timelineStage,
      timelineMessage,
      req.user.name,
      req.user.role,
      req.app.get('io')
    );

    const updatedComplaint = await Complaint.findOne({
      where: { id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: OfficerNote, as: 'officerNotes' },
        { model: EvidenceUpload, as: 'evidenceUploads' },
      ],
    });

    // Emit live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_updated', updatedComplaint);
    }

    // Log action to AuditLog
    try {
      await AuditLog.create({
        userId: req.user.id,
        userName: req.user.name,
        action: 'STATUS_UPDATED',
        details: `Officer updated complaint ${updatedComplaint.complaintId} status to ${status.toUpperCase()}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (err) {
      console.error('Failed to log status update audit:', err);
    }

    // Send email alert to citizen
    if (updatedComplaint.user) {
      try {
        await emailService.sendCaseStatusAlert(updatedComplaint.user, updatedComplaint);
      } catch (err) {
        console.error('Failed to send status update email alert:', err);
      }
    }

    // Create notifications for citizen & admin if resolved
    try {
      const statusUpper = status.toUpperCase();
      const isResolved = statusUpper === 'RESOLVED';
      
      const citizenMsg = isResolved
        ? `Complaint ${updatedComplaint.complaintId} resolved`
        : `Your complaint ${updatedComplaint.complaintId} status updated to ${statusUpper.replace('_', ' ')}`;
      
      const citizenNotif = await Notification.create({
        userId: updatedComplaint.userId,
        title: isResolved ? 'Complaint Resolved' : 'Complaint Status Updated',
        message: citizenMsg,
        type: isResolved ? 'SUCCESS' : 'INFO',
        isRead: false
      });
      
      if (io) {
        io.to(`user_${updatedComplaint.userId}`).emit('notification', citizenNotif);
      }

      if (isResolved) {
        const admins = await User.findAll({ where: { role: 'ROLE_ADMIN' } });
        const adminNotifications = admins.map(admin => ({
          userId: admin.id,
          title: 'Complaint Resolved',
          message: `Complaint ${updatedComplaint.complaintId} resolved`,
          type: 'SUCCESS',
          isRead: false
        }));
        const createdAdminNotifs = await Notification.bulkCreate(adminNotifications);
        if (io) {
          for (const notif of createdAdminNotifs) {
            io.to(`user_${notif.userId}`).emit('notification', notif);
          }
        }
      }
    } catch (error) {
      console.error('Error creating status update notifications:', error);
    }

    return res.status(200).json(updatedComplaint);
  } catch (error) {
    console.error('Update case status error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 5. Add Notes (must be assigned to this officer)
async function addOfficerNote(req, res) {
  try {
    const officerId = req.user.id;
    const { caseId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const complaint = await Complaint.findOne({ where: { id: caseId, officerId } });
    if (!complaint) {
      return res.status(404).json({ error: 'Case not found or not assigned to this officer.' });
    }

    const newNote = await OfficerNote.create({
      note,
      officerId,
      complaintId: caseId,
      officerName: req.user.name,
      createdAt: new Date(),
    });

    // Emit socket notification/update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_note_added', { complaintId: complaint.complaintId, note: newNote });
    }

    return res.status(200).json(newNote);
  } catch (error) {
    console.error('Add officer note error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 6. Upload Evidence File (must be assigned to this officer)
async function uploadEvidence(req, res) {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    uploadedFilePath = req.file.filename;
    const officerId = req.user.id;
    const { complaintId } = req.body;

    if (!complaintId) {
      // Clean up orphaned uploaded file
      cleanupFile(req.file.filename);
      return res.status(400).json({ error: 'Complaint ID (complaintId) is required.' });
    }

    const complaint = await Complaint.findOne({ where: { id: complaintId, officerId } });
    if (!complaint) {
      // Clean up orphaned uploaded file
      cleanupFile(req.file.filename);
      return res.status(404).json({ error: 'Case not found or not assigned to this officer.' });
    }

    let fileHash = null;
    let fileSize = req.file.size || null;
    let mimeType = req.file.mimetype || null;
    let metadataJson = JSON.stringify({
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      uploadedAt: new Date(),
    });

    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const fullPath = path.resolve(uploadDir, req.file.filename);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }
    } catch (err) {
      console.error('Evidence file forensics error:', err);
    }

    const evidence = await EvidenceUpload.create({
      complaintId,
      officerId,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      uploadedAt: new Date(),
      fileHash,
      fileSize,
      mimeType,
      metadataJson,
    });

    // Automatically create timeline event for evidence upload
    await createTimelineEvent(
      complaint.complaintId,
      'EVIDENCE_COLLECTED',
      `Evidence file collected: ${req.file.originalname}`,
      req.user.name,
      req.user.role,
      req.app.get('io')
    );

    // Log action to AuditLog
    try {
      await AuditLog.create({
        userId: req.user.id,
        userName: req.user.name,
        action: 'EVIDENCE_UPLOADED',
        details: `Officer uploaded evidence file "${evidence.fileName}" for complaint ${complaint.complaintId}.`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (err) {
      console.error('Failed to log evidence upload audit:', err);
    }


    // Emit socket notification/update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_evidence_added', { complaintId: complaint.complaintId, evidence });
    }

    // Save notification in DB for all Admin users and emit to their rooms
    try {
      const admins = await User.findAll({ where: { role: 'ROLE_ADMIN' } });
      const adminNotifications = admins.map(admin => ({
        userId: admin.id,
        title: 'New Evidence Uploaded',
        message: `New evidence uploaded for complaint ${complaint.complaintId} by ${req.user.name}`,
        type: 'INFO',
        isRead: false
      }));
      const createdAdminNotifs = await Notification.bulkCreate(adminNotifications);
      if (io) {
        for (const notif of createdAdminNotifs) {
          io.to(`user_${notif.userId}`).emit('notification', notif);
        }
      }
    } catch (error) {
      console.error('Error creating evidence upload notifications:', error);
    }

    return res.status(200).json(evidence);
  } catch (error) {
    console.error('Upload evidence error:', error);
    if (req.file) {
      cleanupFile(req.file.filename);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper function to delete orphaned uploaded files
function cleanupFile(fileName) {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.resolve(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up orphaned file: ${filePath}`);
    }
  } catch (err) {
    console.error('Failed to cleanup file:', err);
  }
}

module.exports = {
  getDashboardStats,
  getAssignedCases,
  getCaseDetails,
  updateCaseStatus,
  addOfficerNote,
  uploadEvidence,
};
