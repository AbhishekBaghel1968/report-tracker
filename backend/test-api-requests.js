const axios = require('axios');

async function test() {
  const baseURL = 'http://localhost:8080/api';
  console.log("Simulating Admin Login...");
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log("Logged in successfully! Token received:", token.substring(0, 20) + "...");

    const api = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${token}` }
    });

    const endpoints = [
      '/admin/stats',
      '/analytics/monthly?filter=1y',
      '/analytics/category?filter=1y',
      '/analytics/status?filter=1y',
      '/analytics/heatmap?filter=1y',
      '/analytics/hotspots?filter=1y',
      '/complaints',
      '/admin/officers',
      '/admin/users'
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await api.get(endpoint);
        console.log(`GET ${endpoint} -> OK (Status ${res.status}), data length/keys:`, Array.isArray(res.data) ? res.data.length : Object.keys(res.data));
      } catch (err) {
        console.error(`GET ${endpoint} -> FAILED:`, err.response ? `${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message);
      }
    }
  } catch (err) {
    console.error("Login failed:", err.response ? `${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message);
  }
}

test();
