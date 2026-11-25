// Bir soruyu yanıtlar. Model modunda (varsayılan) soruya en yakın bölümler iki yolla bulunur: kelimeyle (BM25) ve anlamla
// (bge-m3 vektörleri). İki sıralama birleştirilir (Reciprocal Rank Fusion), her maddeden en iyi tek bölüm alınır ve en iyi
// beşi Workers AI'ye gönderilir; model yalnızca bunlardan yazar ve yanıt yazılırken ekrana akar. Hizmete ulaşılamazsa ya da
// günlük ücretsiz kota dolduysa arama moduna dönülür ve bu söylenir.
import { askModel, toModel } from '../lib/ai';
import { Index, type Passage } from '../lib/search';
import { clearStream, setStream } from '../lib/stream';
import { embed, seedVectors, sim, uploadVectors } from '../lib/vectors';
import { ROLE_ASKER, ROLE_BOOST, answer, gradeRow, passageOf, searchable, withoutDate, type AnswerData, type Cite, type Trace } from './answer';
import { addAnswer, updateAnswer } from './conversations';
import { docById } from './library';
import type { RoleId } from './types';

export type Mode = 'ai' | 'search';

/** Anlam benzerliği bunun altındaysa bölüm aday sayılmaz (bge-m3'te ilgisiz metinler genellikle bunun altında kalır) */
export const MIN_SIM = 0.42;
// Reciprocal Rank Fusion sabiti ve modele gönderilen bölüm sayısı
const RRF_K = 60;
const SEND = 5;

const clauseKey = (p: Passage) => `${p.doc.id}#${p.loc.clause}`;

/** Kelime ve anlam sıralamalarını birleştirir. Vektör ucuna ulaşılamazsa yalnızca kelime sıralaması kalır. */
export async function retrieve(q: string, index: Index, role: RoleId): Promise<{ picked: { p: Passage; matched: string[]; via: ('word' | 'meaning')[] }[]; words: number; meaning: number | null }> {
  const words = index.search(withoutDate(q), 20, ROLE_BOOST[role], 0.3).hits;
  const fused = new Map<string, { p: Passage; matched: string[]; s: number; via: ('word' | 'meaning')[] }>();
  const add = (p: Passage, rank: number, matched: string[], via: 'word' | 'meaning') => {
    const k = clauseKey(p);
    const cur = fused.get(k);
    const s = 1 / (RRF_K + rank);
    if (cur) {
      cur.s += s;
      cur.via.push(via);
      if (!cur.matched.length) cur.matched = matched;
    } else fused.set(k, { p, matched, s, via: [via] });
  };
  words.forEach((h, i) => add(h.p, i, h.matched, 'word'));

  const [qv] = (await embed([q])) ?? [];
  let meaning: number | null = null;
  if (qv) {
    const seed = await seedVectors();
    const scored: { p: Passage; x: number }[] = [];
    for (const p of index.passages) {
      const v = p.doc.uploaded ? uploadVectors(p.doc.id)?.get(p.key) : seed.get(p.key);
      if (!v) continue;
      const x = sim(qv, v);
      if (x >= MIN_SIM) scored.push({ p, x });
    }
    scored.sort((a, b) => b.x - a.x);
    const seen = new Set<string>();
    let rank = 0;
    for (const { p } of scored) {
      const k = clauseKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      add(p, rank++, [], 'meaning');
      if (rank >= 20) break;
    }
    meaning = rank;
  }
  return { picked: [...fused.values()].sort((a, b) => b.s - a.s).slice(0, SEND), words: words.length, meaning };
}

export function ask(convId: string | undefined, q: string, role: RoleId, lossDateField: string | undefined, lang: 'en' | 'tr', mode: Mode, only?: string) {
  const base = answer(q, role, lossDateField, only);
  if (mode === 'search') {
    const id = addAnswer(convId, base);
    return { convId: id, answer: base, done: Promise.resolve(base) };
  }
  const { docs } = searchable(role, base.lossDate, only);
  const index = new Index(docs);
  const trace: Trace = { docs: docs.length, passages: index.passages.length };
  const pending: AnswerData = { ...base, mode: 'ai', pending: true, kind: 'found', cites: [], trace };
  const id = addAnswer(convId, pending);

  const done = (async (): Promise<AnswerData> => {
    const found = await retrieve(q, index, role);
    const picked = found.picked;
    const traced: Trace = { ...trace, words: found.words, meaning: found.meaning, chosen: picked.length };
    // Hiçbir bölüm eşleşmiyorsa modele sorulmaz (kota harcanmaz)
    if (!picked.length) {
      const next = { ...base, id: pending.id, trace: traced };
      updateAnswer(id, pending.id, next);
      return next;
    }
    const sent: Cite[] = picked.map(({ p, matched }) => gradeRow({ key: p.key, docId: p.doc.id, ref: p.ref, loc: p.loc, matched }, role));
    updateAnswer(id, pending.id, { ...pending, cites: sent, trace: traced });

    const r = await askModel(q, lang, ROLE_ASKER[role], sent.map((c) => toModel(passageOf(c)!)), role, undefined, (s) => setStream(pending.id, s));
    clearStream(pending.id);
    let next: AnswerData;
    if (!r.ok) {
      next = { ...base, id: pending.id, fallback: r.reason, trace: traced };
    } else {
      // Modelin kullandığı bölümler yanıttaki sıraya göre yeniden numaralanır (1, 2, 3…)
      const order = [...new Set([...r.cited, ...r.quotes.map((x) => x.n)])].filter((n) => n >= 1 && n <= sent.length);
      const map = new Map(order.map((n, i) => [n, i + 1]));
      const text = r.answer.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, list: string) => {
        const ns = list.split(',').map((x) => map.get(+x.trim())).filter(Boolean);
        return ns.length ? `[${ns.join(', ')}]` : '';
      });
      const cites = r.verdict === 'none' ? [] : order.map((n) => sent[n - 1]);
      const wordingDoc = cites.map((c) => docById(c.docId)).find((d) => d?.kind === 'wording');
      next = {
        ...base,
        id: pending.id,
        mode: 'ai',
        kind: r.verdict === 'none' ? 'none' : 'found',
        cites,
        trace: traced,
        wording: wordingDoc ? { docId: wordingDoc.id, reason: base.lossDate ? 'date' : 'today' } : undefined,
        ai: {
          model: r.model,
          verdict: r.verdict,
          text,
          quotes: r.verdict === 'none' ? [] : r.quotes.filter((x) => map.has(x.n)).map((x) => ({ i: map.get(x.n)! - 1, text: x.text })),
          dropped: r.dropped,
          neurons: r.neurons,
          cached: r.cached,
          sent: sent.length
        }
      };
    }
    updateAnswer(id, pending.id, next);
    return next;
  })();
  return { convId: id, answer: pending, done };
}
