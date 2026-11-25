// Yüklenen dosyanın metnini tarayıcıda okur ve bölüm/madde yapısına çevirir. Dosya hiçbir sunucuya gitmez.
// PDF: pdf.js ile sayfa sayfa; büyük yazılı satırlar bölüm başlığı, aradaki boşluklar paragraf sınırı sayılır.
// TXT ve Markdown: "#" başlıkları bölüm, boş satırlar paragraf sınırıdır.
import type { Block, Clause, Doc, Section } from '../data/types';

export interface Extracted {
  pages: number;
  sections: Section[];
  failReason?: Doc['failReason'];
}

type Progress = (page: number, pages: number) => void;

export const MAX_BYTES = 20 * 1024 * 1024;
export const ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
export const kindOf = (name: string) =>
  /\.pdf$/i.test(name) ? 'pdf' : /\.docx$/i.test(name) ? 'docx' : /\.(txt|md|markdown)$/i.test(name) ? 'text' : null;

export async function extract(file: File, progress: Progress): Promise<Extracted> {
  const k = kindOf(file.name);
  return k === 'pdf' ? extractPdf(file, progress) : k === 'docx' ? extractDocx(file, progress) : extractText(file, progress);
}

/* ---------- Word (.docx) ---------- */
// .docx bir ZIP arşividir; metin word/document.xml içindedir. Arşiv tarayıcının kendi açıcısıyla (DecompressionStream)
// açılır, ek kütüphane yok. Başlık biçemleri (Heading 1, Başlık 1…) bölüm, madde işaretli paragraflar liste, tablolar tablo olur.
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

async function extractDocx(file: File, progress: Progress): Promise<Extracted> {
  progress(1, 1);
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Parolalı Word dosyası ZIP değil, şifreli bir kapsayıcıdır (D0 CF 11 E0)
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return { pages: 0, sections: [], failReason: 'password' };
  let xml: string;
  try {
    xml = await unzip(bytes, 'word/document.xml');
  } catch {
    return { pages: 0, sections: [], failReason: 'unreadable' };
  }
  const dom = new DOMParser().parseFromString(xml, 'application/xml');
  const body = dom.getElementsByTagNameNS(W, 'body')[0];
  if (!body || dom.getElementsByTagName('parsererror').length) return { pages: 0, sections: [], failReason: 'unreadable' };

  const sections: Section[] = [];
  let sec: Section | null = null;
  let list: { n?: string; text: string }[] | null = null;
  let words = 0;
  const page = () => Math.floor(words / 450) + 1;
  const ensure = () => (sec ??= startSection(sections, '', page()));
  const flushList = () => {
    if (list?.length) addBlock(ensure(), { t: 'list', items: list });
    list = null;
  };

  for (const el of Array.from(body.children)) {
    if (el.localName === 'p') {
      const text = textOf(el);
      if (!text) continue;
      words += text.split(' ').length;
      const pPr = el.getElementsByTagNameNS(W, 'pPr')[0];
      const style = pPr?.getElementsByTagNameNS(W, 'pStyle')[0]?.getAttributeNS(W, 'val') ?? '';
      const heading = /^(heading|balk|başlık|baslik)\s*\d$/i.test(style) || /^(title|konubal)/i.test(style) || !!pPr?.getElementsByTagNameNS(W, 'outlineLvl')[0];
      const listed = !!pPr?.getElementsByTagNameNS(W, 'numPr')[0] || /list/i.test(style);
      if (heading) {
        flushList();
        sec = startSection(sections, text, page());
      } else if (listed) {
        (list ??= []).push({ text });
      } else {
        flushList();
        addParagraph(ensure(), text);
      }
    } else if (el.localName === 'tbl') {
      flushList();
      const rows = Array.from(el.getElementsByTagNameNS(W, 'tr')).map((tr) => Array.from(tr.getElementsByTagNameNS(W, 'tc')).map(textOf));
      if (rows.length >= 2) addBlock(ensure(), { t: 'table', head: rows[0], rows: rows.slice(1) });
      else if (rows.length === 1) addParagraph(ensure(), rows[0].filter(Boolean).join(' · '));
      words += rows.flat().join(' ').split(' ').length;
    }
  }
  flushList();
  const pages = Math.max(1, Math.round(words / 450));
  const kept = sections.filter((s) => s.clauses.length);
  return kept.length ? { pages, sections: kept } : { pages, sections: [], failReason: 'empty' };
}

/** Paragrafın ya da hücrenin düz metni: sekme ve satır sonu boşluk olur */
function textOf(el: Element): string {
  let out = '';
  const walk = (n: Element) => {
    for (const c of Array.from(n.children)) {
      if (c.namespaceURI === W && c.localName === 't') out += c.textContent ?? '';
      else if (c.namespaceURI === W && (c.localName === 'tab' || c.localName === 'br')) out += ' ';
      else walk(c);
    }
  };
  walk(el);
  return out.replace(/\s+/g, ' ').trim();
}

/** ZIP arşivinden tek bir dosyayı çıkarır (merkezi dizin okunur; sıkıştırma "deflate" ise tarayıcı açar) */
async function unzip(bytes: Uint8Array, name: string): Promise<string> {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip değil');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('bozuk dizin');
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extra = v.getUint16(p + 30, true);
    const comment = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const entry = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (entry === name) {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + size);
      if (method === 0) return dec.decode(data);
      if (method !== 8) throw new Error('desteklenmeyen sıkıştırma');
      const stream = new Blob([data.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).text();
    }
    p += 46 + nameLen + extra + comment;
  }
  throw new Error('dosya yok');
}

