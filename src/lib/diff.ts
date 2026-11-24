// İki sürüm arasında madde madde, kelime düzeyinde fark (en uzun ortak alt dizi).
import type { Block, Clause, Doc } from '../data/types';

export type Piece = { t: 'same' | 'add' | 'del'; s: string };

export interface ClauseDiff {
  section: string;
  title: string;
  n: string;
  state: 'same' | 'changed' | 'added' | 'removed';
  pieces: Piece[];
}

/** Maddenin düz metni: liste maddeleri "(a) …" biçiminde, tablo satırları " | " ile */
export function clauseText(c: Clause) {
  return c.blocks
    .map((b: Block) =>
      b.t === 'p' || b.t === 'note'
        ? b.text
        : b.t === 'list'
          ? b.items.map((i) => (i.n ? `${i.n} ${i.text}` : i.text)).join('\n')
          : b.rows.map((r) => r.join(' | ')).join('\n')
    )
    .join('\n')
    .replace(/\*\*/g, '');
}

function words(s: string) {
  return s.split(/(\s+)/).filter((x) => x !== '');
}

export function diffWords(a: string, b: string): Piece[] {
  const x = words(a);
  const y = words(b);
  const n = x.length;
  const m = y.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: Piece[] = [];
  const push = (t: Piece['t'], s: string) => {
    const last = out[out.length - 1];
    if (last && last.t === t) last.s += s;
    else out.push({ t, s });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { push('same', x[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) push('del', x[i++]);
    else push('add', y[j++]);
  }
  while (i < n) push('del', x[i++]);
  while (j < m) push('add', y[j++]);
  return out;
}

/** Yeni sürümün maddeleri, eski sürümdeki aynı numaralı maddeyle karşılaştırılır */
export function compareDocs(older: Doc, newer: Doc): ClauseDiff[] {
  const oldMap = new Map<string, { c: Clause; sec: string; title: string }>();
  for (const s of older.sections) for (const c of s.clauses) oldMap.set(c.n, { c, sec: s.n, title: s.title });
  const out: ClauseDiff[] = [];
  const seen = new Set<string>();
  for (const s of newer.sections) {
    for (const c of s.clauses) {
      seen.add(c.n);
      const o = oldMap.get(c.n);
      const now = clauseText(c);
      if (!o) out.push({ section: s.n, title: s.title, n: c.n, state: 'added', pieces: [{ t: 'add', s: now }] });
      else {
        const was = clauseText(o.c);
        out.push({ section: s.n, title: s.title, n: c.n, state: was === now ? 'same' : 'changed', pieces: was === now ? [{ t: 'same', s: now }] : diffWords(was, now) });
      }
    }
  }
  for (const [n, o] of oldMap) if (!seen.has(n)) out.push({ section: o.sec, title: o.title, n, state: 'removed', pieces: [{ t: 'del', s: clauseText(o.c) }] });
  return out;
}
