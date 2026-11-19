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

function pill(c, p, invert) {
  if (c === null || c === undefined) return '<span style="color:#888">première semaine</span>';
  if (Math.abs(c) < 0.005) return '<span style="color:#888">= stable</span>';
  const good = invert ? c < 0 : c > 0;
  const t = (c > 0 ? '▲ +' : '▼ −') + Math.abs(Math.round(c * 100)) + ' %';
  return `<span style="display:inline-block;padding:1px 7px;font-weight:700;font-size:11px;background:${good ? '#CCFF00' : '#e9e9e9'};color:#000">${t}</span>`;
}
function ptsDiff(c, p) { // variation en points de pourcentage (taux de rebond)
  if (!p) return '<span style="color:#888">première semaine</span>';
  const d = Math.round((c - p) * 100);
  if (!d) return '<span style="color:#888">= stable</span>';
  const good = d < 0;
  return `<span style="display:inline-block;padding:1px 7px;font-weight:700;font-size:11px;background:${good ? '#CCFF00' : '#e9e9e9'};color:#000">${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d)} pts</span>`;
}

const bar = (v, max, hl) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:8px;font-size:0;line-height:0;width:${max ? Math.max(2, Math.round((v / max) * 100)) : 0}%;background:${hl ? '#CCFF00' : '#000'};${hl ? 'border:1px solid #000;' : ''}">&nbsp;</td><td style="font-size:0">&nbsp;</td></tr></table>`;

function rows(list, opts = {}) {
  if (!list.length) return '<tr><td style="padding:10px 0;color:#888;font-size:13px">Aucune donnée cette semaine.</td></tr>';
  const max = Math.max(...list.map(r => r.v)), tot = opts.total;
  return list.map(r => `<tr><td style="padding:7px 0;border-bottom:1px solid #eee;font-size:13px;width:34%;vertical-align:middle">${esc(r.label)}</td><td style="padding:7px 10px;border-bottom:1px solid #eee;vertical-align:middle;width:36%">${bar(r.v, max)}</td><td style="padding:7px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right;white-space:nowrap;vertical-align:middle;width:30%"><b>${nf(r.v)}</b>${tot ? `<span style="color:#888"> · ${share(r.v, tot)}</span>` : ''}${r.extra ? ' ' + r.extra : ''}</td></tr>`).join('');
}
const section = (title, inner, note) => `<tr><td style="padding:30px 32px 0"><div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#000;border-bottom:2px solid #000;padding-bottom:8px">${esc(title)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">${inner}</table>${note ? `<div style="font-size:11px;color:#888;padding-top:6px">${esc(note)}</div>` : ''}</td></tr>`;

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

