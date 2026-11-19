// Aperçu ou envoi immédiat du rapport. Protégé : ne fonctionne que si la variable REPORT_KEY existe dans Netlify.
//   /api/rapport?key=VOTRE_CLE            : affiche le rapport PDF dans le navigateur (&format=html pour la version courriel)
//   /api/rapport?key=VOTRE_CLE&envoyer=1  : l'envoie tout de suite par courriel
import { runReport } from '../lib/send-report.mjs';
export default async req => {
  const u = new URL(req.url), k = process.env.REPORT_KEY;
  if (!k || u.searchParams.get('key') !== k) return new Response('Introuvable', { status: 404 });
  const r = await runReport({ send: u.searchParams.get('envoyer') === '1' });
  if (!r.sent && !r.error && u.searchParams.get('format') !== 'html') return new Response(r.pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${r.filename}"`, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  const note = r.sent ? '<p style="font:14px Helvetica;padding:12px;background:#CCFF00">Rapport envoyé par courriel.</p>' : r.error ? `<p style="font:14px Helvetica;padding:12px;background:#fdd">Non envoyé : ${r.error}</p>` : '';
  return new Response(note + r.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
};
export const config = { path: '/api/rapport' };
