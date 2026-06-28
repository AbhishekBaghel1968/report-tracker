const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  complaintId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'complaint_id',
  },
  senderId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'sender_id',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  updatedAt: false, // We only need createdAt for chat histories
});

module.exports = ChatMessage;
