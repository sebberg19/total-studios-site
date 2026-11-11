// Se déclenche automatiquement à chaque envoi du formulaire « reservation » (Netlify Forms).
// Génère un PDF au style TOTAL STUDIOS et l'envoie par courriel (Resend).
// Variables d'environnement Netlify : RESEND_API_KEY (obligatoire), NOTIFY_TO, NOTIFY_FROM.
const { buildPdf, fmtDates, clean } = require('./pdf');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

exports.handler = async event => {
  let payload;
  try { payload = JSON.parse(event.body).payload; } catch (e) { return { statusCode: 400, body: 'Corps invalide' }; }
  if (!payload || payload.form_name !== 'reservation') return { statusCode: 200, body: 'Autre formulaire, ignoré' };

  const d = payload.data || {};
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY manquante : PDF non envoyé (la demande reste dans Netlify > Forms).'); return { statusCode: 200, body: 'Clé manquante' }; }
  const to = (process.env.NOTIFY_TO || 'info@totalstudios.ca').split(',').map(s => s.trim()).filter(Boolean);
  const from = process.env.NOTIFY_FROM || 'TOTAL STUDIOS <onboarding@resend.dev>';

  const pdf = await buildPdf(d, { number: payload.number, created: payload.created_at });
  const dates = fmtDates(d.dates);
  const when = dates.length > 1 ? `${dates[0]} (+${dates.length - 1})` : (dates[0] || '');
  const who = clean(d.organisation) || clean(d.nom);
  const subject = `Nouvelle demande de réservation | ${[clean(d.profil), who, when].filter(Boolean).join(' | ')}`;
  const lines = [
    ['Profil', d.profil], ['Nom', d.nom], ['Courriel', d.courriel], ['Téléphone', d.telephone],
    ['Équipe / club', d.organisation], ['Services', d.services], ['Options', [d.options, d.contenu].filter(Boolean).join(', ')], ['Dates', dates.join(' ; ')], ['Lieu', [d.ville, d.terrain].filter(Boolean).join(', ')],
  ].filter(([, v]) => clean(v));
  const text = 'Nouvelle demande de réservation reçue sur totalstudios.ca.\n\n' + lines.map(([k, v]) => `${k} : ${clean(v)}`).join('\n') + '\n\nLe PDF complet est en pièce jointe. Répondez à ce courriel pour écrire directement au client.';
  const html = `<div style="font:14px/1.6 Helvetica,Arial,sans-serif;color:#000"><p><b>Nouvelle demande de réservation</b> reçue sur totalstudios.ca.</p><table cellpadding="4" style="border-collapse:collapse">${lines.map(([k, v]) => `<tr><td style="color:#777">${esc(k)}</td><td>${esc(clean(v))}</td></tr>`).join('')}</table><p>Le PDF complet est en pièce jointe. Répondez à ce courriel pour écrire directement au client.</p></div>`;

  const body = { from, to, subject, text, html, attachments: [{ filename: `Demande-reservation-${payload.number || 'nouvelle'}.pdf`, content: pdf.toString('base64') }] };
  const email = clean(d.courriel);
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) body.reply_to = email;

  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const out = await r.text();
  if (!r.ok) { console.error('Échec Resend', r.status, out); return { statusCode: 500, body: out }; }
  console.log('PDF envoyé à', to.join(', '), out);
  return { statusCode: 200, body: 'OK' };
};