export function renderReport(R, { compact = false } = {}) {
  const { cur, prev, hist, firstDay } = R;
  const hasPrev = prev.pv > 0;
  const p = (a, b, inv) => pill(hasPrev ? pct(a, b) : null, b, inv);
  const range = `${dm(cur.start)} au ${dm(cur.end)}`;
  const kpi = (label, val, delta) => `<td width="33%" style="padding:16px 12px 14px 0;vertical-align:top"><div style="font-size:11px;color:#777;letter-spacing:.06em;text-transform:uppercase">${label}</div><div style="font:900 26px/1.15 Helvetica,Arial,sans-serif;color:#000;padding:4px 0 6px">${val}</div><div>${delta}</div></td>`;
  const kpis = `<tr><td style="padding:12px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${kpi('Visiteurs', nf(cur.visitors), p(cur.visitors, prev.visitors))}${kpi('Pages vues', nf(cur.pv), p(cur.pv, prev.pv))}${kpi('Pages par visite', cur.pagesPerVisit.toFixed(1).replace('.', ','), p(cur.pagesPerVisit, prev.pagesPerVisit))}</tr><tr>
    ${kpi('Durée moyenne', dur(cur.avgMs), p(cur.avgMs, prev.avgMs))}${kpi('Taux de rebond', Math.round(cur.bounce * 100) + ' %', hasPrev ? ptsDiff(cur.bounce, prev.bounce) : pill(null))}${kpi('Réservations', nf(cur.ev.reserver_envoyee || 0), p(cur.ev.reserver_envoyee || 0, prev.ev.reserver_envoyee || 0))}</tr></table></td></tr>`;

  const hi = highlights(R);
  const hiHtml = `<tr><td style="padding:22px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5"><tr><td style="padding:14px 18px;font-size:13px;line-height:1.7">${hi.map(t => `<div>• ${esc(t)}</div>`).join('')}</td></tr></table></td></tr>`;

  // progression sur 8 semaines
  const hh = firstDay ? hist.filter((h, i) => i >= hist.length - 2 || h.start >= weekStartOf(firstDay)) : hist;
  const hmax = Math.max(1, ...hh.map(h => h.visitors));
  const progression = section('Progression, dernières semaines', hh.map((h, i) => {
    const last = i === hh.length - 1;
    return `<tr><td style="padding:6px 0;font-size:12px;width:21%;color:${last ? '#000' : '#777'};font-weight:${last ? 700 : 400};white-space:nowrap">Sem. du ${dm(h.start)}</td><td style="padding:6px 10px;width:40%">${bar(h.visitors, hmax, last)}</td><td style="padding:6px 0;font-size:13px;text-align:right;white-space:nowrap"><b>${nf(h.visitors)}</b> <span style="color:#888;font-size:11px">visiteurs · ${nf(h.pv)} vues</span></td></tr>`;
  }).join(''), 'Chaque barre représente le nombre de visiteurs de la semaine (du dimanche au samedi).');

  // jour par jour
  const dmax = Math.max(1, ...cur.perDay.map(d => d.uv));
  const jours = section('Jour par jour', cur.perDay.map(d => `<tr><td style="padding:6px 0;font-size:12px;width:21%;color:#555">${JC[dowOf(d.day)]} ${dm(d.day)}</td><td style="padding:6px 10px;width:40%">${bar(d.uv, dmax)}</td><td style="padding:6px 0;font-size:13px;text-align:right;white-space:nowrap"><b>${nf(d.uv)}</b> <span style="color:#888;font-size:11px">visiteurs · ${nf(d.pv)} vues</span></td></tr>`).join(''));

  // pages
  const pageList = Object.entries(cur.pages).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([k, v]) => {
    const dd = prev.pv ? v.v - (prev.pages[k]?.v || 0) : null;
    return { label: pageLabel(k), v: v.v, extra: `<span style="color:#888;font-size:11px">${v.dn ? dur(v.ms / v.dn) : ''}${dd === null ? '' : (v.dn ? ' · ' : '') + (dd > 0 ? '+' : dd < 0 ? '−' : '') + Math.abs(dd)}</span>` };
  });
  const pages = section('Pages les plus visitées', rows(pageList, { total: cur.pv }), 'Vues de la semaine · temps moyen sur la page · écart avec la semaine précédente.');
  const entry = section('Pages d’entrée', rows(top(cur.entry, 5).map(([k, v]) => ({ label: pageLabel(k), v })), { total: sum(cur.entry) }), 'Première page vue par chaque visiteur.');

  const catList = top(cur.cat, 7).map(([k, v]) => ({ label: k, v, extra: prev.arr ? '' : '' }));
  const sources = section('D’où viennent les visiteurs', rows(catList, { total: cur.arr }) + (top(cur.ref, 5).length ? `<tr><td colspan="3" style="padding:12px 0 2px;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase">Sites référents</td></tr>` + rows(top(cur.ref, 5).map(([k, v]) => ({ label: k, v }))) : ''), 'Direct = lien tapé, signet ou application sans référent (souvent Instagram ou un message). Ajoutez ?utm_source=instagram aux liens que vous publiez pour les distinguer.');

  const evList = Object.keys(EVENTS).map(k => ({ label: EVENTS[k], v: cur.ev[k] || 0, extra: hasPrev ? `<span style="color:#888;font-size:11px">${((cur.ev[k] || 0) - (prev.ev[k] || 0) >= 0 ? '+' : '−') + Math.abs((cur.ev[k] || 0) - (prev.ev[k] || 0))}</span>` : '' }));
  const conv = cur.visitors ? ((cur.ev.reserver_envoyee || 0) / cur.visitors) : 0;
  const actions = section('Actions des visiteurs', rows(evList.filter(e => e.v > 0 || ['reserver_envoyee', 'reserver_debut', 'mail', 'instagram', 'facebook'].some(k => EVENTS[k] === e.label))) + `<tr><td colspan="3" style="padding:10px 0 0;font-size:12px;color:#555">Taux de conversion : <b>${(conv * 100).toFixed(1).replace('.', ',')} %</b> des visiteurs envoient une demande de réservation.</td></tr>`, 'Les clics sur Instagram et Facebook comptent même avant que les liens soient actifs.');

  const geo = section('Provenance', rows(top(cur.country, 5).map(([k, v]) => ({ label: k, v })), { total: sum(cur.country) }) + `<tr><td colspan="3" style="padding:12px 0 2px;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase">Villes</td></tr>` + rows(top(cur.city, 6).map(([k, v]) => ({ label: k, v })), { total: sum(cur.city) }));

  const devs = section('Appareils', rows(top(cur.dev, 3).map(([k, v]) => ({ label: k, v })), { total: sum(cur.dev) }) + `<tr><td colspan="3" style="padding:12px 0 2px;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase">Navigateurs</td></tr>` + rows(top(cur.br, 5).map(([k, v]) => ({ label: k, v })), { total: sum(cur.br) }) + `<tr><td colspan="3" style="padding:12px 0 2px;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase">Systèmes</td></tr>` + rows(top(cur.os, 4).map(([k, v]) => ({ label: k, v })), { total: sum(cur.os) }) + `<tr><td colspan="3" style="padding:12px 0 2px;font-size:11px;color:#888;letter-spacing:.06em;text-transform:uppercase">Langue du navigateur</td></tr>` + rows(top(cur.lang, 4).map(([k, v]) => ({ label: ({ fr: 'Français', en: 'Anglais', es: 'Espagnol', pt: 'Portugais', '?': 'Inconnue' })[k] || k.toUpperCase(), v })), { total: sum(cur.lang) }));

  const hmaxh = Math.max(1, ...cur.hour);
  const heures = section('Heures de visite', `<tr><td style="padding:10px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr>${cur.hour.map(v => `<td valign="bottom" style="height:64px;padding:0 1px"><div style="background:#000;height:${Math.max(v ? 3 : 1, Math.round((v / hmaxh) * 60))}px;font-size:0;line-height:0">&nbsp;</div></td>`).join('')}</tr><tr>${cur.hour.map((v, h) => `<td align="center" style="font-size:9px;color:#888;padding-top:3px">${h % 3 === 0 ? h : ''}</td>`).join('')}</tr></table></td></tr>`, 'Heure de Montréal, vues de page.');

  const nfPages = Object.entries(cur.nf);
  const lost = nfPages.length ? section('Pages introuvables (404)', rows(top(cur.nf, 5).map(([k, v]) => ({ label: k, v })))) : '';

  const since = firstDay ? `Collecte active depuis le ${dm(firstDay)}.` : '';
  const pj = `<tr><td style="padding:26px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000"><tr><td style="padding:14px 18px;font-size:13px;line-height:1.6"><b>Rapport complet en pièce jointe (PDF).</b><br>Pages, sources, actions, entonnoir de réservation, villes, appareils et historique. Conservez les PDF de chaque semaine pour suivre la progression.</td></tr></table></td></tr>`;
  const body = (compact ? [kpis, hiHtml, progression, pj] : [kpis, hiHtml, progression, jours, pages, entry, sources, actions, geo, devs, heures, lost]).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#ececec"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ececec"><tr><td align="center" style="padding:24px 10px"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#fff;font-family:Helvetica,Arial,sans-serif;color:#000">
