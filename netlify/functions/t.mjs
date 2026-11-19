// Reçoit les mesures anonymes envoyées par le site (page vue, durée, clic). Ne renvoie rien.
import { ingest } from '../lib/stats.mjs';
import { statsStore } from '../lib/send-report.mjs';

export default async (req, context) => {
  const no = status => new Response(null, { status });
  if (req.method !== 'POST') return no(405);
  try {
    const o = req.headers.get('origin') || '';
    let host = ''; try { host = new URL(o).hostname; } catch (_) {}
    if (!/(^|\.)totalstudios\.ca$|\.netlify\.app$/.test(host)) return no(204);
    const raw = await req.text();
    if (raw.length > 2000) return no(204);
    await ingest(statsStore(), JSON.parse(raw), { ip: context.ip, ua: req.headers.get('user-agent'), geo: context.geo });
  } catch (e) { console.error('t:', e && e.message); }
  return no(204);
};
export const config = { path: '/api/t' };
