// Page privée des statistiques : /.netlify/functions/scans?k=VOTRE_CLE
// La clé est la variable d'environnement STATS_KEY (Netlify). Sans clé définie, la page est désactivée.
const { getStore } = require('@netlify/blobs');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NOM = { scan: 'Scans du code QR', 'clic-reserver': 'Clics Réserver', 'clic-galerie': 'Clics Galerie', 'clic-accueil': 'Clics Site', 'clic-courriel': 'Clics Courriel', 'clic-contact': 'Clics Enregistrer le contact', 'clic-instagram': 'Clics Instagram', 'clic-facebook': 'Clics Facebook' };

exports.handler = async event => {
  const cle = process.env.STATS_KEY;
  if (!cle || (event.queryStringParameters || {}).k !== cle) return { statusCode: 404, body: 'Introuvable' };
  const store = getStore('scans');
  const { blobs } = await store.list();
  const jours = (await Promise.all(blobs.map(async b => [b.key, (await store.get(b.key, { type: 'json' })) || {}]))).sort((a, b) => b[0].localeCompare(a[0]));
  const tot = {};
  jours.forEach(([, d]) => Object.keys(d).forEach(n => { tot[n] = (tot[n] || 0) + d[n]; }));
  const cols = Object.keys(NOM).filter(n => tot[n]);
  const th = cols.map(n => `<th>${esc(NOM[n])}</th>`).join('');
  const lignes = jours.slice(0, 60).map(([j, d]) => `<tr><td>${esc(j)}</td>${cols.map(n => `<td>${d[n] || 0}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Statistiques</title><style>body{margin:0;padding:32px 20px;background:#000;color:#fff;font:14px/1.5 ui-monospace,Menlo,monospace}h1{font:900 20px/1 sans-serif;letter-spacing:-.03em;text-transform:uppercase;margin:0 0 24px}.big{display:flex;gap:32px;flex-wrap:wrap;margin-bottom:32px}.big div span{display:block;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.big div b{font:900 36px/1.1 sans-serif}table{border-collapse:collapse;width:100%;max-width:900px}th,td{text-align:left;padding:8px 12px 8px 0;border-bottom:1px solid #222}th{color:#888;font-weight:400;font-size:11px;text-transform:uppercase;letter-spacing:.08em}</style></head><body><h1>Carte d’affaires</h1><div class="big">${cols.map(n => `<div><span>${esc(NOM[n])}</span><b>${tot[n]}</b></div>`).join('') || '<div><span>Aucune donnée</span><b>0</b></div>'}</div><table><tr><th>Jour</th>${th}</tr>${lignes}</table></body></html>`;
  return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }, body: html };
};