<tr><td style="background:#000;padding:30px 32px 26px"><div style="font:900 22px/1 Helvetica,Arial,sans-serif;letter-spacing:.06em;color:#fff">TOTAL STUDIOS</div><div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#CCFF00;padding-top:16px">Rapport hebdomadaire</div><div style="font:400 15px/1.3 Helvetica,Arial,sans-serif;color:#fff;padding-top:8px">Semaine du ${range}</div></td></tr>
${body}
<tr><td style="padding:34px 32px 30px"><div style="border-top:1px solid #ddd;padding-top:14px;font-size:11px;line-height:1.6;color:#888">Statistiques de totalstudios.ca, sans témoin (cookie) ni adresse IP conservée. ${esc(since)} Un visiteur correspond à un appareil et un navigateur pendant la semaine. Les visites de l’équipe peuvent être exclues en ouvrant totalstudios.ca/?notrack sur chaque appareil. Rapport envoyé chaque dimanche.</div></td></tr>
</table></td></tr></table></body></html>`;

  const L = [];
  L.push(`TOTAL STUDIOS | Rapport hebdomadaire | Semaine du ${range}`, '');
  const d = (a, b) => (hasPrev && b ? ` (${a >= b ? '+' : '−'}${Math.abs(Math.round(((a - b) / b) * 100))} %)` : '');
  L.push(`Visiteurs : ${nf(cur.visitors)}${d(cur.visitors, prev.visitors)}`, `Pages vues : ${nf(cur.pv)}${d(cur.pv, prev.pv)}`, `Pages par visite : ${cur.pagesPerVisit.toFixed(1)}`, `Durée moyenne : ${dur(cur.avgMs)}`, `Taux de rebond : ${Math.round(cur.bounce * 100)} %`, `Réservations envoyées : ${cur.ev.reserver_envoyee || 0}`, '', ...hi.map(t => '• ' + t), '');
  L.push('Pages les plus visitées :', ...Object.entries(cur.pages).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([k, v]) => `  ${pageLabel(k)} : ${v.v}`), '', 'Sources :', ...top(cur.cat, 7).map(([k, v]) => `  ${k} : ${v}`), '', 'Villes :', ...top(cur.city, 6).map(([k, v]) => `  ${k} : ${v}`), '', 'Ouvrez ce courriel en HTML pour voir le rapport complet.');
  const subject = `Rapport hebdo TOTAL STUDIOS | ${range} : ${nf(cur.visitors)} visiteur${cur.visitors > 1 ? 's' : ''}${hasPrev && prev.visitors ? ` (${cur.visitors >= prev.visitors ? '+' : '−'}${Math.abs(Math.round(((cur.visitors - prev.visitors) / prev.visitors) * 100))} %)` : ''}`;
  return { html, text: L.join('\n'), subject };
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
