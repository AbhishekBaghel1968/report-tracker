const { Op } = require('sequelize');
const { Complaint } = require('../models');
const { sequelize } = require('../config/db');

/**
 * Build date range query filters.
 * @param {string} filter - '7d' | '30d' | '1y' | 'all'
 */
function getDateFilter(filter) {
  const where = {};
  const now = new Date();
  
  if (filter === '7d') {
    where.createdAt = {
      [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    };
  } else if (filter === '30d') {
    where.createdAt = {
      [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
  } else if (filter === '1y') {
    where.createdAt = {
      [Op.gte]: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };
  }
  return where;
}

/**
 * Fetch monthly complaint counts.
 */
async function getMonthlyAnalytics(filter) {
  const where = getDateFilter(filter);
  
  const results = await Complaint.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%b'), 'month'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where,
    group: [
      sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%b'),
      sequelize.fn('MONTH', sequelize.col('created_at'))
    ],
    order: [
      [sequelize.fn('MONTH', sequelize.col('created_at')), 'ASC']
    ],
    raw: true
  });
  
  return results.map(r => ({
    month: r.month,
    count: parseInt(r.count, 10) || 0
  }));
}

/**
 * Fetch complaint counts grouped by category.
 */
async function getCategoryAnalytics(filter) {
  const where = getDateFilter(filter);
  
  const results = await Complaint.findAll({
    attributes: [
      ['category', 'name'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'value']
    ],
    where,
    group: ['category'],
    raw: true
  });
  
  return results.map(r => ({
    name: r.name,
    value: parseInt(r.value, 10) || 0
  }));
}

/**
 * Fetch complaint counts grouped by status.
 */
async function getStatusAnalytics(filter) {
  const where = getDateFilter(filter);
  
  const results = await Complaint.findAll({
    attributes: [
      ['status', 'status'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where,
    group: ['status'],
    raw: true
  });
  
  // Format status values for frontend display (e.g. UNDER_REVIEW -> Under Review)
  const formatStatusText = (status) => {
    if (!status) return '';
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return results.map(r => ({
    status: formatStatusText(r.status),
    count: parseInt(r.count, 10) || 0
  }));
}

/**
 * Fetch daily/hourly complaints heatmap.
 */
async function getHeatmapAnalytics(filter) {
  const where = getDateFilter(filter);
  
  const results = await Complaint.findAll({
    attributes: [
      [sequelize.fn('DAYNAME', sequelize.col('created_at')), 'day'],
      [sequelize.fn('HOUR', sequelize.col('created_at')), 'hour'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where,
    group: [
      sequelize.fn('DAYNAME', sequelize.col('created_at')),
      sequelize.fn('HOUR', sequelize.col('created_at'))
    ],
    raw: true
  });
  
  return results.map(r => ({
    day: r.day || 'Sunday',
    hour: parseInt(r.hour, 10) || 0,
    count: parseInt(r.count, 10) || 0
  }));
}

/**
 * Fetch complaint counts grouped by location.
 */
async function getHotspotAnalytics(filter) {
  const where = getDateFilter(filter);
  
  const results = await Complaint.findAll({
    attributes: [
      ['location', 'name'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'value']
    ],
    where,
    group: ['location'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    raw: true
  });
  
  return results.map(r => ({
    name: r.name || 'Unknown',
    value: parseInt(r.value, 10) || 0
  }));
}

module.exports = {
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getStatusAnalytics,
  getHeatmapAnalytics,
  getHotspotAnalytics
};
