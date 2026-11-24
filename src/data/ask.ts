// Bir soruyu yanıtlar. Model modunda (varsayılan) soruya en yakın 5 bölüm Workers AI'ye gönderilir ve model
// yalnızca bunlardan yazar; hizmete ulaşılamazsa ya da günlük ücretsiz kota dolduysa arama moduna dönülür ve bu söylenir.
import { askModel, toModel } from '../lib/ai';
import { Index } from '../lib/search';
import { ROLE_ASKER, ROLE_BOOST, answer, gradeRow, passageOf, searchable, withoutDate, type AnswerData, type Cite } from './answer';
import { addAnswer, updateAnswer } from './conversations';
import { docById } from './library';
import type { RoleId } from './types';

export type Mode = 'ai' | 'search';

export function ask(convId: string | undefined, q: string, role: RoleId, lossDateField: string | undefined, lang: 'en' | 'tr', mode: Mode, only?: string) {
  const base = answer(q, role, lossDateField, only);
  if (mode === 'search') {
    const id = addAnswer(convId, base);
    return { convId: id, answer: base, done: Promise.resolve(base) };
  }
  const { docs } = searchable(role, base.lossDate, only);
  const hits = new Index(docs).search(withoutDate(q), 5, ROLE_BOOST[role], 0.3).hits;
  // Hiçbir bölüm eşleşmiyorsa modele sorulmaz (kota harcanmaz)
  if (!hits.length) {
    const id = addAnswer(convId, base);
    return { convId: id, answer: base, done: Promise.resolve(base) };
  }
  const sent: Cite[] = hits.map((h) => gradeRow({ key: h.p.key, docId: h.p.doc.id, ref: h.p.ref, loc: h.p.loc, matched: h.matched }, role));
  const pending: AnswerData = { ...base, mode: 'ai', pending: true, kind: 'found', cites: sent };
  const id = addAnswer(convId, pending);

  const done = askModel(q, lang, ROLE_ASKER[role], sent.map((c) => toModel(passageOf(c)!)), role).then((r) => {
    let next: AnswerData;
    if (!r.ok) {
      next = { ...base, id: pending.id, fallback: r.reason };
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
  });
  return { convId: id, answer: pending, done };
}
