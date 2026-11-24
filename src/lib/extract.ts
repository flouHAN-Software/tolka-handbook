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
export const ACCEPT = '.pdf,.txt,.md,application/pdf,text/plain,text/markdown';
export const kindOf = (name: string) => (/\.pdf$/i.test(name) ? 'pdf' : /\.(txt|md|markdown)$/i.test(name) ? 'text' : null);

export async function extract(file: File, progress: Progress): Promise<Extracted> {
  return kindOf(file.name) === 'pdf' ? extractPdf(file, progress) : extractText(file, progress);
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
