const analyticsService = require('../services/analyticsService');

/**
 * Fetch monthly complaint counts.
 */
async function getMonthly(req, res) {
  try {
    const { filter } = req.query;
    const data = await analyticsService.getMonthlyAnalytics(filter);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch complaint counts grouped by category.
 */
async function getCategory(req, res) {
  try {
    const { filter } = req.query;
    const data = await analyticsService.getCategoryAnalytics(filter);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch complaint counts grouped by status.
 */
async function getStatus(req, res) {
  try {
    const { filter } = req.query;
    const data = await analyticsService.getStatusAnalytics(filter);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching status analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch daily/hourly complaints heatmap.
 */
async function getHeatmap(req, res) {
  try {
    const { filter } = req.query;
    const data = await analyticsService.getHeatmapAnalytics(filter);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching heatmap analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch fraud hotspots (complaint locations).
 */
async function getHotspots(req, res) {
  try {
    const { filter } = req.query;
    const data = await analyticsService.getHotspotAnalytics(filter);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching hotspot analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getMonthly,
  getCategory,
  getStatus,
  getHeatmap,
  getHotspots
};
