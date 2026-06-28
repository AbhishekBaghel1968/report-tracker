const { Notification, User } = require('../models');

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

async function markAllAsRead(req, res) {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function archiveNotification(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isArchived = true;
    notification.isRead = true; // Auto-mark read on archive for better UX
    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Archive notification error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function clearNotifications(req, res) {
  try {
    await Notification.destroy({
      where: { userId: req.user.id }
    });
    return res.status(200).json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Clear notifications error:', error);
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

async function broadcastNotification(req, res) {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Fetch all users to persist notification for each
    const users = await User.findAll({ attributes: ['id'] });
    if (users.length === 0) {
      return res.status(200).json({ message: 'No users to broadcast to' });
    }

    const notificationsData = users.map(user => ({
      userId: user.id,
      title,
      message,
      type: type || 'INFO',
      isRead: false,
      isArchived: false,
    }));

    const createdNotifications = await Notification.bulkCreate(notificationsData);

    // Emit live Socket.IO notification to user rooms for all currently connected users
    const io = req.app.get('io');
    if (io) {
      for (const notif of createdNotifications) {
        io.to(`user_${notif.userId}`).emit('notification', notif);
      }
    }

    return res.status(201).json({ message: 'Broadcast sent successfully', count: createdNotifications.length });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  clearNotifications,
  deleteNotification,
  broadcastNotification,
};
