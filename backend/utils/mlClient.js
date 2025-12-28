const axios = require('axios');
const base = process.env.ML_SERVICE_URL || 'http://localhost:8001';

async function fetchRecommendations(payload) {
  const { data } = await axios.post(`${base}/recommend`, payload, { timeout: 5000 });
  return data.recommendations;
}

module.exports = { fetchRecommendations };
