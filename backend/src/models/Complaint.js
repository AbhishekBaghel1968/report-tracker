const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  complaintId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'complaint_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  incidentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'incident_date',
  },
  status: {
    type: DataTypes.ENUM('SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'SUBMITTED',
  },
}, {
  tableName: 'complaints',
});

module.exports = Complaint;
