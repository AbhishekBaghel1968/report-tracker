const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ComplaintTimeline = sequelize.define('ComplaintTimeline', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  complaintId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'complaint_id',
  },
  stage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'updated_by',
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'complaint_timeline',
  underscored: true,
  timestamps: true,
});

module.exports = ComplaintTimeline;
