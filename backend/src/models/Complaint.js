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
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown',
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown',
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  officerId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'officer_id',
  },
  aiSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_summary',
  },
  aiCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ai_category',
  },
  aiPriority: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ai_priority',
  },
  aiRiskScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ai_risk_score',
  },
  aiIocs: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_iocs',
  },
  fraudRiskLevel: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fraud_risk_level',
  },
  fraudReasons: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'fraud_reasons',
  },
}, {
  tableName: 'complaints',
});

module.exports = Complaint;
