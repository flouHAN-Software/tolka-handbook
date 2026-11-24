// Bir soruya verilecek yanıtı kurar. Arama modunda yanıtı bir dil modeli yazmaz:
// kullanıcının rolünün açabildiği, okunmuş belgelerden sorusuna en çok uyan bölümler gösterilir.
// Kurallar belirlenimci ve açıktır: hasar tarihine göre poliçe sürümü, yanıtın gizlilik düzeyi, aranmayan belgeler.
import { findDate } from '../lib/dates';
import { Index, passagesOf, type Loc, type Passage } from '../lib/search';
import { liveStatus } from './processing';
import { allDocs, canOpen, docById, review } from './library';
import type { Classification, Doc, RoleId } from './types';

export interface Cite { key: string; docId: string; ref: string; loc: Loc; matched: string[] }

export interface AiPart {
  model: string;
  verdict: 'answered' | 'partial' | 'none';
  /** Modelin yanıtı; [n] işaretleri cites dizisindeki sıraya göre (1'den) */
  text: string;
  quotes: { i: number; text: string }[];
  dropped: number;
  neurons: number;
  cached?: boolean;
  /** Modele gönderilen bölüm sayısı */
  sent: number;
}

export interface AnswerData {
  id: string;
  q: string;
  askedAt: string;
  lossDate?: string;
  mode: 'search' | 'ai';
  /** Model yanıtı yazarken */
  pending?: boolean;
  ai?: AiPart;
  /** Model kullanılamadıysa nedeni; yanıt arama moduna döndü */
  fallback?: string;
  kind: 'found' | 'none';
  cites: Cite[];
  /** Kullanılan poliçe şartları sürümü ve nedeni */
  wording?: { docId: string; reason: 'today' | 'date' };
  /** Okunmadığı için aranmayan belgeler */
  notSearched: { docId: string; why: 'processing' | 'failed' }[];
  handoff?: { at: string };
}

const RANK: Classification[] = ['public', 'internal', 'confidential', 'strict'];

/** Aranacak belgeler: rolün açabildiği, okunmuş; poliçe şartlarında hasar tarihinde yürürlükte olan sürüm */
export function searchable(role: RoleId, lossDate?: string) {
  const docs = allDocs().filter((d) => canOpen(d, role));
  const ready = docs.filter((d) => liveStatus(d).status === 'ready');
  const notSearched = docs
    .filter((d) => liveStatus(d).status !== 'ready' && !d.supersededBy)
    .map((d) => ({ docId: d.id, why: liveStatus(d).status === 'failed' ? ('failed' as const) : ('processing' as const) }));
  const chosen = ready.filter((d) => {
    if (!lossDate) return !d.supersededBy;
    const next = d.supersededBy ? docById(d.supersededBy) : undefined;
    // Hasar tarihinde yürürlükte olan sürüm; daha eski bir hasar için en eski sürüm kullanılır
    if (next && lossDate >= next.inForce) return false;
    if (d.inForce > lossDate && d.supersedes && ready.some((x) => x.id === d.supersedes)) return false;
    return true;
  });
  return { docs: chosen, notSearched };
}

// Yanıt yok kararı: en iyi bölüm zayıfsa ya da sorunun kelimelerinin önemli bir kısmı hiçbir belgede geçmiyorsa
const MIN_SCORE = 4;
const MIN_COVERAGE = 0.25;
// Yalnızca "damage", "cover" gibi her yerde geçen kelimelerle eşleşmek yanıt sayılmaz
const MIN_SPECIFIC = 1.8;
// Sorunun ayırt edici kelimelerinin en az bu kadarı en iyi bölümde karşılanmalı
const MIN_WEIGHTED = 0.3;
/** Modele "soran kişi" olarak söylenen rol ("kendim" sorusu buna göre yanıtlanır) */
export const ROLE_ASKER: Record<RoleId, string> = {
  care: 'Customer care agent',
  claims: 'Claims handler, Household claims',
  siu: 'Investigator, Special Investigations Unit',
  knowledge: 'Knowledge team, keeps the Handbook up to date'
};
export const ROLE_BOOST: Record<RoleId, string[]> = { care: ['customer', 'care', 'agent'], claims: ['claims', 'handler'], siu: ['investigations'], knowledge: [] };

/** Sorudaki tarih, aramada kelime sayılmasın diye çıkarılır */
export const withoutDate = (q: string) => q.replace(/\d{1,2}\s+[a-zçğıöşü]{3,9}\.?\s+\d{4}|\d{1,2}[/.]\d{1,2}[/.]\d{4}/gi, ' ');

export function answer(q: string, role: RoleId, lossDateField?: string): AnswerData {
  const lossDate = lossDateField || findDate(q) || undefined;
  const { docs, notSearched } = searchable(role, lossDate);
  const { hits } = new Index(docs).search(withoutDate(q), 3, ROLE_BOOST[role]);
  const best = hits[0];
  const found = !!best && best.score >= MIN_SCORE && best.coverage >= MIN_COVERAGE && best.spec >= MIN_SPECIFIC && best.weighted >= MIN_WEIGHTED;
  const cites = found ? hits.map((h) => gradeRow({ key: h.p.key, docId: h.p.doc.id, ref: h.p.ref, loc: h.p.loc, matched: h.matched }, role)) : [];
  const wordingDoc = cites.map((c) => docById(c.docId)).find((d) => d?.kind === 'wording');
  return {
    id: 'a-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    q,
    askedAt: new Date().toISOString(),
    lossDate,
    mode: 'search',
    kind: found ? 'found' : 'none',
    cites,
    wording: wordingDoc ? { docId: wordingDoc.id, reason: lossDate ? 'date' : 'today' } : undefined,
    notSearched
  };
}

// Yetki tablosunda kullanıcının kendi unvanının satırı gösterilir (aramanın seçtiği satır yerine)
export const ROLE_GRADE: Partial<Record<RoleId, string>> = { claims: 'Claims handler', care: 'Customer care agent' };

export function gradeRow(c: Cite, role: RoleId): Cite {
  const grade = ROLE_GRADE[role];
  if (c.loc.row === undefined || !grade) return c;
  const own = passagesOf(docById(c.docId)!).find(
    (p) => p.loc.clause === c.loc.clause && p.loc.block === c.loc.block && p.loc.row !== undefined && p.text.startsWith(`Grade: ${grade};`)
  );
  return own ? { ...c, key: own.key, loc: own.loc, ref: own.ref } : c;
}

/** Kaynak bölümünü belgeden yeniden bulur (kayıtlı yanıt yalnızca anahtarı saklar) */
export function passageOf(c: Cite): Passage | undefined {
  const d = docById(c.docId);
  return d ? passagesOf(d).find((p) => p.key === c.key) : undefined;
}

/** Yanıtın gizlilik düzeyi: kaynakların en kısıtlısı (Microsoft 365 Copilot'tan) */
export function answerLevel(a: AnswerData): { level: Classification; from: Doc } | undefined {
  let best: { level: Classification; from: Doc } | undefined;
  for (const c of a.cites) {
    const d = docById(c.docId);
    if (!d) continue;
    if (!best || RANK.indexOf(d.classification) > RANK.indexOf(best.level)) best = { level: d.classification, from: d };
  }
  return best;
}

/** Gözden geçirme tarihi geçmiş kaynaklar (Guru'dan) */
export const overdueSources = (a: AnswerData) =>
  [...new Set(a.cites.map((c) => c.docId))].map((id) => docById(id)).filter((d): d is Doc => !!d && review(d).state === 'overdue');
