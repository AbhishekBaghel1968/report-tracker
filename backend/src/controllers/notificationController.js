const { Notification } = require('../models');

async function getUserNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Get user notifications error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  deleteNotification,
};
