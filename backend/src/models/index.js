const User = require('./User');
const Complaint = require('./Complaint');
const EvidenceFile = require('./EvidenceFile');
const OfficerNote = require('./OfficerNote');
const EvidenceUpload = require('./EvidenceUpload');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const ChatMessage = require('./ChatMessage');
const ComplaintTimeline = require('./ComplaintTimeline');

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

// Notification Associations
User.hasMany(Notification, {
  foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
  as: 'user',
});

// AuditLog associations (only needs belongsTo if we query logs with users)
AuditLog.belongsTo(User, {
  foreignKey: { name: 'userId', field: 'user_id', allowNull: true },
  as: 'user',
});

// ChatMessage associations
Complaint.hasMany(ChatMessage, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'chatMessages',
  onDelete: 'CASCADE',
});
ChatMessage.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'complaint',
});
User.hasMany(ChatMessage, {
  foreignKey: { name: 'senderId', field: 'sender_id', allowNull: false },
  as: 'chatMessages',
  onDelete: 'CASCADE',
});
ChatMessage.belongsTo(User, {
  foreignKey: { name: 'senderId', field: 'sender_id', allowNull: false },
  as: 'sender',
});

// ComplaintTimeline associations
Complaint.hasMany(ComplaintTimeline, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  sourceKey: 'complaintId',
  as: 'timelineEntries',
  onDelete: 'CASCADE',
});
ComplaintTimeline.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  targetKey: 'complaintId',
  as: 'complaint',
});

module.exports = {
  User,
  Complaint,
  EvidenceFile,
  OfficerNote,
  EvidenceUpload,
  Notification,
  AuditLog,
  ChatMessage,
  ComplaintTimeline,
};
