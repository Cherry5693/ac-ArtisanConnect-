// frontend/src/services/recoService.js
import api from './axiosConfig';

// candidates: [{ id, category, price, material }]
export async function getRecommendations({ userId, lat, lon, candidates }) {
  const nowIso = new Date().toISOString();
  const { data } = await api.post('/reco', {
    user_id: userId,
    lat,
    lon,
    now_iso: nowIso,
    candidate_items: candidates,
  });
  return data.recommendations; // [itemId, ...]
}

