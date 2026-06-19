const User = require('./User');
const Complaint = require('./Complaint');
const EvidenceFile = require('./EvidenceFile');
const OfficerNote = require('./OfficerNote');
const EvidenceUpload = require('./EvidenceUpload');

// Setup Associations
User.hasMany(Complaint, {
  foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
  as: 'complaints',
  onDelete: 'CASCADE',
});
Complaint.belongsTo(User, {
  foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
  as: 'user',
});
Complaint.belongsTo(User, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: true },
  as: 'officer',
});
User.hasMany(Complaint, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: true },
  as: 'assignedComplaints',
});

Complaint.hasMany(EvidenceFile, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'evidenceFiles',
  onDelete: 'CASCADE',
});
EvidenceFile.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'complaint',
});

// Officer Notes Associations
Complaint.hasMany(OfficerNote, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'officerNotes',
  onDelete: 'CASCADE',
});
OfficerNote.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'complaint',
});
OfficerNote.belongsTo(User, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: false },
  as: 'officer',
});
User.hasMany(OfficerNote, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: false },
  as: 'officerNotes',
});

// Evidence Uploads Associations
Complaint.hasMany(EvidenceUpload, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'evidenceUploads',
  onDelete: 'CASCADE',
});
EvidenceUpload.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'complaint',
});
EvidenceUpload.belongsTo(User, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: false },
  as: 'officer',
});
User.hasMany(EvidenceUpload, {
  foreignKey: { name: 'officerId', field: 'officer_id', allowNull: false },
  as: 'uploadedEvidence',
});

module.exports = {
  User,
  Complaint,
  EvidenceFile,
  OfficerNote,
  EvidenceUpload,
};
