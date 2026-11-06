const { kv } = require('@vercel/kv');

// Nombre d'auths collectées — utilisé par la landing page (counter en temps réel).
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const count = await kv.scard('users');
    return res.json({ count: count || 0 });
  } catch {
    return res.json({ count: 0 });
  }
};
