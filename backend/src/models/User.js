const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('ROLE_CITIZEN', 'ROLE_ADMIN', 'ROLE_OFFICER'),
    allowNull: false,
    defaultValue: 'ROLE_CITIZEN',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'DISABLED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'users',
  updatedAt: false, // Turn off updatedAt as the existing schema does not contain this column
});

module.exports = User;
