const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('INFO', 'WARNING', 'SUCCESS', 'ERROR'),
    allowNull: false,
    defaultValue: 'INFO',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_archived',
  },
}, {
  tableName: 'notifications',
  timestamps: true, // We want createdAt and updatedAt for notifications
  updatedAt: false, // We only need createdAt (standard timestamps) but we can disable updatedAt if not needed
});

module.exports = Notification;
