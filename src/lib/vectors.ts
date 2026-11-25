// Anlam araması: soru ve bölümler çok dilli bir gömme modeliyle (bge-m3, Cloudflare Workers AI) vektöre çevrilir;
// benzerlik tarayıcıda hesaplanır. Kelimesi kelimesine eşleşmeyen ama aynı şeyi soran sorular da doğru bölümü bulur
// ("evde kalamıyor" → "cannot be lived in"). Kurumun belgelerinin vektörleri önceden hesaplanıp demoyla gelir
// (public/vectors/seed.json, npm run vectors); kullanıcının eklediği belgeninki eklenince hesaplanır ve bu tarayıcıda saklanır.
// Vektör ucuna ulaşılamazsa arama yalnızca kelimeyle (BM25) yapılır.
import type { Doc } from '../data/types';
import type { Passage } from './search';
import { passagesOf } from './search';

export interface Vec { s: number; q: Int8Array }

function decode(b64: string): Int8Array {
  const bin = atob(b64);
  const out = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = (bin.charCodeAt(i) << 24) >> 24;
  return out;
}

/** İki birim vektörün benzerliği (kosinüs) */
export function sim(a: Vec, b: Vec) {
  const n = Math.min(a.q.length, b.q.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a.q[i] * b.q[i];
  return s * a.s * b.s;
}

/** Gömme modeline verilen metin: belgenin adı ve bölüm başlığı da anlamı taşır */
export function embedText(p: Passage) {
  const c = p.section.clauses.find((x) => x.n === p.loc.clause);
  return [p.doc.title, p.section.title, c?.heading].filter(Boolean).join(' · ') + '\n' + p.text;
}

export async function embed(texts: string[]): Promise<Vec[] | null> {
  try {
    const r = await fetch('/api/handbook/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts }) });
    const j = await r.json().catch(() => null);
    if (!j?.ok || !Array.isArray(j.q) || j.q.length !== texts.length) return null;
    return j.q.map((q: string, i: number) => ({ s: j.s[i], q: decode(q) }));
  } catch {
    return null;
  }
}

/* ---------- Kurumun belgeleri: demoyla gelen vektörler ---------- */
let seed: Promise<Map<string, Vec>> | null = null;
export function seedVectors() {
  seed ??= fetch('./vectors/seed.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { items?: Record<string, [number, string]> } | null) => {
      const m = new Map<string, Vec>();
      for (const [k, [s, q]] of Object.entries(j?.items ?? {})) m.set(k, { s, q: decode(q) });
      return m;
    })
    .catch(() => new Map<string, Vec>());
  return seed;
}

/* ---------- Eklenen belgeler: bu tarayıcıda saklanan vektörler ---------- */
const KEY = (id: string) => `tolka:vec:${id}`;
const mem = new Map<string, Map<string, Vec>>();

export function uploadVectors(id: string): Map<string, Vec> | null {
  const hit = mem.get(id);
  if (hit) return hit;
  try {
    const raw = localStorage.getItem(KEY(id));
    if (!raw) return null;
    const j = JSON.parse(raw) as Record<string, [number, string]>;
    const m = new Map<string, Vec>(Object.entries(j).map(([k, [s, q]]) => [k, { s, q: decode(q) }]));
    mem.set(id, m);
    return m;
  } catch {
    return null;
  }
}

export function dropUploadVectors(id: string) {
  mem.delete(id);
  try { localStorage.removeItem(KEY(id)); } catch { /* depolama kapalı */ }
}

/** Eklenen belgenin bölümlerini vektöre çevirir (32'şerli gruplar); başarısız olursa belge yalnızca kelimeyle aranır */
export async function indexUpload(doc: Doc) {
  if (uploadVectors(doc.id)) return;
  const ps = passagesOf(doc);
  const out: Record<string, [number, string]> = {};
  const m = new Map<string, Vec>();
  for (let i = 0; i < ps.length; i += 32) {
    const part = ps.slice(i, i + 32);
    const r = await fetch('/api/handbook/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: part.map(embedText) }) })
      .then((x) => x.json())
      .catch(() => null);
    if (!r?.ok) return;
    part.forEach((p, k) => {
      out[p.key] = [r.s[k], r.q[k]];
      m.set(p.key, { s: r.s[k], q: decode(r.q[k]) });
    });
  }
  mem.set(doc.id, m);
  try { localStorage.setItem(KEY(doc.id), JSON.stringify(out)); } catch { /* yer yoksa yalnızca bu oturumda */ }
}
