// Redirige vers la page d'authorisation Discord OAuth2.
// Scopes : identify (récupérer l'ID user) + guilds.join (ajouter à n'importe quel serveur plus tard).
module.exports = (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID,
    redirect_uri:  process.env.REDIRECT_URI,          // ex: https://ton-projet.vercel.app/api/callback
    response_type: 'code',
    scope:         'identify guilds.join',
    prompt:        'none',                             // pas de re-consent si déjà autorisé
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
};
