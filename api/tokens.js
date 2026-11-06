const { kv } = require('@vercel/kv');

// Retourne tous les tokens stockés.
// Protégé par le header X-Secret — seul le bot (qui connaît SECRET_KEY) peut appeler ça.
module.exports = async (req, res) => {
  if (req.headers['x-secret'] !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Récupérer tous les userIds du set Redis
    const userIds = await kv.smembers('users');
    if (!userIds || userIds.length === 0) return res.json([]);

    // Récupérer chaque token en parallèle
    const entries = await Promise.all(
      userIds.map(async (id) => {
        const raw = await kv.get(`user:${id}`);
        if (!raw) return null;
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      })
    );

    return res.json(entries.filter(Boolean));
  } catch (e) {
    console.error('[tokens] KV error:', e.message);
    return res.status(500).json({ error: 'KV error' });
  }
};
