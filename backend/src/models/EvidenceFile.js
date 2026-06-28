const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EvidenceFile = sequelize.define('EvidenceFile', {
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
  tableName: 'evidence_files',
  timestamps: false,
});

module.exports = EvidenceFile;
