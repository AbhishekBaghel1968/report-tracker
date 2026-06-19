const { User, Complaint, EvidenceFile } = require('../models');
const { Op } = require('sequelize');

/**
 * Fetch total statistics for the SOC Dashboard.
 */
async function getStats(req, res) {
  try {
    const totalUsers = await User.count();
    const totalCases = await Complaint.count();
    
    const pendingCases = await Complaint.count({
      where: {
        status: {
          [Op.notIn]: ['RESOLVED', 'REJECTED'],
        },
      },
    });

    const resolvedCases = await Complaint.count({
      where: { status: 'RESOLVED' },
    });

    // Compute Status Breakdown
    const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
    const statusBreakdown = {};
    for (const status of statuses) {
      statusBreakdown[status] = await Complaint.count({ where: { status } });
    }

    // Compute Category Breakdown
    const categoryResults = await Complaint.findAll({
      attributes: ['category'],
      raw: true
    });
    const categoryBreakdown = {};
    for (const c of categoryResults) {
      if (c.category) {
        categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
      }
    }

    return res.status(200).json({
      totalUsers,
      totalCases,
      pendingCases,
      resolvedCases,
      // Backward compatibility fields
      totalComplaints: totalCases,
      pendingComplaints: pendingCases,
      resolvedComplaints: resolvedCases,
      statusBreakdown,
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch all security officers in the system.
 */
async function getOfficers(req, res) {
  try {
    const officers = await User.findAll({
      where: { role: 'ROLE_OFFICER' },
      attributes: ['id', 'name', 'email', 'phone', 'status'],
      include: [
        {
          model: Complaint,
          as: 'assignedComplaints',
          attributes: ['id', 'complaintId', 'title', 'status', 'priority', 'category', 'incidentDate', 'createdAt'],
        }
      ],
      order: [['name', 'ASC']]
    });

    const formattedOfficers = officers.map(officer => {
      const activeCasesCount = officer.assignedComplaints.filter(
        c => c.status !== 'RESOLVED' && c.status !== 'REJECTED'
      ).length;

      let computedStatus = 'Active';
      if (officer.status === 'DISABLED') {
        computedStatus = 'Suspended';
      } else if (activeCasesCount >= 3) {
        computedStatus = 'Busy';
      } else if (officer.id % 3 === 0) {
        computedStatus = 'Offline';
      } else {
        computedStatus = 'Active';
      }

      return {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        status: computedStatus,
        dbStatus: officer.status,
        assignedCasesCount: activeCasesCount,
        assignedComplaints: officer.assignedComplaints,
      };
    });

    return res.status(200).json(formattedOfficers);
  } catch (error) {
    console.error('Get officers error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Assign a complaint to an officer.
 */
async function assignComplaint(req, res) {
  try {
    const { id } = req.params;
    const { officerId } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    let officerName = 'Unassigned';
    if (officerId) {
      const officer = await User.findOne({ where: { id: officerId, role: 'ROLE_OFFICER' } });
      if (!officer) {
        return res.status(400).json({ error: 'Invalid officer ID' });
      }
      officerName = officer.name;
      complaint.officerId = officerId;
    } else {
      complaint.officerId = null;
    }

    await complaint.save();

    // Reload with associations
    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' }
      ]
    });

    // Emit live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_updated', updatedComplaint);
      io.emit('notification', {
        type: 'complaint_assigned',
        message: `📋 Complaint ${complaint.complaintId} has been assigned to ${officerName}`,
        complaintId: complaint.complaintId,
        id: complaint.id,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json(updatedComplaint);
  } catch (error) {
    console.error('Assign complaint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Assign a complaint to an officer using complaintId.
 */
async function assignComplaintById(req, res) {
  try {
    const { complaintId } = req.params;
    const { officerId } = req.body;

    const isNumeric = /^\d+$/.test(complaintId);
    const complaint = await Complaint.findOne({
      where: isNumeric 
        ? { [Op.or]: [{ id: complaintId }, { complaintId: complaintId }] }
        : { complaintId: complaintId }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    let officerName = 'Unassigned';
    if (officerId) {
      const officer = await User.findOne({ where: { id: officerId, role: 'ROLE_OFFICER' } });
      if (!officer) {
        return res.status(400).json({ error: 'Invalid officer ID' });
      }
      officerName = officer.name;
      complaint.officerId = officerId;
    } else {
      complaint.officerId = null;
    }

    await complaint.save();

    // Reload with associations
    const updatedComplaint = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role'] },
        { model: User, as: 'officer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: EvidenceFile, as: 'evidenceFiles' }
      ]
    });

    // Emit live Socket.IO update
    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_updated', updatedComplaint);
      io.emit('notification', {
        type: 'complaint_assigned',
        message: `📋 Complaint ${complaint.complaintId} has been assigned to ${officerName}`,
        complaintId: complaint.complaintId,
        id: complaint.id,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json(updatedComplaint);
  } catch (error) {
    console.error('Assign complaint by ID error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch all registered users.
 */
async function getUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get admin users error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Update user status.
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id == req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own status' });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({ message: 'User status updated successfully', user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Delete a user.
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getStats,
  getOfficers,
  assignComplaint,
  assignComplaintById,
  getUsers,
  updateUserStatus,
  deleteUser,
};
