// Statistiques maison de totalstudios.ca : collecte anonyme, regroupement par jour et agrégation hebdomadaire.
// Aucune adresse IP n'est conservée. Seul un code court (hachage IP + navigateur + sel qui change chaque semaine) sert à compter les visiteurs.
import { createHash, randomBytes } from 'node:crypto';

const TZ = 'America/Toronto';
const F_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const F_HOUR = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });
export const dayOf = ms => F_DAY.format(new Date(ms));
export const hourOf = ms => +F_HOUR.format(new Date(ms)) % 24;
export const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const dow = d => new Date(d + 'T12:00:00Z').getUTCDay();
export const weekStartOf = d => addDays(d, -dow(d)); // semaines du dimanche au samedi

const PAGES = { '/': 'Accueil', '/galerie/': 'Galerie', '/services/': 'Services', '/a-propos/': 'À propos', '/contact/': 'Contact', '/reserver/': 'Réserver', '/carte/': 'Carte d’affaires (/carte/)' };
export const pageLabel = p => PAGES[p] || p;
export const EVENTS = {
  reserver_envoyee: 'Demande de réservation envoyée',
  reserver_debut: 'Formulaire de réservation commencé',
  mail: 'Clic sur le courriel',
  instagram: 'Clic sur Instagram',
  facebook: 'Clic sur Facebook',
  vcard: 'Contact enregistré (vCard)',
  tel: 'Clic sur le téléphone',
  carte_lien: 'Clic sur un lien de la carte',
};

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|java\/|facebookexternalhit|preview/i;
const own = h => /(^|\.)totalstudios\.ca$/.test(h) || /\.netlify\.app$/.test(h);

// ---------- analyse d'un événement ----------
export function refCat(host, utm) {
  if (!host && utm) return /instagram/i.test(utm) ? 'Instagram' : /facebook|fb/i.test(utm) ? 'Facebook' : 'Campagne';
  if (!host) return 'Direct';
  if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com)$/.test(host)) return 'IA';
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|qwant|brave|baidu|yandex)\./.test(host)) return 'Recherche';
  if (/(^|\.)instagram\.com$/.test(host)) return 'Instagram';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(host)) return 'Facebook';
  if (/(^|\.)(t\.co|twitter\.com|x\.com|linkedin\.com|lnkd\.in|tiktok\.com|youtube\.com|youtu\.be|reddit\.com|pinterest\.[a-z]+)$/.test(host)) return 'Autres réseaux';
  return 'Autres sites';
}
function uaInfo(ua) {
  ua = ua || '';
  const br = /Instagram/i.test(ua) ? 'Instagram (intégré)' : /FBAN|FBAV/.test(ua) ? 'Facebook (intégré)' : /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Autre';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux|CrOS/.test(ua) ? 'Linux' : 'Autre';
  return { br, os };
}
const clip = (s, n) => String(s || '').slice(0, n);

export async function ingest(store, b, meta) {
  if (!b || typeof b !== 'object') return 'ignored';
  const ua = meta.ua || '';
  if (!ua || BOT.test(ua)) return 'bot';
  const k = b.k;
  if (!['v', 'd', 'e'].includes(k)) return 'ignored';
  const now = Date.now(), day = dayOf(now);
  const salt = await getSalt(store, weekStartOf(day));
  const h = createHash('sha256').update(salt + '|' + (meta.ip || '') + '|' + ua).digest('hex').slice(0, 12);
  const p = clip(b.p, 120).split('?')[0];
  if (!/^\/[a-z0-9\-_\/.]*$/i.test(p)) return 'ignored';
  const ev = { t: now, h, k, p };
  if (k === 'v') {
    const { br, os } = uaInfo(ua), w = +b.w || 0;
    Object.assign(ev, {
      dev: w && w < 768 ? 'Mobile' : w && w < 1100 ? 'Tablette' : 'Ordinateur', br, os,
      lang: clip(b.l, 2).toLowerCase() || '?',
      co: clip(meta.geo?.country?.name || meta.geo?.country?.code, 40), ci: clip(meta.geo?.city, 40), rg: clip(meta.geo?.subdivision?.code, 6),
    });
    if (b.n) ev.nf = 1;
    if ('r' in b) {
      let host = ''; try { host = new URL(String(b.r)).hostname.replace(/^www\./, '').toLowerCase(); } catch (_) {}
      if (own(host)) host = '';
      ev.arr = 1; ev.rh = host; ev.u = clip(b.s, 30).toLowerCase(); ev.rc = refCat(host, ev.u);
    }
  } else if (k === 'd') {
    ev.ms = Math.max(0, Math.min(+b.ms || 0, 1800000));
  } else {
    const n = clip(b.n, 24); if (!/^[a-z_]{2,24}$/.test(n)) return 'ignored'; ev.n = n;
  }
  await store.setJSON(`raw/${day}/${now.toString(36)}-${randomBytes(3).toString('hex')}`, ev);
  return 'ok';
}

