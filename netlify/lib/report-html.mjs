// Mise en page du rapport hebdomadaire (courriel HTML + version texte).
import { EVENTS, pageLabel, weekStartOf } from './stats.mjs';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const nf = n => Math.round(n).toLocaleString('fr-CA').replace(/ | /g, ' ');
export const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
export const JC = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const dm = d => { const [, m, j] = d.split('-'); return `${+j} ${MOIS[+m - 1]}`; };
export const dowOf = d => new Date(d + 'T12:00:00Z').getUTCDay();
export const dur = ms => { if (!ms) return '0 s'; const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`; };
export const pct = (a, b) => (b > 0 ? (a - b) / b : null);
export const top = (o, n = 6) => Object.entries(o || {}).filter(([k]) => k !== '(autres)').sort((a, b) => b[1] - a[1]).slice(0, n);
export const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
export const share = (n, t) => (t ? Math.round((n / t) * 100) + ' %' : '');

// ---------- mise en page du courriel : même esprit que le PDF (noir et blanc, titres lourds, texte mono, sections numérotées) ----------
const SANS = "'Archivo Black','Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif", MONO = "'Cascadia Mono',Menlo,Consolas,'SFMono-Regular','Courier New',monospace";
export const paysFr = c => { if (!c || c === '?') return 'Inconnu'; if (c.length === 2) { try { return new Intl.DisplayNames(['fr'], { type: 'region' }).of(c.toUpperCase()); } catch (_) {} } return c; };
const signed = (a, b) => (b > 0 ? `${a >= b ? '+' : '-'}${Math.abs(Math.round(((a - b) / b) * 100))} %` : null);

const bar = (v, max, hl) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="${max ? Math.max(2, Math.round((v / max) * 100)) : 0}%" style="height:7px;font-size:0;line-height:0;background:${hl ? '#CCFF00' : '#000'};${hl ? 'border:1px solid #000;' : ''}">&nbsp;</td><td style="font-size:0">&nbsp;</td></tr></table>`;

function rows(list, opts = {}) {
  if (!list.length) return `<tr><td style="padding:12px 0;font:12px/1.5 ${MONO};color:#888">Aucune donnée cette semaine.</td></tr>`;
  const max = Math.max(...list.map(r => r.v)), tot = opts.total;
  return list.map(r => `<tr><td style="padding:9px 0;border-bottom:1px solid #d6d6d6;font:12px/1.4 ${MONO};color:#000;width:36%;vertical-align:middle">${esc(r.label)}</td><td width="34%" style="padding:9px 12px;border-bottom:1px solid #d6d6d6;vertical-align:middle">${bar(r.v, max, r.hl)}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #d6d6d6;font:12px/1.4 ${MONO};white-space:nowrap;vertical-align:middle;color:#000">${nf(r.v)}${tot ? `<span style="color:#8c8c8c">  ·  ${share(r.v, tot)}</span>` : ''}${r.extra ? `<span style="color:#8c8c8c">  ·  ${esc(r.extra)}</span>` : ''}</td></tr>`).join('');
}
const sub = t => `<tr><td colspan="3" style="padding:18px 0 4px;font:700 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8c8c8c">${esc(t)}</td></tr>`;
const section = (num, title, inner, note) => `<tr><td style="padding:34px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="40" valign="bottom" style="padding-bottom:9px;border-bottom:2px solid #000;font:400 18px/1 ${SANS};font-weight:900;color:#000">${String(num).padStart(2, '0')}</td><td valign="bottom" style="padding-bottom:9px;border-bottom:2px solid #000;font:400 12px/1 ${SANS};font-weight:900;letter-spacing:.01em;text-transform:uppercase;color:#000">${esc(title)}</td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">${inner}</table>${note ? `<div style="padding-top:8px;font:11px/1.55 ${MONO};color:#8c8c8c">${esc(note)}</div>` : ''}</td></tr>`;
const li = t => `<tr><td width="18" valign="top" style="padding:5px 0;font:13px/1.55 ${MONO};color:#000">-</td><td style="padding:5px 0;font:13px/1.55 ${MONO};color:#000">${esc(t)}</td></tr>`;

export function renderReport(R, { compact = false } = {}) {
  const { cur, prev, hist, firstDay } = R;
  const hasPrev = prev.pv > 0;
  const range = `${dm(cur.start)} au ${dm(cur.end)}`;
  const delta = (a, b) => { const t = hasPrev ? signed(a, b) : null; return t ? `${t} vs sem. préc.` : '1re semaine'; };
  const bd = hasPrev ? `${cur.bounce >= prev.bounce ? '+' : '-'}${Math.abs(Math.round((cur.bounce - prev.bounce) * 100))} pts vs sem. préc.` : '1re semaine';
  const cell = (label, val, d) => `<td width="33%" valign="top" style="padding:18px 8px 16px 0;border-bottom:1px solid #d6d6d6"><div style="font:700 10px/1.2 Helvetica,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8c8c8c">${label}</div><div style="padding:8px 0 7px;font:400 28px/1.1 ${SANS};font-weight:900;color:#000">${val}</div><div style="font:11px/1.4 ${MONO};color:#8c8c8c">${d}</div></td>`;
  const kpis = `<tr><td style="padding:6px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cell('Visiteurs', nf(cur.visitors), delta(cur.visitors, prev.visitors))}${cell('Pages vues', nf(cur.pv), delta(cur.pv, prev.pv))}${cell('Pages par visite', cur.pagesPerVisit.toFixed(1).replace('.', ','), delta(cur.pagesPerVisit, prev.pagesPerVisit))}</tr><tr>${cell('Durée moyenne', dur(cur.avgMs), delta(cur.avgMs, prev.avgMs))}${cell('Taux de rebond', Math.round(cur.bounce * 100) + ' %', bd)}${cell('Réservations envoyées', nf(cur.ev.reserver_envoyee || 0), delta(cur.ev.reserver_envoyee || 0, prev.ev.reserver_envoyee || 0))}</tr></table></td></tr>`;

  let n = 0;
  const hi = section(++n, 'Faits saillants', highlights(R).map(li).join(''));
  const ins = section(++n, 'Points d’attention', insights(R).map(li).join(''), 'Constats tirés des chiffres de la semaine, sans interprétation.');

  const hh = firstDay ? hist.filter((h, i) => i >= hist.length - 2 || h.start >= weekStartOf(firstDay)) : hist;
  const hmax = Math.max(1, ...hh.map(h => h.visitors));
  const progression = section(++n, 'Progression', hh.map((h, i) => { const last = i === hh.length - 1; return `<tr><td style="padding:9px 0;border-bottom:1px solid #d6d6d6;font:12px/1.4 ${MONO};white-space:nowrap;width:30%;color:${last ? '#000' : '#8c8c8c'}">${last ? '<b>' : ''}Sem. du ${dm(h.start)}${last ? '</b>' : ''}</td><td width="40%" style="padding:9px 12px;border-bottom:1px solid #d6d6d6">${bar(h.visitors, hmax, last)}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #d6d6d6;font:12px/1.4 ${MONO};white-space:nowrap"><b>${nf(h.visitors)}</b><span style="color:#8c8c8c">  ·  ${nf(h.pv)} vues</span></td></tr>`; }).join(''), 'Visiteurs par semaine, du dimanche au samedi. La courbe complète est dans le PDF joint.');

  const pageList = Object.entries(cur.pages).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([k, v]) => ({ label: pageLabel(k), v: v.v, extra: v.dn ? dur(v.ms / v.dn) : '' }));
  const pages = section(++n, 'Pages les plus visitées', rows(pageList, { total: cur.pv }), 'Vues · part du total · temps moyen sur la page.');
  const sources = section(++n, 'D’où viennent les visiteurs', rows(top(cur.cat, 7).map(([k, v]) => ({ label: k, v })), { total: cur.arr }) + (top(cur.ref, 5).length ? sub('Sites référents') + rows(top(cur.ref, 5).map(([k, v]) => ({ label: k, v }))) : ''), 'Direct = lien tapé, signet ou application sans référent. Ajoutez ?utm_source=instagram aux liens publiés pour les distinguer.');
  const evList = Object.keys(EVENTS).map(k => ({ label: EVENTS[k], v: cur.ev[k] || 0 }));
  const conv = cur.visitors ? ((cur.ev.reserver_envoyee || 0) / cur.visitors) * 100 : 0;
  const actions = section(++n, 'Actions des visiteurs', rows(evList) + `<tr><td colspan="3" style="padding:12px 0 0;font:12px/1.5 ${MONO};color:#000">Taux de conversion : <b>${conv.toFixed(1).replace('.', ',')} %</b> des visiteurs envoient une demande.</td></tr>`);
  const geo = section(++n, 'Provenance', rows(top(cur.country, 5).map(([k, v]) => ({ label: paysFr(k), v })), { total: sum(cur.country) }) + sub('Villes') + rows(top(cur.city, 6).map(([k, v]) => ({ label: k, v })), { total: sum(cur.city) }) + (top(cur.tz, 4).length ? sub('Fuseau horaire du navigateur') + rows(top(cur.tz, 4).map(([k, v]) => ({ label: k, v })), { total: sum(cur.tz) }) : ''), 'Provenance selon l’adresse IP. Un VPN ou un Relais privé peut la fausser : le fuseau horaire du navigateur sert de vérification.');
  const devs = section(++n, 'Appareils', rows(top(cur.dev, 3).map(([k, v]) => ({ label: k, v })), { total: sum(cur.dev) }) + sub('Navigateurs') + rows(top(cur.br, 5).map(([k, v]) => ({ label: k, v })), { total: sum(cur.br) }) + sub('Langue du navigateur') + rows(top(cur.lang, 4).map(([k, v]) => ({ label: ({ fr: 'Français', en: 'Anglais', es: 'Espagnol', pt: 'Portugais', '?': 'Inconnue' })[k] || k.toUpperCase(), v })), { total: sum(cur.lang) }));
  const lost = Object.keys(cur.nf).length ? section(++n, 'Pages introuvables (404)', rows(top(cur.nf, 5).map(([k, v]) => ({ label: k, v })))) : '';
  const pj = `<tr><td style="padding:34px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000"><tr><td style="padding:16px 20px;font:12px/1.65 ${MONO};color:#000"><b style="font:400 12px/1 ${SANS};font-weight:900;letter-spacing:.01em;text-transform:uppercase">Rapport complet en pièce jointe (PDF)</b><br><span style="display:block;padding-top:8px">Courbe de progression, jour par jour, pages d’entrée, entonnoir de réservation, appareils, heures de visite et données compactes. Gardez les PDF de chaque semaine pour suivre l’évolution.</span></td></tr></table></td></tr>`;

  const body = (compact ? [kpis, hi, ins, progression, pages, sources, pj] : [kpis, hi, ins, progression, pages, sources, actions, geo, devs, lost]).join('');
  const since = firstDay ? `Collecte active depuis le ${dm(firstDay)}.` : '';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>Rapport hebdomadaire TOTAL STUDIOS</title></head><body style="margin:0;padding:0;background:#ffffff" bgcolor="#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:640px;background:#ffffff;color:#000">
<tr><td style="padding:40px 40px 0"><img src="https://totalstudios.ca/logo-email.png" width="190" alt="TOTAL STUDIOS" style="display:block;border:0;width:190px;max-width:60%;height:auto;background:#fff"></td></tr>
<tr><td style="padding:34px 40px 0;font:11px/1.4 ${MONO};color:#8c8c8c;letter-spacing:.04em">RAPPORT HEBDOMADAIRE  ·  totalstudios.ca</td></tr>
<tr><td style="padding:16px 40px 0"><div style="font:400 34px/1.02 ${SANS};font-weight:900;letter-spacing:-.02em;text-transform:uppercase;color:#000">Semaine du<br>${esc(range)}</div></td></tr>
<tr><td style="padding:22px 40px 0"><div style="border-top:2px solid #000;font-size:0;line-height:0">&nbsp;</div></td></tr>
${body}
<tr><td style="padding:40px 40px 36px"><div style="border-top:1px solid #d6d6d6;padding-top:14px;font:11px/1.65 ${MONO};color:#8c8c8c">TOTAL STUDIOS  ·  info@totalstudios.ca<br>Statistiques de totalstudios.ca, sans témoin (cookie) ni adresse IP conservée. ${esc(since)} Un visiteur correspond à un appareil et un navigateur dans la semaine. Vos propres visites sont exclues avec totalstudios.ca/?notrack sur chaque appareil. Rapport envoyé chaque dimanche à 10 h.</div></td></tr>
</table></td></tr></table></body></html>`;

  const L = [];
  const d = (a, b) => { const t = hasPrev ? signed(a, b) : null; return t ? ` (${t})` : ''; };
  L.push(`TOTAL STUDIOS | Rapport hebdomadaire | Semaine du ${range}`, '');
  L.push(`Visiteurs : ${nf(cur.visitors)}${d(cur.visitors, prev.visitors)}`, `Pages vues : ${nf(cur.pv)}${d(cur.pv, prev.pv)}`, `Pages par visite : ${cur.pagesPerVisit.toFixed(1)}`, `Durée moyenne : ${dur(cur.avgMs)}`, `Taux de rebond : ${Math.round(cur.bounce * 100)} %`, `Réservations envoyées : ${cur.ev.reserver_envoyee || 0}`, '', ...highlights(R).map(t => '- ' + t), '', 'Points d’attention :', ...insights(R).map(t => '- ' + t), '', 'Le rapport complet est en pièce jointe (PDF).');
  const sd = hasPrev && prev.visitors ? ` (${signed(cur.visitors, prev.visitors)})` : '';
  const subject = `Rapport hebdo TOTAL STUDIOS | ${range} : ${nf(cur.visitors)} visiteur${cur.visitors > 1 ? 's' : ''}${sd}`;
  return { html, text: L.join('\n'), subject };
}

export function highlights(R) {
  const { cur, prev } = R, out = [];
  if (!cur.pv) return ['Aucune visite enregistrée cette semaine.'];
  const best = [...cur.perDay].sort((a, b) => b.uv - a.uv)[0];
  if (best && best.uv) out.push(`Meilleur jour : ${JOURS[dowOf(best.day)]} ${dm(best.day)}, avec ${nf(best.uv)} visiteur${best.uv > 1 ? 's' : ''}.`);
  const h = cur.hour.indexOf(Math.max(...cur.hour));
  if (cur.hour[h]) out.push(`Heure de pointe : ${h} h à ${(h + 1) % 24} h (heure de Montréal).`);
  const tp = top(Object.fromEntries(Object.entries(cur.pages).map(([k, v]) => [k, v.v])), 1)[0];
  if (tp) out.push(`Page la plus visitée : ${pageLabel(tp[0])} (${nf(tp[1])} vues).`);
  const ts = top(cur.cat, 1)[0];
  if (ts) out.push(`Principale source de trafic : ${ts[0].toLowerCase()} (${share(ts[1], cur.arr)} des arrivées).`);
  const grow = Object.entries(cur.pages).map(([k, v]) => [k, v.v - (prev.pages[k]?.v || 0)]).sort((a, b) => b[1] - a[1])[0];
  if (grow && grow[1] > 0 && prev.pv) out.push(`Plus forte hausse : ${pageLabel(grow[0])} (+${nf(grow[1])} vues).`);
  const r = cur.ev.reserver_envoyee || 0;
  if (r) out.push(`${nf(r)} demande${r > 1 ? 's' : ''} de réservation envoyée${r > 1 ? 's' : ''}.`);
  return out.slice(0, 5);
}

// Constats chiffrés (sans interprétation) qui aident à repérer où optimiser.
export function insights(R) {
  const { cur, prev } = R, out = [], v = cur.visitors;
  const debut = cur.ev.reserver_debut || 0, env = cur.ev.reserver_envoyee || 0, rv = cur.pages['/reserver/']?.v || 0;
  if (debut >= 3 && env / debut < 0.6) out.push(`Formulaire de réservation : ${nf(env)} envoi${env > 1 ? 's' : ''} pour ${nf(debut)} formulaire${debut > 1 ? 's' : ''} commencé${debut > 1 ? 's' : ''} (${Math.round((env / debut) * 100)} %). Une partie des visiteurs abandonne en cours de route.`);
  if (v >= 20 && rv / v < 0.1) out.push(`Seulement ${Math.round((rv / v) * 100)} % des visiteurs ouvrent la page Réserver (${nf(rv)} vues pour ${nf(v)} visiteurs).`);
  if (v >= 20 && cur.bounce > 0.6) out.push(`Taux de rebond élevé : ${Math.round(cur.bounce * 100)} % des visites s’arrêtent à une seule page.`);
  const mob = (cur.dev.Mobile || 0) / (sum(cur.dev) || 1);
  if (v >= 20 && mob >= 0.6) out.push(`${Math.round(mob * 100)} % des visiteurs sont sur mobile.`);
  if (prev.visitors >= 10 && v < prev.visitors * 0.8) out.push(`Baisse de ${Math.round((1 - v / prev.visitors) * 100)} % des visiteurs par rapport à la semaine précédente.`);
  const dir = (cur.cat.Direct || 0) / (cur.arr || 1);
  if (cur.arr >= 20 && dir > 0.6) out.push(`${Math.round(dir * 100)} % des arrivées sont directes : la source réelle de ces visites est inconnue (ajouter ?utm_source= aux liens publiés).`);
  return out.length ? out.slice(0, 5) : ['Aucun signal particulier cette semaine.'];
}
