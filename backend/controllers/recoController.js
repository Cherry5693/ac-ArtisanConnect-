const { embedTexts } = require('../utils/hfClient');

// cosine similarity: (A·B)/(|A||B|)
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

exports.recommend = async (req, res) => {
  try {
    const { user_id, lat, lon, now_iso, candidate_items = [], context = {} } = req.body;

    // 1) Build a simple “context string” for the user + situation (festival/weather/etc.)
    const ctx = [
      `user=${user_id || 'guest'}`,
      `lat=${lat}`, `lon=${lon}`, `time=${now_iso || new Date().toISOString()}`,
      `festival=${context.festival || 'none'}`,
      `weather=${context.weather || 'normal'}`
    ].join('; ');

    // 2) Build a short text per item (title/category/material/description if present)
    const itemIds = candidate_items.map(c => c.id);
    const itemTexts = candidate_items.map(c => {
      const parts = [
        c.name, c.category, c.material,
        c.description,
        c.tags ? c.tags.join(' ') : ''
      ].filter(Boolean);
      return parts.join(' | ');
    });

    // 3) Get embeddings for [context, ...items]
    const [ctxVec, ...itemVecs] = await embedTexts([ctx, ...itemTexts]);

    // 4) Rank by cosine similarity
    const scored = itemVecs.map((v, i) => ({ id: itemIds[i], score: cosine(ctxVec, v) }));
    scored.sort((a, b) => b.score - a.score);

    // 5) Return top N ids
    return res.json({ recommendations: scored.slice(0, 10).map(s => s.id) });
  } catch (e) {
    console.error('Reco error:', e?.response?.data || e?.message);
    const status = e?.response?.status || 502;
    return res.status(status).json({ message: 'Embedding/Ranking failed', detail: e?.response?.data || e?.message });
  }
};
