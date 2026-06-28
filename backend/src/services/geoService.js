const { Op } = require('sequelize');
const { Complaint } = require('../models');

// Catalog of major Indian cities with their states and GPS coordinates
const CITY_CATALOG = {
  'delhi': { city: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  'mumbai': { city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  'bangalore': { city: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  'chennai': { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  'hyderabad': { city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  'pune': { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  'kolkata': { city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  'agra': { city: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081 },
  'lucknow': { city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  'jaipur': { city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  'ahmedabad': { city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  'patna': { city: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
  'bhopal': { city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  'chandigarh': { city: 'Chandigarh', state: 'Punjab', latitude: 30.7333, longitude: 76.7794 },
  'noida': { city: 'Noida', state: 'Uttar Pradesh', latitude: 28.5355, longitude: 77.3910 },
  'gurugram': { city: 'Gurugram', state: 'Haryana', latitude: 28.4595, longitude: 77.0266 },
  'surat': { city: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311 },
  'visakhapatnam': { city: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 },
  'kanpur': { city: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319 },
  'nagpur': { city: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  'indore': { city: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
  'thane': { city: 'Thane', state: 'Maharashtra', latitude: 19.2183, longitude: 72.9781 },
  'kochi': { city: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  'amritsar': { city: 'Amritsar', state: 'Punjab', latitude: 31.6340, longitude: 74.8723 }
};

/**
 * Get coordinates and state for a city name.
 * @param {string} rawCity - The name of the city.
 */
function getLocationData(rawCity) {
  if (!rawCity) return getRandomLocation();
  
  const searchKey = rawCity.trim().toLowerCase();
  
  // Exact match
  if (CITY_CATALOG[searchKey]) {
    return CITY_CATALOG[searchKey];
  }
  
  // Partial match search
  for (const [key, val] of Object.entries(CITY_CATALOG)) {
    if (searchKey.includes(key) || key.includes(searchKey)) {
      return val;
    }
  }
  
  // Fallback to random location from the catalog
  return getRandomLocation();
}

/**
 * Get a random location from the catalog.
 */
function getRandomLocation() {
  const keys = Object.keys(CITY_CATALOG);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return CITY_CATALOG[randomKey];
}

/**
 * Enrich complaint record with location metadata.
 * @param {object} complaint - The complaint model instance.
 */
function enrichComplaintLocation(complaint) {
  const locationField = complaint.location || '';
  const geoInfo = getLocationData(locationField);
  
  return {
    city: geoInfo.city,
    state: geoInfo.state,
    latitude: geoInfo.latitude,
    longitude: geoInfo.longitude
  };
}

/**
 * Get Geo-Analytics grouped by city, incorporating active query filters.
 * @param {object} filters - { category, status, startDate, endDate, filter }
 */
async function getGeoAnalyticsData(filters = {}) {
  const where = {};
  
  if (filters.category) {
    where.category = filters.category;
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  // Date window filters (7d, 30d, 1y)
  if (filters.filter) {
    const now = new Date();
    if (filters.filter === '7d') {
      where.createdAt = { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (filters.filter === '30d') {
      where.createdAt = { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (filters.filter === '1y') {
      where.createdAt = { [Op.gte]: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    }
  }
  
  // Custom date range filters
  if (filters.startDate || filters.endDate) {
    if (!where.createdAt) where.createdAt = {};
    if (filters.startDate) {
      where.createdAt[Op.gte] = new Date(filters.startDate + 'T00:00:00');
    }
    if (filters.endDate) {
      where.createdAt[Op.lte] = new Date(filters.endDate + 'T23:59:59');
    }
  }
  
  // Query all complaints matching filters
  const complaints = await Complaint.findAll({ where });
  const cityGroups = {};
  
  for (const c of complaints) {
    let city = c.city;
    let state = c.state;
    let lat = c.latitude;
    let lng = c.longitude;
    
    // If coordinates are missing, geocode on-the-fly and update DB asynchronously
    if (!city || city === 'Unknown' || !lat || !lng) {
      const enriched = enrichComplaintLocation(c);
      city = enriched.city;
      state = enriched.state;
      lat = enriched.latitude;
      lng = enriched.longitude;
      
      // Update DB row asynchronously
      c.city = city;
      c.state = state;
      c.latitude = lat;
      c.longitude = lng;
      c.save().catch(err => console.error(`Failed to enrich complaint ${c.id}:`, err));
    }
    
    const key = city.toLowerCase();
    if (!cityGroups[key]) {
      cityGroups[key] = {
        city,
        state: state || 'Unknown',
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        complaintCount: 0,
        crimes: {}
      };
    }
    
    cityGroups[key].complaintCount += 1;
    cityGroups[key].crimes[c.category] = (cityGroups[key].crimes[c.category] || 0) + 1;
  }
  
  // Format response and determine top crime for each city
  const responseData = Object.values(cityGroups).map(g => {
    let topCrime = 'N/A';
    let maxCount = -1;
    for (const [crime, count] of Object.entries(g.crimes)) {
      if (count > maxCount) {
        maxCount = count;
        topCrime = crime;
      }
    }
    
    return {
      city: g.city,
      state: g.state,
      latitude: g.latitude,
      longitude: g.longitude,
      complaintCount: g.complaintCount,
      topCrime
    };
  });
  
  return responseData;
}

module.exports = {
  CITY_CATALOG,
  getLocationData,
  getRandomLocation,
  enrichComplaintLocation,
  getGeoAnalyticsData
};
