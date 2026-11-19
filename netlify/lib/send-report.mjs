import { getStore } from '@netlify/blobs';
import { buildReport } from './stats.mjs';
import { renderReport } from './report-html.mjs';

export const statsStore = () => getStore({ name: 'stats', consistency: 'strong' });

// Construit le rapport ; l'envoie par courriel (Resend) si send = true.
export async function runReport({ send }) {
  const R = await buildReport(statsStore());
  const out = renderReport(R);
  if (!send) return { ...out, sent: false };
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY manquante : rapport non envoyé.'); return { ...out, sent: false, error: 'RESEND_API_KEY manquante' }; }
  const to = (process.env.NOTIFY_TO || 'info@totalstudios.ca').split(',').map(s => s.trim()).filter(Boolean);
  const from = process.env.NOTIFY_FROM || 'TOTAL STUDIOS <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to, subject: out.subject, html: out.html, text: out.text }) });
  const body = await r.text();
  if (!r.ok) { console.error('Échec Resend', r.status, body); return { ...out, sent: false, error: body }; }
  console.log('Rapport envoyé à', to.join(', '), body);
  return { ...out, sent: true };
}
