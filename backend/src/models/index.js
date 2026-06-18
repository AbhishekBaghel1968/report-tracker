const User = require('./User');
const Complaint = require('./Complaint');
const EvidenceFile = require('./EvidenceFile');

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

Complaint.hasMany(EvidenceFile, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'evidenceFiles',
  onDelete: 'CASCADE',
});
EvidenceFile.belongsTo(Complaint, {
  foreignKey: { name: 'complaintId', field: 'complaint_id', allowNull: false },
  as: 'complaint',
});

module.exports = {
  User,
  Complaint,
  EvidenceFile,
};
