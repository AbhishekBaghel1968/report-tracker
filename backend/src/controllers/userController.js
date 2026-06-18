const bcrypt = require('bcryptjs');
const { User, Complaint } = require('../models');

async function getProfile(req, res) {
  try {
    const user = req.user;
    
    // Fetch citizen's complaints count
    const complaints = await Complaint.findAll({ where: { userId: user.id } });
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED').length;
    const pendingComplaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateProfile(req, res) {
  try {
    const user = req.user;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    user.name = name;
    user.phone = phone;
    await user.save();

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function changePassword(req, res) {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
