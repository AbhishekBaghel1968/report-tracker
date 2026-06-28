const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EvidenceUpload = sequelize.define('EvidenceUpload', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_name',
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path',
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at',
  },
  complaintId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'complaint_id',
  },
  officerId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'officer_id',
  },
  fileHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_hash',
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'file_size',
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'mime_type',
  },
  metadataJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'metadata_json',
  },
}, {
  tableName: 'evidence_uploads',
  timestamps: false,
});

module.exports = EvidenceUpload;
