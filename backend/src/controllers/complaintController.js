const { Complaint, User, EvidenceFile, Notification, AuditLog, ChatMessage, OfficerNote, EvidenceUpload } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const { createTimelineEvent } = require('../services/timelineService');

async function submitComplaint(req, res) {
  try {
    const user = req.user;
    const { title, category, priority, description, incidentDate, location, city: bodyCity, state: bodyState, latitude: bodyLat, longitude: bodyLng } = req.body;

    if (!title || !category || !priority || !incidentDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Generate Tracking ID: COMP-XXXXXXXX (8 random alphanumeric characters)
    const trackingId = 'COMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Default to a random Indian city to enrich charts in visual heatmap/hotspot displays
    const geoService = require('../services/geoService');
    const randomGeo = geoService.getRandomLocation();

    let finalCity = bodyCity || location || randomGeo.city;
    let finalState = bodyState;
    let finalLat = bodyLat;
    let finalLng = bodyLng;

    // Resolve coordinates from geoService if not fully provided
    if (!finalState || !finalLat || !finalLng) {
      const geoInfo = geoService.getLocationData(finalCity);
      finalCity = geoInfo.city;
      finalState = finalState || geoInfo.state;
      finalLat = finalLat || geoInfo.latitude;
      finalLng = finalLng || geoInfo.longitude;
    }

    // Create the complaint with AI analysis diagnostics
    const aiResult = await aiService.analyzeComplaint(description || '');
    const complaint = await Complaint.create({
      complaintId: trackingId,
      userId: user.id,
      title,
      category,
      priority: priority.toUpperCase(),
      description,
      incidentDate,
      status: 'SUBMITTED',
      location: finalCity,
      city: finalCity,
      state: finalState,
      latitude: finalLat,
      longitude: finalLng,
      aiSummary: aiResult.aiSummary,
      aiCategory: aiResult.aiCategory,
      aiPriority: aiResult.aiPriority,
      aiRiskScore: aiResult.aiRiskScore,
      aiIocs: aiResult.aiIocs,
      fraudRiskLevel: aiResult.fraudRiskLevel,
      fraudReasons: aiResult.fraudReasons,
    });

    // Handle file upload if present with forensic hashing and sizing
    if (req.file) {
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

      const evidence = await EvidenceFile.create({
        complaintId: complaint.id,
        fileName: req.file.originalname,
        filePath: req.file.filename,
        fileHash,
        fileSize,
        mimeType,
        metadataJson,
      });
      complaint.setDataValue('evidenceFiles', [evidence]);

      // Automatically create timeline event for evidence collection
      await createTimelineEvent(
        trackingId,
        'EVIDENCE_COLLECTED',
        `Evidence file collected: ${req.file.originalname}`,
        user.name,
        user.role,
        req.app.get('io')
      );
    } else {
      complaint.setDataValue('evidenceFiles', []);
    }

    // Automatically create timeline event for submission
    await createTimelineEvent(
      trackingId,
      'SUBMITTED',
      'Complaint registered successfully',
      user.name,
      user.role,
      req.app.get('io')
    );

    // Log action to AuditLog
    try {
      await AuditLog.create({
        userId: user.id,
        userName: user.name,
        action: 'COMPLAINT_SUBMITTED',
        details: `Citizen submitted new incident ${complaint.complaintId}. AI Risk Score: ${aiResult.aiRiskScore}%, Fraud: ${aiResult.fraudRiskLevel}.`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (err) {
      console.error('Failed to log submission audit:', err);
    }

    // Load User details for Spring Boot compatibility
    const userJson = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
    complaint.setDataValue('user', userJson);
    complaint.setDataValue('officer', null);

    // Emit live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_submitted', complaint);
    }

    // Save notification in DB for all Admin users and emit to their rooms
    try {
      const admins = await User.findAll({ where: { role: 'ROLE_ADMIN' } });
      const adminNotifications = admins.map(admin => ({
        userId: admin.id,
        title: 'New Complaint Submitted',
        message: `New complaint submitted by citizen (${complaint.complaintId})`,
        type: 'INFO',
        isRead: false
      }));
      const createdAdminNotifs = await Notification.bulkCreate(adminNotifications);
      if (io) {
        for (const notif of createdAdminNotifs) {
          io.to(`user_${notif.userId}`).emit('notification', notif);
        }
      }
      // Send Email alert to Admins
      await emailService.sendNewComplaintAlert(admins, complaint);
    } catch (error) {
      console.error('Error creating submission notifications/emails:', error);
    }

    return res.status(200).json(complaint);
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getAllComplaints(req, res) {
  try {
    const complaints = await Complaint.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
      ],
    });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error('Get all complaints error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getCitizenComplaints(req, res) {
  try {
    const user = req.user;
    const complaints = await Complaint.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
      ],
    });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error('Get citizen complaints error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getComplaintById(req, res) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with ID: ' + id });
    }

    return res.status(200).json(complaint);
  } catch (error) {
    console.error('Get complaint by id error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with ID: ' + id });
    }

    complaint.status = status.toUpperCase();
    await complaint.save();

    // Automatically create timeline event for status change
    let timelineMessage = `Complaint status updated to ${status.replace('_', ' ')}`;
    let timelineStage = status.toUpperCase();
    if (timelineStage === 'INVESTIGATING') {
      timelineMessage = 'Investigation started by assigned officer';
    } else if (timelineStage === 'RESOLVED') {
      timelineMessage = 'Complaint resolved successfully';
    } else if (timelineStage === 'REJECTED') {
      timelineMessage = 'Complaint rejected';
    } else if (timelineStage === 'UNDER_REVIEW') {
      timelineMessage = 'Admin started reviewing complaint';
    }

    await createTimelineEvent(
      complaint.complaintId,
      timelineStage,
      timelineMessage,
      req.user.name,
      req.user.role,
      req.app.get('io')
    );

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
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
        details: `Updated complaint ${updatedComplaint.complaintId} status to ${status.toUpperCase()}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (err) {
      console.error('Failed to log status change audit:', err);
    }

    // Send Email notification to Citizen
    if (updatedComplaint.user) {
      try {
        await emailService.sendCaseStatusAlert(updatedComplaint.user, updatedComplaint);
      } catch (err) {
        console.error('Failed to send status alert email:', err);
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
    console.error('Update complaint status error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function deleteComplaint(req, res) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaintId = complaint.complaintId;
    await complaint.destroy();

    // Emit live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_deleted', { id: parseInt(id, 10), complaintId });
    }

    return res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function trackComplaint(req, res) {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findOne({
      where: { complaintId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: OfficerNote, as: 'officerNotes' },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with tracking ID: ' + complaintId });
    }

    // Sort officer notes by date descending in memory
    if (complaint.officerNotes) {
      complaint.officerNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json(complaint);
  } catch (error) {
    console.error('Track complaint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getAdminStats(req, res) {
  try {
    const totalUsers = await User.count();
    const totalComplaints = await Complaint.count();

    const pendingComplaints = await Complaint.count({
      where: {
        status: {
          [Op.notIn]: ['RESOLVED', 'REJECTED'],
        },
      },
    });

    const resolvedComplaints = await Complaint.count({
      where: { status: 'RESOLVED' },
    });

    // Status Breakdown
    const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
    const statusBreakdown = {};
    for (const status of statuses) {
      statusBreakdown[status] = await Complaint.count({ where: { status } });
    }

    // Category Breakdown
    const complaints = await Complaint.findAll({ attributes: ['category'] });
    const categoryBreakdown = {};
    for (const c of complaints) {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    }

    return res.status(200).json({
      totalUsers,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      statusBreakdown,
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getComplaintTimeline(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' },
        { model: EvidenceUpload, as: 'evidenceUploads' },
        { model: OfficerNote, as: 'officerNotes' },
        { model: ChatMessage, as: 'chatMessages', include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }] }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with ID: ' + id });
    }

    // Check authorization: User must be citizen, officer, or admin
    const isCitizen = complaint.userId == user.id;
    const isOfficer = complaint.officerId == user.id;
    const isAdmin = user.role === 'ROLE_ADMIN';

    if (!isCitizen && !isOfficer && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to view this case history.' });
    }

    // Assemble timeline items
    const timeline = [];

    // 1. Complaint submitted
    timeline.push({
      id: 'evt-submitted',
      type: 'SUBMITTED',
      title: 'Complaint Submitted',
      description: `Complaint ${complaint.complaintId} was filed successfully by citizen ${complaint.user?.name || 'Anonymous'}.`,
      timestamp: complaint.createdAt,
      category: 'incident',
      icon: 'file-text'
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
        icon: 'activity'
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
        icon: 'user'
      });
    }

    // 4. Status update
    if (complaint.status !== 'SUBMITTED') {
      timeline.push({
        id: 'evt-status-change',
        type: 'STATUS_UPDATE',
        title: 'Caseload Status Shift',
        description: `Status updated to ${complaint.status.replace('_', ' ')}.`,
        timestamp: complaint.updatedAt,
        category: 'milestone',
        icon: 'shield'
      });
    }

    // 5. Citizen evidence files
    if (complaint.evidenceFiles) {
      complaint.evidenceFiles.forEach((file, index) => {
        timeline.push({
          id: `evt-cit-file-${file.id}`,
          type: 'CITIZEN_EVIDENCE',
          title: `Evidence File Attached`,
          description: `Citizen uploaded file "${file.fileName}". Sha256: ${file.fileHash || 'Pending'}, Size: ${file.fileSize ? (file.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}.`,
          timestamp: file.uploadedAt || complaint.createdAt,
          category: 'evidence',
          icon: 'paperclip'
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
          icon: 'shield'
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
          icon: 'clock'
        });
      });
    }

    // 8. Chat messages
    if (complaint.chatMessages) {
      complaint.chatMessages.forEach((msg) => {
        timeline.push({
          id: `evt-chat-${msg.id}`,
          type: 'CHAT_MESSAGE',
          title: `Chat Log Transmission`,
          description: `[${msg.sender?.role.replace('ROLE_', '')}] ${msg.sender?.name}: "${msg.message}"`,
          timestamp: msg.createdAt,
          category: 'chat',
          icon: 'send'
        });
      });
    }

    // Sort timeline items chronologically (oldest first)
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.status(200).json(timeline);
  } catch (error) {
    console.error('Get timeline error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  submitComplaint,
  getAllComplaints,
  getCitizenComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  trackComplaint,
  getAdminStats,
  getComplaintTimeline,
};
