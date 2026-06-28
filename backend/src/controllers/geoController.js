const geoService = require('../services/geoService');

/**
 * GET /api/admin/geo-analytics
 * Fetch aggregated geo complaint data filtered by category, status, and date ranges.
 */
async function getGeoAnalytics(req, res) {
  try {
    const { category, status, startDate, endDate, filter } = req.query;
    
    const geoData = await geoService.getGeoAnalyticsData({
      category,
      status,
      startDate,
      endDate,
      filter
    });
    
    return res.status(200).json(geoData);
  } catch (error) {
    console.error('Error fetching geo analytics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getGeoAnalytics
};