const saltCache = {};
async function getSalt(store, week) {
  if (saltCache[week]) return saltCache[week];
  const key = 'salt/' + week;
  let s = await store.get(key);
  if (!s) { try { await store.set(key, randomBytes(16).toString('hex'), { onlyIfNew: true }); } catch (_) {} s = await store.get(key); }
  return (saltCache[week] = s || 'x');
}

// ---------- regroupement par jour ----------
const blank = day => ({ day, pv: 0, arr: 0, ev: {}, pages: {}, entry: {}, ref: {}, cat: {}, utm: {}, country: {}, city: {}, dev: {}, br: {}, os: {}, lang: {}, hour: Array(24).fill(0), nf: {}, v: {} });
const inc = (o, k, n = 1) => { if (k === undefined || k === '') return; if (!(k in o) && Object.keys(o).length >= 300) k = '(autres)'; o[k] = (o[k] || 0) + n; };

export function apply(s, e) {
  const v = s.v[e.h] || (s.v[e.h] = { n: 0, ms: 0 });
  if (e.k === 'v') {
    s.pv++; v.n++;
    s.hour[hourOf(e.t)]++;
    const pg = s.pages[e.p] || (s.pages[e.p] = { v: 0, ms: 0, dn: 0 }); pg.v++;
    if (v.n === 1) { v.e = e.p; inc(s.entry, e.p); inc(s.dev, e.dev); inc(s.br, e.br); inc(s.os, e.os); inc(s.lang, e.lang); inc(s.country, e.co); inc(s.city, e.ci ? e.ci + (e.rg ? ', ' + e.rg : '') : ''); }
    if (e.nf) inc(s.nf, e.p);
    if (e.arr) { s.arr++; inc(s.cat, e.rc); inc(s.ref, e.rh); inc(s.utm, e.u); }
  } else if (e.k === 'd') {
    v.ms += e.ms; const pg = s.pages[e.p] || (s.pages[e.p] = { v: 0, ms: 0, dn: 0 }); pg.ms += e.ms; pg.dn++;
  } else if (e.k === 'e') inc(s.ev, e.n);
}
export function finalize(s) {
  const vs = Object.values(s.v || {});
  if (s.v) { s.uv = vs.length; s.bn = vs.filter(x => x.n === 1).length; const t = vs.filter(x => x.ms > 0); s.vms = t.reduce((a, x) => a + x.ms, 0); s.vdn = t.length; }
  return s;
}

async function mapPool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const j = i++; out[j] = await fn(items[j]); } }));
  return out;
}

export async function compactDay(store, day) {
  const { blobs } = await store.list({ prefix: `raw/${day}/` });
  if (!blobs.length) return 0;
  const evs = (await mapPool(blobs, 25, async b => store.get(b.key, { type: 'json' }))).filter(Boolean).sort((a, b) => a.t - b.t);
  const s = (await store.get('day/' + day, { type: 'json' })) || blank(day);
  for (const e of evs) apply(s, e);
  finalize(s);
  await store.setJSON('day/' + day, s);
  await mapPool(blobs, 25, b => store.delete(b.key));
  return evs.length;
}
export async function compactAll(store) {
  const { directories = [] } = await store.list({ prefix: 'raw/', directories: true });
  let n = 0;
  for (const d of directories) { const m = d.match(/raw\/(\d{4}-\d{2}-\d{2})\/?$/); if (m) n += await compactDay(store, m[1]); }
  return n;
}

