// Chaque nuit : regroupe les mesures brutes de la veille en un résumé journalier (plus rapide à lire pour le rapport).
import { compactAll } from '../lib/stats.mjs';
import { statsStore } from '../lib/send-report.mjs';
export default async () => { const n = await compactAll(statsStore()); console.log('compactage', n, 'événements'); };
export const config = { schedule: '30 7 * * *' };
