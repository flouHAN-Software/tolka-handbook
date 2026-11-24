// Tarayıcıda çalışan belge araması (BM25). Arama modunun kendisi ve üretken modun kaynak bulucusu.
// Her madde, liste maddesi ve tablo satırı ayrı bir "bölüm" (passage) olarak dizinlenir;
// alıntı ve belgede vurgulama bu bölümün yerine (loc) göre yapılır.
import type { Block, Doc, Section } from '../data/types';
import { EN_SYN, TR_EN } from './glossary';

export interface Loc { clause: string; block: number; item?: number; row?: number }

export interface Passage {
  key: string;
  doc: Doc;
  section: Section;
  loc: Loc;
  /** Ekranda gösterilen başvuru: 7.3(b), 4.6, 1.1 */
  ref: string;
  /** Satırın başlığı (tablo satırında sütun adlarıyla) */
  text: string;
  /** Belge metni olarak gösterilecek hâli (** işaretleriyle) */
  quote: string;
  tokens: string[];
}

export interface Hit {
  p: Passage;
  score: number;
  coverage: number;
  /** Sorunun ne kadarını karşıladığı, kelimelerin ayırt ediciliğiyle ağırlıklı (0–1) */
  weighted: number;
  matched: string[];
  /** Eşleşen en ayırt edici kelimenin ağırlığı */
  spec: number;
}

export interface Result {
  hits: Hit[];
  /** Belgelerin hiçbirinde geçmeyen soru kelimelerinin oranı (yanıt yok kararına girer) */
  absent: number;
  turkish: boolean;
}

const TURKISH = /[çğıöşü]|\b(mi|mı|mu|mü|muyuz|miyiz|ne|nasıl|kadar|için)\b/i;

const STOP = new Set(('a an the and or of to in on for at by with from as is are was were be been being it its this that these those ' +
  'we you your our us i me my they them their he she his her do does did can could should would will shall may might must ' +
  'if then than so not no yes what which who whom when where why how any all each other some such only own same too very ' +
  'just about into over under again further once here there more most also up out off has have had having am got get ' +
  'one two three four five six seven eight nine ten need needs want wants happened happen whether ' +
  // Türkçe bağlaç ve soru ekleri
  'bir bu şu ve ile için gibi daha çok en de da ki ne mi mı mu mü muyuz miyiz mıyız müyüz var yok nasıl neden niye hangi ' +
  'kim ben biz siz o onlar ise iki üç dört beş altı yedi sekiz dokuz on kadar olarak olan oldu olur ' +
  'after before during while zorunda gerek gerekiyor lazım yapmalı yapmak yapar etmiş etti olmuş verdi altında altındaki ' +
  'üstünde sonra önce sırasında acaba').split(' '));

