// Rapport hebdomadaire en PDF, au style TOTAL STUDIOS (noir et blanc, Archivo + Cascadia Mono Light).
// Texte réel (sélectionnable) et structure identique d'une semaine à l'autre : facile à compiler et à relire par un assistant.
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import F from '../functions/fonts.js';
import LOGO from '../functions/logo.js';
import { EVENTS, pageLabel } from './stats.mjs';
import { nf, dm, dur, top, sum, share, pct, JC, JOURS, dowOf, highlights, insights } from './report-html.mjs';

const W = 612, H = 792, M = 48, CW = W - 2 * M;
const BLACK = rgb(0, 0, 0), GREY = rgb(0.5, 0.5, 0.5), LINE = rgb(0.8, 0.8, 0.8), LIME = rgb(0.8, 1, 0), PALE = rgb(0.93, 0.93, 0.93);
const dash = s => String(s == null ? '' : s).replace(/[—–]/g, '-').replace(/−/g, '-').replace(/[  ]/g, ' ');
const sgn = (a, b) => (b > 0 ? `${a >= b ? '+' : '-'}${Math.abs(Math.round(((a - b) / b) * 100))} %` : 'n/a');

export async function buildReportPdf(R) {
  const { cur, prev, hist, firstDay } = R;
  const hasPrev = prev.pv > 0;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const black = await pdf.embedFont(Buffer.from(F['archivo-black'], 'base64'), { subset: true });
  const bold = await pdf.embedFont(Buffer.from(F['archivo-bold'], 'base64'), { subset: true });
  const mono = await pdf.embedFont(Buffer.from(F['cascadia-light'], 'base64'), { subset: true });
  const range = `${dm(cur.start)} au ${dm(cur.end)}`;
  pdf.setTitle(`Rapport hebdomadaire TOTAL STUDIOS | ${range}`);
  pdf.setAuthor('TOTAL STUDIOS'); pdf.setCreator('totalstudios.ca');
  pdf.setSubject(`Statistiques de totalstudios.ca, semaine du ${cur.start} au ${cur.end}`);

  const sets = new Map([[black, black.getCharacterSet()], [bold, bold.getCharacterSet()], [mono, mono.getCharacterSet()]]);
  const safe = (f, s) => { const cs = sets.get(f); return [...dash(s)].map(c => (cs.includes(c.codePointAt(0)) ? c : '?')).join(''); };
  let page, y;
  const T = (s, x, yy, size, font, color = BLACK) => page.drawText(safe(font, s), { x, y: yy, size, font, color });
  const TR = (s, xr, yy, size, font, color = BLACK) => { const t = safe(font, s); page.drawText(t, { x: xr - font.widthOfTextAtSize(t, size), y: yy, size, font, color }); };
  const wrap = (text, font, size, width) => {
    const out = []; let line = '';
    for (const w of safe(font, text).split(/\s+/)) { const t = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(t, size) <= width || !line) line = t; else { out.push(line); line = w; } }
    if (line) out.push(line); return out;
  };
  const logo = (x, topY, width, color = BLACK) => { const sc = width / LOGO.vb[2]; for (const p of LOGO.paths) page.drawSvgPath(p, { x: x - LOGO.vb[0] * sc, y: topY + LOGO.vb[1] * sc, scale: sc, color, borderWidth: 0 }); };
  const newPage = first => {
    page = pdf.addPage([W, H]);
    if (first) { logo(M, H - 44, 150); y = H - 44 - 40; }
    else { logo(M, H - 40, 96); TR('RAPPORT HEBDOMADAIRE', W - M, H - 47, 6.6, mono, GREY); y = H - 40 - 44; }
  };
  const ensure = need => { if (y - need < 70) { newPage(false); return true; } return false; };
  const section = (title, num) => {
    ensure(135); y -= 26;
    T(String(num).padStart(2, '0'), M, y - 1, 15, black); T(title.toUpperCase(), M + 34, y, 10.5, black);
    y -= 9; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.6, color: BLACK }); y -= 4;
  };
  const note = s => { y -= 5; for (const l of wrap(s, mono, 7, CW)) { ensure(12); y -= 11; T(l, M, y, 7, mono, GREY); } y -= 2; };
  const sub = s => { ensure(26); y -= 16; T(s.toUpperCase(), M, y, 7.2, bold, GREY); y -= 2; };
  const barRows = (list, opt = {}) => {
    if (!list.length) { ensure(20); y -= 15; T('Aucune donnée cette semaine.', M, y, 8.6, mono, GREY); return; }
    ensure(Math.min(list.length * 17 + 14, 190));
    const max = Math.max(...list.map(r => r.v)), bx = M + 196, bw = 150;
    for (const r of list) {
      ensure(20); y -= 17;
      page.drawLine({ start: { x: M, y: y - 5 }, end: { x: W - M, y: y - 5 }, thickness: 0.4, color: LINE });
      T(r.label, M, y, 8.6, mono);
      page.drawRectangle({ x: bx, y: y - 1, width: Math.max(1.5, (r.v / (max || 1)) * bw), height: 6.5, color: r.hl ? LIME : BLACK, ...(r.hl ? { borderColor: BLACK, borderWidth: 0.6 } : {}) });
      TR(`${nf(r.v)}${opt.total ? '  ·  ' + share(r.v, opt.total) : ''}${r.extra ? '  ·  ' + r.extra : ''}`, W - M, y, 8.6, mono);
    }
  };

  // ---- Page 1 : titre, indicateurs, faits saillants ----
  newPage(true);
  y -= 26; T('RAPPORT HEBDOMADAIRE  ·  totalstudios.ca', M, y, 7.6, mono, GREY);
  y -= 30; T('SEMAINE DU', M, y, 25, black); y -= 27; T(range.toUpperCase(), M, y, 25, black);
  TR(`Du ${cur.start} au ${cur.end}`, W - M, y + 28, 8, mono); TR('Dimanche au samedi, heure de Montréal', W - M, y + 15, 8, mono, GREY);
  y -= 16; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 2, color: BLACK });

  const K = [
    ['Visiteurs', nf(cur.visitors), sgn(cur.visitors, prev.visitors)], ['Pages vues', nf(cur.pv), sgn(cur.pv, prev.pv)], ['Pages par visite', cur.pagesPerVisit.toFixed(1).replace('.', ','), sgn(cur.pagesPerVisit, prev.pagesPerVisit)],
    ['Durée moyenne', dur(cur.avgMs), sgn(cur.avgMs, prev.avgMs)], ['Taux de rebond', Math.round(cur.bounce * 100) + ' %', hasPrev ? `${cur.bounce >= prev.bounce ? '+' : '-'}${Math.abs(Math.round((cur.bounce - prev.bounce) * 100))} pts` : 'n/a'], ['Réservations envoyées', nf(cur.ev.reserver_envoyee || 0), sgn(cur.ev.reserver_envoyee || 0, prev.ev.reserver_envoyee || 0)],
  ];
  y -= 6;
  for (let r = 0; r < 2; r++) {
    y -= 70;
    for (let c = 0; c < 3; c++) {
      const [l, v, d] = K[r * 3 + c], x = M + c * (CW / 3);
      T(l.toUpperCase(), x, y + 46, 7, bold, GREY); T(v, x, y + 18, 23, black);
      T(hasPrev ? `${d} vs semaine précédente` : 'première semaine', x, y + 2, 7.4, mono, GREY);
    }
    page.drawLine({ start: { x: M, y: y - 8 }, end: { x: W - M, y: y - 8 }, thickness: 0.5, color: LINE });
  }
  y -= 14;
  let n = 0;
  section('Faits saillants', ++n);
  for (const h of highlights(R)) for (const [i, l] of wrap(h, mono, 8.8, CW - 12).entries()) { ensure(14); y -= 14; if (!i) T('-', M, y, 8.8, mono); T(l, M + 12, y, 8.8, mono); }
  section('Points d’attention', ++n);
  for (const h of insights(R)) for (const [i, l] of wrap(h, mono, 8.8, CW - 12).entries()) { ensure(14); y -= 14; if (!i) T('-', M, y, 8.8, mono); T(l, M + 12, y, 8.8, mono); }
  note('Constats tirés des chiffres de la semaine, sans interprétation. Ils servent à repérer où optimiser.');

  // ---- Progression : courbe + tableau ----
  const hh = firstDay ? hist.filter((h, i) => i >= hist.length - 2 || h.start >= weekOf(firstDay)) : hist;
  ensure(260);
  section('Progression, dernières semaines', ++n);
  const cx = M + 34, cw = CW - 44, ch = 120, cy = y - 150;
  const vmax = Math.max(1, ...hh.map(h => Math.max(h.visitors, h.pv))), nice = Math.ceil(vmax / 5) * 5 || 5;
  for (let g = 0; g <= 4; g++) { const gy = cy + (g / 4) * ch; page.drawLine({ start: { x: cx, y: gy }, end: { x: cx + cw, y: gy }, thickness: 0.4, color: g ? LINE : BLACK }); TR(nf((g / 4) * nice), cx - 5, gy - 2.5, 6.6, mono, GREY); }
  const px = i => cx + (hh.length > 1 ? (i / (hh.length - 1)) * cw : cw / 2), py = v => cy + (v / nice) * ch;
  const series = (key, color, w, label) => {
    hh.forEach((h, i) => { if (i) page.drawLine({ start: { x: px(i - 1), y: py(hh[i - 1][key]) }, end: { x: px(i), y: py(h[key]) }, thickness: w, color }); });
    hh.forEach((h, i) => { page.drawCircle({ x: px(i), y: py(h[key]), size: w + 1.2, color: key === 'visitors' && i === hh.length - 1 ? LIME : color, borderColor: color, borderWidth: 0.8 }); if (key === 'visitors') TR(nf(h[key]), px(i) + 6, py(h[key]) + 6, 7, bold); });
  };
  series('pv', GREY, 1, 'Pages vues'); series('visitors', BLACK, 1.8, 'Visiteurs');
  hh.forEach((h, i) => { const t = dm(h.start); T(t, Math.min(px(i) - mono.widthOfTextAtSize(safe(mono, t), 6.4) / 2, W - M - 28), cy - 12, 6.4, mono, GREY); });
  page.drawLine({ start: { x: cx, y: cy - 28 }, end: { x: cx + 14, y: cy - 28 }, thickness: 1.8, color: BLACK }); T('Visiteurs', cx + 19, cy - 31, 7, mono);
  page.drawLine({ start: { x: cx + 80, y: cy - 28 }, end: { x: cx + 94, y: cy - 28 }, thickness: 1, color: GREY }); T('Pages vues', cx + 99, cy - 31, 7, mono);
  y = cy - 36;
  sub('Tableau de la progression');
  ensure(30 + hh.length * 14); y -= 14;
  const cols = [M, M + 92, M + 160, M + 232, M + 304, M + 380];
  ['Semaine du', 'Visiteurs', 'Pages vues', 'Pages/visite', 'Durée moy.', 'Rebond  Rés.'].forEach((t, i) => T(t.toUpperCase(), cols[i], y, 6.6, bold, GREY));
  for (const h of hh) {
    y -= 14; page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.4, color: LINE });
    [h.start, nf(h.visitors), nf(h.pv), h.ppv.toFixed(1).replace('.', ','), dur(h.ms), `${Math.round(h.bounce * 100)} %    ${h.reservations}`].forEach((t, i) => T(t, cols[i], y, 8.4, mono));
  }
  note('Rebond = visites d’une seule page. Rés. = demandes de réservation envoyées. Un visiteur correspond à un appareil et un navigateur dans la semaine.');

  // ---- Jour par jour ----
  section('Jour par jour', ++n);
  const dmax = Math.max(1, ...cur.perDay.map(d => d.uv));
  barRows(cur.perDay.map(d => ({ label: `${JC[dowOf(d.day)]} ${dm(d.day)}`, v: d.uv, extra: `${nf(d.pv)} vues` })));
  note('Visiteurs par jour, avec le nombre de pages vues.');

  // ---- Pages ----
  section('Pages les plus visitées', ++n);
  barRows(Object.entries(cur.pages).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([k, v]) => ({ label: pageLabel(k).replace('Carte d’affaires (/carte/)', 'Carte (/carte/)'), v: v.v, extra: `${v.dn ? dur(v.ms / v.dn) : '-'}${prev.pv ? '  ' + ((v.v - (prev.pages[k]?.v || 0)) >= 0 ? '+' : '-') + Math.abs(v.v - (prev.pages[k]?.v || 0)) : ''}` })), { total: cur.pv });
  note('Vues · part du total · temps moyen sur la page · écart de vues avec la semaine précédente.');
  sub('Pages d’entrée (première page vue)');
  barRows(top(cur.entry, 5).map(([k, v]) => ({ label: pageLabel(k), v })), { total: sum(cur.entry) });

  // ---- Sources ----
  section('D’où viennent les visiteurs', ++n);
  barRows(top(cur.cat, 7).map(([k, v]) => ({ label: k, v })), { total: cur.arr });
  if (top(cur.ref, 5).length) { sub('Sites référents'); barRows(top(cur.ref, 5).map(([k, v]) => ({ label: k, v }))); }
  note('Direct = lien tapé, signet ou application sans référent. Ajouter ?utm_source=instagram aux liens publiés permet de les distinguer.');

  // ---- Actions + entonnoir ----
  section('Actions des visiteurs', ++n);
  barRows(Object.keys(EVENTS).map(k => ({ label: EVENTS[k], v: cur.ev[k] || 0, extra: hasPrev ? `${(cur.ev[k] || 0) - (prev.ev[k] || 0) >= 0 ? '+' : '-'}${Math.abs((cur.ev[k] || 0) - (prev.ev[k] || 0))}` : '' })));
  sub('Entonnoir de réservation');
  barRows([['Visiteurs du site', cur.visitors], ['Vues de la page Réserver', cur.pages['/reserver/']?.v || 0], ['Formulaires commencés', cur.ev.reserver_debut || 0], ['Demandes envoyées', cur.ev.reserver_envoyee || 0]].map(([label, v]) => ({ label, v })), {});
  ensure(16); y -= 14; T(`Taux de conversion : ${(cur.visitors ? ((cur.ev.reserver_envoyee || 0) / cur.visitors) * 100 : 0).toFixed(1).replace('.', ',')} % des visiteurs envoient une demande.`, M, y, 8.6, mono);

  // ---- Provenance, appareils ----
  section('Provenance', ++n);
  barRows(top(cur.country, 5).map(([k, v]) => ({ label: k, v })), { total: sum(cur.country) });
  sub('Villes'); barRows(top(cur.city, 8).map(([k, v]) => ({ label: k, v })), { total: sum(cur.city) });
  section('Appareils', ++n);
  barRows(top(cur.dev, 3).map(([k, v]) => ({ label: k, v })), { total: sum(cur.dev) });
  sub('Navigateurs'); barRows(top(cur.br, 5).map(([k, v]) => ({ label: k, v })), { total: sum(cur.br) });
  sub('Systèmes'); barRows(top(cur.os, 4).map(([k, v]) => ({ label: k, v })), { total: sum(cur.os) });
  sub('Langue du navigateur'); barRows(top(cur.lang, 4).map(([k, v]) => ({ label: ({ fr: 'Français', en: 'Anglais', es: 'Espagnol', pt: 'Portugais', '?': 'Inconnue' })[k] || k.toUpperCase(), v })), { total: sum(cur.lang) });

  // ---- Heures ----
  section('Heures de visite', ++n);
  ensure(100);
  const hmax = Math.max(1, ...cur.hour), bw = CW / 24, base = y - 80;
  cur.hour.forEach((v, h) => { page.drawRectangle({ x: M + h * bw + 1, y: base, width: bw - 2, height: Math.max(v ? 2 : 0.6, (v / hmax) * 64), color: BLACK }); if (h % 3 === 0) T(String(h), M + h * bw, base - 10, 6.6, mono, GREY); });
  y = base - 14; note('Pages vues par heure de la journée (heure de Montréal).');
  if (Object.keys(cur.nf).length) { section('Pages introuvables (404)', ++n); barRows(top(cur.nf, 5).map(([k, v]) => ({ label: k, v }))); }

  // ---- Données de la semaine (format compact) ----
  section('Données de la semaine, format compact', ++n);
  const kv = [
    `semaine_debut=${cur.start}`, `semaine_fin=${cur.end}`, `visiteurs=${cur.visitors}`, `pages_vues=${cur.pv}`, `pages_par_visite=${cur.pagesPerVisit.toFixed(2)}`, `duree_moyenne_s=${Math.round(cur.avgMs / 1000)}`, `taux_rebond=${cur.bounce.toFixed(3)}`,
    `reservations_envoyees=${cur.ev.reserver_envoyee || 0}`, `formulaires_commences=${cur.ev.reserver_debut || 0}`,
    `visiteurs_semaine_precedente=${prev.visitors}`, `pages_vues_semaine_precedente=${prev.pv}`,
    `sources=${top(cur.cat, 8).map(([k, v]) => k + ':' + v).join(' ')}`, `pages=${Object.entries(cur.pages).sort((a, b) => b[1].v - a[1].v).slice(0, 8).map(([k, v]) => k + ':' + v.v).join(' ')}`,
    `appareils=${top(cur.dev, 3).map(([k, v]) => k + ':' + v).join(' ')}`, `villes=${top(cur.city, 6).map(([k, v]) => k.replace(/ /g, '_') + ':' + v).join(' ')}`,
    `evenements=${Object.entries(cur.ev).map(([k, v]) => k + ':' + v).join(' ')}`,
    ...hh.map(h => `historique ${h.start} visiteurs=${h.visitors} pages_vues=${h.pv} duree_s=${Math.round(h.ms / 1000)} rebond=${h.bounce.toFixed(3)} reservations=${h.reservations}`),
  ];
  for (const l of kv) for (const t of wrap(l, mono, 7.4, CW)) { ensure(11); y -= 10.5; T(t, M, y, 7.4, mono); }
  y -= 8;
  note(`Statistiques de totalstudios.ca. Aucun témoin (cookie) ni adresse IP conservée.${firstDay ? ' Collecte active depuis le ' + dm(firstDay) + '.' : ''} Les visites de l’équipe sont exclues avec totalstudios.ca/?notrack sur chaque appareil.`);

  // ---- Pied de page ----
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.5, color: LINE });
    page = p; T(`TOTAL STUDIOS  ·  Rapport hebdomadaire  ·  ${range}`, M, 32, 6.8, mono, GREY); TR(`${i + 1} / ${pages.length}`, W - M, 32, 6.8, mono);
  });
  return Buffer.from(await pdf.save());
}
const weekOf = d => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return t.toISOString().slice(0, 10); };
