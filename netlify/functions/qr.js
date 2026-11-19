// Compte les scans du code QR de la carte d'affaires et redirige vers /carte/.
// GET /qr           -> +1 scan, redirection vers /carte/
// POST /qr?t=nom    -> +1 clic sur un bouton de la page (envoyé par la page /carte/)
// Les compteurs sont gardés par jour dans Netlify Blobs (rien à configurer).
const { getStore } = require('@netlify/blobs');

const BOT = /bot|crawl|spider|preview|facebookexternalhit|slack|whatsapp|telegram|curl|wget|headless/i;
const OK = /^[a-z0-9-]{1,24}$/;

const jour = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());

exports.handler = async event => {
  const ua = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || '';
  const q = event.queryStringParameters || {};
  const cible = event.httpMethod === 'POST' ? 'clic-' + String(q.t || '') : 'scan';
  try {
    if (!BOT.test(ua) && event.httpMethod !== 'HEAD' && OK.test(cible.replace(/^clic-/, '') || 'x')) {
      const store = getStore('scans');
      const k = jour();
      const d = (await store.get(k, { type: 'json' })) || {};
      d[cible] = (d[cible] || 0) + 1;
      await store.setJSON(k, d);
    }
  } catch (e) { console.error('compteur', e.message); }
  if (event.httpMethod === 'POST') return { statusCode: 204, body: '' };
  return { statusCode: 302, headers: { Location: '/carte/', 'Cache-Control': 'no-store' }, body: '' };
};
