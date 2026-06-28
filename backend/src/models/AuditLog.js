const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'user_id',
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'System',
    field: 'user_name',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address',
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // We only need createdAt for audit trails
});

module.exports = AuditLog;
