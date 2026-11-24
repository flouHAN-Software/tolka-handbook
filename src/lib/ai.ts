// Yanıtı dil modeline yazdıran istemci. Model sitenin Cloudflare Worker'ında çalışır (worker/handbook.js);
// buraya yalnızca soruya en yakın birkaç bölüm gönderilir, belge dosyası gönderilmez.
import { review } from '../data/library';
import type { Block } from '../data/types';
import type { Passage } from './search';

/** doc ve key: sunucu, bölümün o belgeye ait olduğunu ve rolün belgeyi açabildiğini bunlarla denetler */
export interface ModelPassage { label: string; overdue: string; text: string; doc: string; key: string }

export type ModelResult =
  | { ok: true; model: string; verdict: 'answered' | 'partial' | 'none'; answer: string; quotes: { n: number; text: string }[]; dropped: number; cited: number[]; neurons: number; cached?: boolean }
  | { ok: false; reason: 'quota' | 'rate' | 'busy' | 'format' | 'offline' | 'origin' | 'bad' | 'unavailable' | 'access' };

/** Modele gönderilen hâli: tablo satırı yerine tablonun tamamı (bir satır tek başına anlamsız kalıyor) */
export function toModel(p: Passage): ModelPassage {
  let text = p.text;
  if (p.loc.row !== undefined) {
    const c = p.section.clauses.find((x) => x.n === p.loc.clause);
    const b = c?.blocks[p.loc.block] as Block | undefined;
    if (b?.t === 'table') text = [b.head.join(' | '), ...b.rows.map((r) => r.join(' | '))].join('\n');
  }
  const rv = review(p.doc);
  return {
    label: `${p.doc.title} ${p.doc.version}, page ${p.section.page}, clause ${p.ref}${p.loc.row !== undefined ? ' (table)' : ''}`,
    overdue: rv.state === 'overdue' ? `review overdue since ${p.doc.reviewDue}` : '',
    text,
    doc: p.doc.id,
    key: p.key
  };
}

export async function askModel(q: string, lang: 'en' | 'tr', asker: string, passages: ModelPassage[], role: string, model?: string): Promise<ModelResult> {
  try {
    const r = await fetch('/api/handbook/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, lang, asker, role, passages, model })
    });
    const j = await r.json().catch(() => null);
    if (j?.ok) return j;
    return { ok: false, reason: j?.reason ?? 'busy' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}
