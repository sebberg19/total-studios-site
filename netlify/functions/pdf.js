// Génère le PDF « Demande de réservation » au style TOTAL STUDIOS (noir et blanc, Archivo + Cascadia Mono Light).
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const F = require('./fonts');
const LOGO = require('./logo');

const W = 612, H = 792, M = 48, COL = 102; // marges et largeur de la colonne des libellés (≈36 mm)
const BLACK = rgb(0, 0, 0), GREY = rgb(0.56, 0.56, 0.56), LINE = rgb(0.74, 0.74, 0.74);

const FR_DATE = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const FR_STAMP = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Toronto' });
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clean = s => String(s == null ? '' : s).replace(/[—–]/g, '-').replace(/\r/g, '').trim();

const FR_SHORT = new Intl.DateTimeFormat('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
function fmtDates(v, short) {
  const list = clean(v).split(/\s*,\s*/).filter(Boolean);
  return list.map(d => { const t = new Date(d + 'T12:00:00Z'); return isNaN(t) ? d : cap((short ? FR_SHORT : FR_DATE).format(t)); });
}
function fmtHeure(v) { const m = /^(\d{1,2}):(\d{2})/.exec(clean(v)); return m ? `${+m[1]} h ${m[2]}` : clean(v); }

function sections(d) {
  const profil = clean(d.profil).toUpperCase();
  const orgLabel = profil === 'CLUB' ? 'Nom du club' : profil === 'LIGUE' ? 'Nom de la ligue' : 'Équipe ou club';
  const hmap = {};
  clean(d.heures).split(/\s*;\s*/).filter(Boolean).forEach(x => { const [k, v] = x.split(/\s+/); if (k) hmap[k] = v; });
  const isos = clean(d.dates).split(/\s*,\s*/).filter(Boolean);
  const perDate = Object.keys(hmap).length > 0;
  const dates = fmtDates(d.dates, fmtDates(d.dates).length > 8).map((x, i) => perDate && hmap[isos[i]] ? `${x} · ${fmtHeure(hmap[isos[i]])}` : x);
  const multi = /multi/i.test(clean(d.mode));
  const S = [];
  S.push(['Profil', [
    ['Profil', cap(clean(d.profil).toLowerCase())],
    [orgLabel, d.organisation],
    ['Numéro de chandail', d.numero],
    ['Équipe ou catégorie', d.categorie],
    ['Âge ou catégorie', d.age],
    ['Nombre d’équipes', d.nb_equipes],
    ['Matchs ou équipes visés', d.volume],
  ]]);
  S.push(['Session', [
    ['Type de session', d.type_session],
    ['Services', d.services],
    ['Sport', d.sport],
  ]]);
  S.push(['Besoins', [
    ['Options', d.options],
    ['Contenu digital', d.contenu],
    ['Publications par mois', d.pubs_mois],
    ['Nombre d’affiches', d.nb_affiches],
    ['Gabarits existants', d.gabarits],
    ['Compte Instagram', d.instagram],
  ]]);
  S.push(['Date et heure', [
    ['Format', multi ? 'Plusieurs sessions' : 'Une session'],
    [dates.length > 1 ? 'Dates' : 'Date', dates],
    ...(perDate ? [] : [['Heure de début', fmtHeure(d.heure)]]),
  ]]);
  S.push(['Lieu', [['Ville', d.ville], ['Terrain / parc', d.terrain]]]);
  S.push(['Coordonnées', [
    ['Nom', d.nom], ['Vous êtes', d.repondant], ['Fonction', d.fonction], ['Courriel', d.courriel], ['Téléphone', d.telephone], ['Précisions', d.projet],
  ]]);
  return S.map(([t, rows]) => [t, rows.filter(([, v]) => Array.isArray(v) ? v.length : clean(v))]).filter(([, r]) => r.length);
}

async function buildPdf(data, meta = {}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const black = await pdf.embedFont(Buffer.from(F['archivo-black'], 'base64'), { subset: true });
  const bold = await pdf.embedFont(Buffer.from(F['archivo-bold'], 'base64'), { subset: true });
  const mono = await pdf.embedFont(Buffer.from(F['cascadia-light'], 'base64'), { subset: true });
  pdf.setTitle('Demande de réservation | TOTAL STUDIOS');
  pdf.setAuthor('TOTAL STUDIOS');
  pdf.setCreator('totalstudios.ca');

  const wrap = (text, font, size, width) => {
    const out = [];
    for (const para of clean(text).split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/)) {
        const t = line ? line + ' ' + w : w;
        if (font.widthOfTextAtSize(t, size) <= width || !line) line = t; else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  };
  const logo = (page, x, top, width, color = BLACK) => {
    const sc = width / LOGO.vb[2];
    for (const p of LOGO.paths) page.drawSvgPath(p, { x: x - LOGO.vb[0] * sc, y: top + LOGO.vb[1] * sc, scale: sc, color, borderWidth: 0 });
    return LOGO.vb[3] * sc;
  };

  let page, y;
  const newPage = first => {
    page = pdf.addPage([W, H]);
    if (first) { logo(page, M, H - 44, 150); y = H - 44 - 40; }
    else {
      logo(page, M, H - 40, 96);
      const t = 'DEMANDE DE RÉSERVATION';
      page.drawText(t, { x: W - M - mono.widthOfTextAtSize(t, 6.6), y: H - 40 - 7, size: 6.6, font: mono, color: GREY });
      y = H - 40 - 44;
    }
  };
  newPage(true);

  // Bloc titre
  y -= 26;
  page.drawText('DEMANDE DE RÉSERVATION', { x: M, y: y + 0, size: 7.6, font: mono, color: GREY });
  y -= 28;
  page.drawText('DEMANDE DE', { x: M, y, size: 25, font: black, color: BLACK });
  y -= 27;
  page.drawText('RÉSERVATION', { x: M, y, size: 25, font: black, color: BLACK });
  const ref = meta.number ? `N° ${meta.number}` : '';
  const stamp = meta.created ? FR_STAMP.format(new Date(meta.created)) : FR_STAMP.format(new Date());
  const right = [ref, `Reçue le ${stamp}`].filter(Boolean);
  right.forEach((t, i) => page.drawText(t, { x: W - M - mono.widthOfTextAtSize(t, 8), y: y + 28 - i * 13, size: 8, font: mono, color: i ? GREY : BLACK }));
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 2, color: BLACK });
  y -= 6;

  const ensure = need => { if (y - need < 64) { newPage(false); return true; } return false; };
  const colW = (W - 2 * M - COL) / 3;
  let n = 0;
  for (const [title, rows] of sections(data)) {
    n++;
    ensure(80);
    y -= 20;
    page.drawText(String(n).padStart(2, '0'), { x: M, y: y - 1, size: 18, font: black, color: BLACK });
    page.drawText(title.toUpperCase(), { x: M + COL, y, size: 10.5, font: black, color: BLACK });
    y -= 12;
    for (const [label, value] of rows) {
      const grid = Array.isArray(value) && value.length > 8;
      let flat, lh = 12.5;
      if (grid) flat = value.map(clean);
      else if (Array.isArray(value)) flat = value.flatMap(l => wrap(l, mono, 9, W - 2 * M - COL - 4));
      else flat = wrap(value, mono, 9, W - 2 * M - COL - 4);
      const labLines = wrap(label.toUpperCase(), bold, 7.4, COL - 12);
      const rowsN = grid ? Math.ceil(flat.length / 3) : flat.length;
      ensure(Math.min(rowsN * lh, 60) + 16);
      page.drawLine({ start: { x: M + COL, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
      labLines.forEach((l, i) => page.drawText(l, { x: M, y: y - 12 - i * 11, size: 7.4, font: bold, color: BLACK }));
      y -= 12;
      for (let i = 0; i < rowsN; i++) {
        if (ensure(lh + 4)) y -= 12;
        if (grid) for (let c = 0; c < 3; c++) { const t = flat[i * 3 + c]; if (t) page.drawText(t, { x: M + COL + c * colW, y, size: 8.6, font: mono, color: BLACK }); }
        else page.drawText(flat[i], { x: M + COL, y, size: 9, font: mono, color: BLACK });
        y -= i < rowsN - 1 ? lh : 8;
      }
      y -= Math.max(0, (12 + (labLines.length - 1) * 11 + 8) - (12 + (rowsN - 1) * lh + 8));
    }
    page.drawLine({ start: { x: M + COL, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
  }

  // Pied de page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.5, color: LINE });
    p.drawText('TOTAL STUDIOS  ·  info@totalstudios.ca', { x: M, y: 32, size: 6.8, font: mono, color: GREY });
    const t = `${i + 1} / ${pages.length}`;
    p.drawText(t, { x: W - M - mono.widthOfTextAtSize(t, 6.8), y: 32, size: 6.8, font: mono, color: BLACK });
  });
  return Buffer.from(await pdf.save());
}

module.exports = { buildPdf, fmtDates, fmtHeure, clean };
