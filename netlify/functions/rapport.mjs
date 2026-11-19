// Chaque dimanche matin (environ 8 h à Montréal) : envoie le rapport des 7 derniers jours à info@totalstudios.ca.
import { runReport } from '../lib/send-report.mjs';
export default async () => { const r = await runReport({ send: true }); console.log('rapport', r.sent ? 'envoyé' : 'non envoyé', r.error || ''); };
export const config = { schedule: '0 13 * * 0' };