/* ---------- PDF ---------- */
interface Line { text: string; y: number; h: number; page: number }

async function extractPdf(file: File, progress: Progress): Promise<Extracted> {
  // pdf.js yalnızca bir belge eklenirken yüklenir; ana paketi büyütmez
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name;
    return { pages: 0, sections: [], failReason: name === 'PasswordException' ? 'password' : 'unreadable' };
  }

  const lines: Line[] = [];
  let chars = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    progress(p, pdf.numPages);
    const content = await (await pdf.getPage(p)).getTextContent();
    let cur: Line | null = null;
    for (const it of content.items) {
      if (!('str' in it)) continue;
      if (!cur) cur = { text: '', y: it.transform[5], h: Math.abs(it.transform[3]) || it.height, page: p };
      cur.text += it.str;
      if (it.hasEOL) {
        if (cur.text.trim()) lines.push({ ...cur, text: cur.text.replace(/\s+/g, ' ').trim() });
        cur = null;
      }
    }
    if (cur?.text.trim()) lines.push({ ...cur, text: cur.text.replace(/\s+/g, ' ').trim() });
    chars += content.items.reduce((n, it) => n + ('str' in it ? it.str.replace(/\s/g, '').length : 0), 0);
    // Uzun belgede arayüz donmasın; ilerleme ekranda görünsün
    await new Promise((r) => setTimeout(r, 120));
  }

  // Sayfa başına 40 karakterden az metin: büyük olasılıkla taranmış görüntü
  if (chars < 40 * pdf.numPages) return { pages: pdf.numPages, sections: [], failReason: 'scan' };

  const body = median(lines.map((l) => l.h));
  const sections: Section[] = [];
  let sec: Section | null = null;
  let para: string[] = [];
  let prev: Line | null = null;

  const flush = () => {
    if (!para.length) return;
    if (!sec) sec = startSection(sections, '', prev?.page ?? 1);
    addParagraph(sec, para.join(' '));
    para = [];
  };

  for (const l of lines) {
    const heading = l.h > body * 1.15 && l.text.length < 90;
    // Antet satırı (sayfa başındaki küçük yazı) belgenin metni sayılmaz
    const running = l.h < body * 0.92 && lines.filter((x) => x.text === l.text).length > 0 && /policy wording|page \d+/i.test(l.text);
    if (running) continue;
    if (heading) {
      flush();
      sec = startSection(sections, l.text, l.page);
    } else {
      const gap = prev && prev.page === l.page ? prev.y - l.y : Infinity;
      if (prev && (gap > prev.h * 1.75 || prev.page !== l.page) && para.length) flush();
      para.push(l.text);
    }
    prev = l;
  }
  flush();
  return { pages: pdf.numPages, sections: sections.filter((s) => s.clauses.length) };
}

/* ---------- TXT / Markdown ---------- */
async function extractText(file: File, progress: Progress): Promise<Extracted> {
  progress(1, 1);
  const text = (await file.text()).replace(/\r\n?/g, '\n');
  if (!text.trim()) return { pages: 0, sections: [], failReason: 'empty' };
  const pages = Math.max(1, Math.ceil(text.length / 3000));
  const sections: Section[] = [];
  let sec: Section | null = null;
  for (const chunk of text.split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const h = /^#{1,3}\s+(.*)$/.exec(lines[0]);
    if (h) {
      sec = startSection(sections, h[1], Math.min(pages, Math.floor((text.indexOf(lines[0]) / text.length) * pages) + 1));
      lines.shift();
      if (!lines.length) continue;
    }
    if (!sec) sec = startSection(sections, '', 1);
    if (lines.every((l) => /^([-*]|\d+[.)]|\([a-z]\))\s+/.test(l))) {
      addBlock(sec, { t: 'list', items: lines.map((l) => {
        const m = /^(\(?[a-z0-9]+[.)])\s+(.*)$/.exec(l);
        return m && !/^[-*]$/.test(m[1]) ? { n: m[1], text: m[2] } : { text: l.replace(/^[-*]\s+/, '') };
      }) });
    } else addParagraph(sec, lines.join(' '));
  }
  return { pages, sections: sections.filter((s) => s.clauses.length) };
}

/* ---------- ortak ---------- */
function startSection(list: Section[], title: string, page: number): Section {
  // "3 What we will pay" → bölüm 3. Numarasız başlıklar (belge adı, önsöz) numaralı bölümlerle
  // çakışmasın diye küçük Roma rakamı alır: i, ii, iii
  const m = /^(\d+(?:\.\d+)*)\s+(.*)$/.exec(title);
  const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const unnumbered = list.filter((x) => !/^\d/.test(x.n)).length;
  const s: Section = { n: m ? m[1] : roman[unnumbered] ?? `x${unnumbered + 1}`, title: m ? m[2] : title || `Page ${page}`, page, clauses: [] };
  list.push(s);
  return s;
}

function addParagraph(sec: Section, text: string) {
  addBlock(sec, { t: 'p', text });
}

function addBlock(sec: Section, b: Block) {
  const c: Clause = { n: `${sec.n}.${sec.clauses.length + 1}`, blocks: [b] };
  sec.clauses.push(c);
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
