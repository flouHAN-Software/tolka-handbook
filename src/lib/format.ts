import { getLang } from './i18n';

/** "1 Mar 2026" (İrlanda İngilizcesi) ya da "1 Mar 2026" (Türkçe kısa ay) */
export function date(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(getLang() === 'tr' ? 'tr-TR' : 'en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Ay sayısı ya da gün olarak süre: "7 months", "40 days" */
export function span(days: number) {
  const tr = getLang() === 'tr';
  if (days >= 60) {
    const m = Math.round(days / 30.4);
    return tr ? `${m} ay` : `${m} months`;
  }
  return tr ? `${days} gün` : `${days} ${days === 1 ? 'day' : 'days'}`;
}
