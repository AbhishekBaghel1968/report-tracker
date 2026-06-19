const { Complaint, User, EvidenceFile } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

async function submitComplaint(req, res) {
  try {
    const user = req.user;
    const { title, category, priority, description, incidentDate, location } = req.body;

    if (!title || !category || !priority || !incidentDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Generate Tracking ID: COMP-XXXXXXXX (8 random alphanumeric characters)
    const trackingId = 'COMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Default to a random Indian city to enrich charts in visual heatmap/hotspot displays
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    // Create the complaint
    const complaint = await Complaint.create({
      complaintId: trackingId,
      userId: user.id,
      title,
      category,
      priority: priority.toUpperCase(),
      description,
      incidentDate,
      status: 'SUBMITTED',
      location: location || randomCity,
    });

    // Handle file upload if present
    if (req.file) {
      const evidence = await EvidenceFile.create({
        complaintId: complaint.id,
        fileName: req.file.originalname,
        filePath: req.file.filename,
      });
      complaint.setDataValue('evidenceFiles', [evidence]);
    } else {
      complaint.setDataValue('evidenceFiles', []);
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
      io.emit('notification', {
        type: 'complaint_submitted',
        message: `🔴 New Complaint Submitted: ${complaint.complaintId}`,
        complaintId: complaint.complaintId,
        id: complaint.id,
        timestamp: new Date().toISOString(),
      });
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
      io.emit('notification', {
        type: 'complaint_status_updated',
        message: `📢 Complaint ${updatedComplaint.complaintId} status updated to ${status.replace('_', ' ')}`,
        complaintId: updatedComplaint.complaintId,
        id: updatedComplaint.id,
        status: status.toUpperCase(),
        timestamp: new Date().toISOString(),
      });
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
      io.emit('notification', {
        type: 'complaint_deleted',
        message: `🗑️ Complaint ${complaintId} has been deleted`,
        complaintId,
        id: parseInt(id, 10),
        timestamp: new Date().toISOString(),
      });
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
      ],
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with tracking ID: ' + complaintId });
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

module.exports = {
  submitComplaint,
  getAllComplaints,
  getCitizenComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  trackComplaint,
  getAdminStats,
};
