const { kv } = require('@vercel/kv');

// Échange le code OAuth contre access_token + refresh_token,
// récupère l'ID Discord du user, stocke tout dans Vercel KV.
module.exports = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Code manquant.');

  // 1. Échanger le code contre les tokens
  let tokenData;
  try {
    const r = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.REDIRECT_URI,
      }),
    });
    tokenData = await r.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
  } catch (e) {
    console.error('[callback] token exchange failed:', e.message);
    return res.status(500).send('Échec de l\'échange du code.');
  }

  const { access_token, refresh_token, expires_in, token_type } = tokenData;

  // 2. Récupérer l'ID Discord du user
  let userId;
  try {
    const r = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` },
    });
    const user = await r.json();
    userId = user.id;
    if (!userId) throw new Error('ID manquant dans la réponse user');
  } catch (e) {
    console.error('[callback] user fetch failed:', e.message);
    return res.status(500).send('Impossible de récupérer l\'utilisateur.');
  }

  // 3. Stocker dans Vercel KV
  // Clé : user:{userId} → objet token
  // Set Redis "users" → liste de tous les userIds pour itération rapide
  const expiresAt = Date.now() + expires_in * 1000;
  await kv.set(`user:${userId}`, JSON.stringify({ userId, access_token, refresh_token, expiresAt }));
  await kv.sadd('users', userId);

  // 4. Rediriger vers la page de succès
  res.redirect('/?success=1');
};
