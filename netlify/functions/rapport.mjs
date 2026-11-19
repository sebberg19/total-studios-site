// Chaque dimanche à 10 h (heure de Montréal) : envoie le rapport des 7 derniers jours à info@totalstudios.ca.
// Netlify planifie en heure UTC : on se déclenche à 14 h et à 15 h UTC, puis on n'envoie que lorsqu'il est exactement 10 h à Montréal (gère l'heure d'été).
import { runReport } from '../lib/send-report.mjs';

const heureMtl = () => +new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', hourCycle: 'h23' }).format(new Date());

export default async () => {
  if (heureMtl() !== 10) { console.log('rapport: pas 10 h à Montréal, rien à faire'); return; }
  const r = await runReport({ send: true });
  console.log('rapport', r.sent ? 'envoyé' : 'non envoyé', r.error || '');
};
export const config = { schedule: '0 14,15 * * 0' };