// ---------- agrégation hebdomadaire ----------
const merge = (a, b) => { for (const k in b) a[k] = (a[k] || 0) + b[k]; };
export function weekAgg(days, start) {
  const a = { start, end: addDays(start, 6), pv: 0, arr: 0, ev: {}, pages: {}, entry: {}, ref: {}, cat: {}, utm: {}, country: {}, city: {}, dev: {}, br: {}, os: {}, lang: {}, hour: Array(24).fill(0), nf: {}, sumUv: 0, bn: 0, vms: 0, vdn: 0, perDay: [], first: null };
  const U = new Set(); let allV = true;
  days.forEach((d, i) => {
    const day = addDays(start, i);
    if (!d) { a.perDay.push({ day, pv: 0, uv: 0 }); return; }
    if (!a.first) a.first = day;
    a.pv += d.pv; a.arr += d.arr; a.sumUv += d.uv || 0; a.bn += d.bn || 0; a.vms += d.vms || 0; a.vdn += d.vdn || 0;
    for (const f of ['ev', 'entry', 'ref', 'cat', 'utm', 'country', 'city', 'dev', 'br', 'os', 'lang', 'nf']) merge(a[f], d[f] || {});
    d.hour.forEach((x, h) => a.hour[h] += x);
    for (const p in d.pages) { const g = a.pages[p] || (a.pages[p] = { v: 0, ms: 0, dn: 0 }); g.v += d.pages[p].v; g.ms += d.pages[p].ms; g.dn += d.pages[p].dn; }
    if (d.v) Object.keys(d.v).forEach(h => U.add(h)); else if (d.uv) allV = false;
    a.perDay.push({ day, pv: d.pv, uv: d.uv || 0 });
  });
  a.visitors = allV ? U.size : a.sumUv;
  a.pagesPerVisit = a.sumUv ? a.pv / a.sumUv : 0;
  a.avgMs = a.vdn ? a.vms / a.vdn : 0;
  a.bounce = a.sumUv ? a.bn / a.sumUv : 0;
  return a;
}
const kpiOf = a => ({ start: a.start, visitors: a.visitors, pv: a.pv, ppv: a.pagesPerVisit, ms: a.avgMs, bounce: a.bounce, reservations: a.ev.reserver_envoyee || 0 });

export async function loadWeek(store, start) {
  const days = await Promise.all(Array.from({ length: 7 }, (_, i) => store.get('day/' + addDays(start, i), { type: 'json' })));
  return weekAgg(days, start);
}

export async function buildReport(store, nowMs = Date.now()) {
  await compactAll(store);
  const today = dayOf(nowMs), end = addDays(today, -1), start = addDays(end, -6);
  const cur = await loadWeek(store, start), prev = await loadWeek(store, addDays(start, -7));
  // historique : 8 dernières semaines, réutilise les résultats déjà figés
  const hist = [];
  for (let i = 7; i >= 0; i--) {
    const st = addDays(start, -7 * i);
    if (i === 0) { hist.push(kpiOf(cur)); continue; }
    if (i === 1) { hist.push(kpiOf(prev)); continue; }
    const saved = await store.get('week/' + st, { type: 'json' });
    hist.push(saved || kpiOf(await loadWeek(store, st)));
  }
  await store.setJSON('week/' + start, kpiOf(cur));
  await store.setJSON('week/' + addDays(start, -7), kpiOf(prev));
  // collecte active depuis
  const { blobs } = await store.list({ prefix: 'day/' });
  const firstDay = blobs.map(b => b.key.slice(4)).sort()[0] || null;
  // nettoyage : on retire la liste des visiteurs après 21 jours (il ne reste que les totaux)
  for (const b of blobs) { const d = b.key.slice(4); if (d < addDays(today, -21)) { const s = await store.get(b.key, { type: 'json' }); if (s && s.v) { delete s.v; await store.setJSON(b.key, s); } } }
  return { cur, prev, hist, firstDay, today };
}
