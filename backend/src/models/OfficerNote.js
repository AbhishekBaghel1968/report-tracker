const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OfficerNote = sequelize.define('OfficerNote', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  officerId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'officer_id',
  },
  complaintId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'complaint_id',
  },
  officerName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'officer_name',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'officer_notes',
  timestamps: false,
});

module.exports = OfficerNote;