/** Basit İngilizce kök bulma: covers → cover, escaping → escap */
export function stem(w: string) {
  if (w.length > 5 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  for (const s of ['ing', 'edly', 'ed', 'ly', 'es', 's']) {
    if (w.length > s.length + 3 && w.endsWith(s)) return w.slice(0, -s.length);
  }
  return w;
}

/** Türkçe kök: ilk beş harf. Ekler sözcüğün sonuna geldiği için ("poliçenin", "poliçede" → "poliç") Türkçe aramada
 *  basit ve dayanıklı bir yöntemdir. Yalnızca Türkçe belgelerde ve Türkçe sorularda kullanılır. */
export function trStem(w: string) {
  if (/^\d/.test(w)) return w;
  if (w.length > 5) return w.slice(0, 5);
  // kısa sözcükte iyelik/belirtme eki: "günü" → "gün", "yılı" → "yıl"
  if (w.length === 4 && /[aeıioöuü]$/.test(w)) return w.slice(0, 3);
  return w;
}

const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/g;
const isTurkishDoc = new WeakMap<Doc, boolean>();
/** Belgenin dili: Türkçeye özgü harfler metnin harflerinin %1'inden fazlaysa Türkçe sayılır */
export function turkishDoc(doc: Doc) {
  let v = isTurkishDoc.get(doc);
  if (v !== undefined) return v;
  let text = '';
  for (const s of doc.sections) {
    text += s.title + ' ';
    for (const c of s.clauses) for (const b of c.blocks) {
      if (b.t === 'p' || b.t === 'note') text += b.text + ' ';
      else if (b.t === 'list') text += b.items.map((i) => i.text).join(' ') + ' ';
      else if (b.t === 'table') text += b.rows.flat().join(' ') + ' ';
      if (text.length > 6000) break;
    }
    if (text.length > 6000) break;
  }
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  v = letters > 0 && (text.match(TR_CHARS) ?? []).length / letters > 0.01;
  isTurkishDoc.set(doc, v);
  return v;
}

export function words(text: string) {
  return text
    // "İ" küçültülünce i + birleşik nokta olur ve sözcüğü böler ("İptal" → "i", "ptal")
    .replace(/İ/g, 'i')
    .toLocaleLowerCase('en')
    .replace(/\u0307/g, '')
    .replace(/\*\*/g, '')
    .replace(/[’']/g, '')
    .split(/[^a-z0-9€çğıöşüâîûé]+/i)
    .filter((w) => w && !STOP.has(w));
}

const plain = (s: string) => s.replace(/\*\*/g, '');

/** Bir belgenin bütün bölümleri */
export function passagesOf(doc: Doc): Passage[] {
  const out: Passage[] = [];
  // Türkçe belge (ör. kullanıcının eklediği PDF): sözcükler Türkçe köke indirgenir
  const root = turkishDoc(doc) ? trStem : stem;
  for (const section of doc.sections) {
    for (const c of section.clauses) {
      const head = [section.title, c.heading].filter(Boolean).join(' · ');
      let lead = '';
      c.blocks.forEach((b: Block, bi) => {
        const push = (loc: Loc, ref: string, quote: string, extra = '') => {
          const text = plain(quote);
          out.push({
            key: `${doc.id}#${loc.clause}:${loc.block}:${loc.item ?? ''}:${loc.row ?? ''}`,
            doc, section, loc, ref, text, quote,
            // başlık sözcükleri iki kez sayılır: "Escape of water" başlıklı bölüm su sorusunda öne çıksın
            tokens: [...words(head), ...words(head), ...words(extra), ...words(text)].map(root)
          });
        };
        if (b.t === 'p' || b.t === 'note') {
          push({ clause: c.n, block: bi }, c.n, b.text);
          lead = b.text.trim().endsWith(':') ? b.text : '';
        } else if (b.t === 'list') {
          b.items.forEach((it, ii) => push({ clause: c.n, block: bi, item: ii }, it.n ? `${c.n}${it.n}` : c.n, lead ? `${lead} ${it.text}` : it.text));
        } else if (b.t === 'table') {
          b.rows.forEach((r, ri) =>
            push({ clause: c.n, block: bi, row: ri }, c.n, b.head.map((h, i) => `${h}: ${r[i] || '–'}`).join('; '), b.head.join(' '))
          );
        }
      });
    }
  }
  return out;
}

/** Sorgu: her soru kelimesi bir "grup"; grubun herhangi bir karşılığı bölümde geçerse kelime karşılanmış sayılır.
 *  Türkçe soruda yalnızca sözlükte karşılığı olan kelimeler (ve belgede aynen geçenler) hesaba girer. */
export function queryGroups(q: string, turkish = false, inCorpus: (t: string) => boolean = () => true): { groups: string[][]; dropped: number } {
  const lower = q.replace(/İ/g, 'i').toLocaleLowerCase('tr');
  const groups: string[][] = [];
  let dropped = 0;
  // Türkçe çok kelimeli terimler önce
  for (const [k, v] of Object.entries(TR_EN)) if (k.includes(' ') && lower.includes(k)) groups.push(words(v).map(stem));
  for (const raw of lower.split(/[^a-z0-9€çğıöşüâîûé]+/i)) {
    // Tutarlar ve sayılar kelime gibi eşleştirilmez ("€12,000" sorusu "€25,000" satırını öne çıkarıyordu)
    if (!raw || STOP.has(raw) || raw.length < 2 || /^€?\d+$/.test(raw)) continue;
    const alts = new Set<string>([stem(raw)]);
    // Türkçe soru Türkçe belgede de aranabilsin: Türkçe kök de bir karşılık
    if (turkish) alts.add(trStem(raw));
    if (EN_SYN[raw]) words(EN_SYN[raw]).forEach((w) => alts.add(stem(w)));
    // Türkçe kök: en uzun eşleşen anahtar
    const key = Object.keys(TR_EN).filter((k) => !k.includes(' ') && k.length >= 2 && raw.startsWith(k)).sort((a, b) => b.length - a.length)[0];
    const tr = !!key && (key.length >= 3 || raw === key);
    if (tr) words(TR_EN[key]).forEach((w) => alts.add(stem(w)));
    // Türkçe soruda sözlükte olmayan kelime aranmaz ama "belgelerde yok" sayılır
    if (turkish && !tr && !inCorpus(stem(raw)) && !inCorpus(trStem(raw)) && !EN_SYN[raw]) {
      dropped++;
      continue;
    }
    groups.push([...alts]);
  }
  return { groups, dropped };
}

export class Index {
  readonly passages: Passage[];
  private df = new Map<string, number>();
  private avg: number;

  constructor(docs: Doc[]) {
    this.passages = docs.flatMap(passagesOf);
    for (const p of this.passages) for (const t of new Set(p.tokens)) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    this.avg = this.passages.reduce((n, p) => n + p.tokens.length, 0) / Math.max(1, this.passages.length);
  }

  search(q: string, limit = 3, boost: string[] = [], cutoff = 0.5): Result {
    const turkish = TURKISH.test(q);
    const { groups, dropped } = queryGroups(q, turkish, (t) => this.df.has(t));
    const present = groups.filter((g) => g.some((t) => this.df.has(t)));
    const total = groups.length + dropped;
    const absent = total ? 1 - present.length / total : 1;
    if (!present.length) return { hits: [], absent, turkish };
    const N = this.passages.length;
    const idfOf = (term: string) => {
      const df = this.df.get(term) ?? 0;
      return Math.log(1 + (N - df + 0.5) / (df + 0.5));
    };
    // Ağırlık: belgelerde geçen kelime kendi ayırt ediciliği kadar; hiç geçmeyen özel kelime ("hail", "solar") en ağır;
    // sözlükte olmayan Türkçe kelime de ağır sayılır (yardımcı fiiller yukarıda ayıklandı)
    const groupW = groups.map((g) => {
      const seen = g.filter((t) => this.df.has(t));
      return seen.length ? Math.max(...seen.map(idfOf)) : Math.log(1 + N);
    });
    const denom = groupW.reduce((a, b) => a + b, 0) + dropped * 4.5;
    const bonus = boost.map(stem);
    const hits: Hit[] = [];
    for (const p of this.passages) {
      const tf = new Map<string, number>();
      for (const t of p.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      let score = 0;
      let covered = 0;
      let spec = 0;
      let got = 0;
      const matched: string[] = [];
      for (const [gi, g] of groups.entries()) {
        let best = 0;
        for (const term of g) {
          const f = tf.get(term);
          if (!f) continue;
          const df = this.df.get(term) ?? 0;
          const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
          if (idf > spec) spec = idf;
          const s = idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (p.tokens.length / this.avg))));
          if (s > best) best = s;
          matched.push(term);
        }
        if (best > 0) {
          covered++;
          got += groupW[gi];
        }
        score += best;
      }
      if (score <= 0) continue;
      const coverage = covered / present.length;
      // Rolle ilgili satır (ör. yetki tablosunda "Claims handler") öne çıkar; kapsama hesabına girmez
      const lift = bonus.length && bonus.every((b) => tf.has(b)) ? 1.15 : 1;
      // Poliçe şartları önceliklidir (Hasar İşlem Talimatı 1.2): eşit eşleşmede önce o gösterilir
      const wording = p.doc.kind === 'wording' ? 1.15 : 1;
      hits.push({ p, score: score * (0.4 + coverage) * lift * wording, coverage, weighted: got / denom, matched: [...new Set(matched)], spec });
    }
    hits.sort((a, b) => b.score - a.score);
    if (!hits.length) return { hits: [], absent, turkish };
    // En iyi sonucun yarısından zayıf olanlar gösterilmez; aynı madde iki kez alınmaz
    const top = hits[0].score;
    const out: Hit[] = [];
    for (const h of hits) {
      if (h.score < top * cutoff || out.length >= limit) break;
      // Aynı maddeden bir bölüm yeter: üç kaynak üç ayrı yerden gelsin
      if (out.some((o) => o.p.doc.id === h.p.doc.id && o.p.loc.clause === h.p.loc.clause)) continue;
      out.push(h);
    }
    return { hits: out, absent, turkish };
  }
}
