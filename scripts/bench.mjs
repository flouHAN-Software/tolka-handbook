// Ölçek denemesi: uygulamanın arama kodunu, kurumun belgelerinin çoğaltılmasıyla büyütülmüş bir arşivde ölçer.
//   Kelime araması (BM25): dizini kurma süresi ve soru başına sıralama süresi
//   Anlam araması: 1024 boyutlu 8 bitlik vektörlerle soru başına benzerlik süresi (gerçek vektörler çoğaltılır)
// Belgeler çoğaltıldığı için içerik tekrar eder; ölçülen şey hızdır, arama kalitesi değil.
// Kullanım: npm run bench   (isteğe bağlı: npm run bench -- 50000)
import { build } from 'vite';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = fileURLToPath(new URL('../', import.meta.url));
const tmp = join(root, '.bench');
const TARGET = Number(process.argv[2] ?? 50000);

await build({ root, logLevel: 'warn', build: { ssr: 'scripts/bench-entry.ts', outDir: tmp, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'bench.mjs' } } } });
const { DOCS, Index } = await import(pathToFileURL(join(tmp, 'bench.mjs')).href);

const base = new Index(DOCS).passages.length;
const copies = Math.ceil(TARGET / base);
const docs = [];
for (let i = 0; i < copies; i++) for (const d of DOCS) docs.push({ ...d, id: `${d.id}~${i}` });

let t = performance.now();
const index = new Index(docs);
const buildMs = performance.now() - t;
const n = index.passages.length;

const questions = [
  'What is the escape of water excess?',
  'Can I settle a €12,000 buildings claim myself?',
  'The customer will be away for two months over the winter. What do they need to do?',
  'How quickly must we acknowledge a complaint?',
  'Su kaçağı muafiyeti ne kadar?',
  'Müşteri yaşlı ve evde su yok, ne yapmalıyım?'
];
index.search(questions[0], 20);
t = performance.now();
const rounds = 5;
for (let r = 0; r < rounds; r++) for (const q of questions) index.search(q, 20);
const wordMs = (performance.now() - t) / (rounds * questions.length);

// Anlam: gerçek vektörler çoğaltılır; soru vektörü olarak bir bölümün vektörü kullanılır
const seed = JSON.parse(readFileSync(join(root, 'public/vectors/seed.json'), 'utf8'));
const vecs = Object.values(seed.items).map(([s, q]) => ({ s, q: new Int8Array(Buffer.from(q, 'base64')) }));
const all = [];
for (let i = 0; all.length < n; i++) all.push(vecs[i % vecs.length]);
const qv = vecs[0];
const dims = qv.q.length;
const sims = new Float32Array(all.length);
const pass = () => {
  for (let i = 0; i < all.length; i++) {
    const v = all[i];
    let s = 0;
    for (let k = 0; k < dims; k++) s += v.q[k] * qv.q[k];
    sims[i] = s * v.s * qv.s;
  }
};
pass();
t = performance.now();
for (let r = 0; r < 10; r++) pass();
const meaningMs = (performance.now() - t) / 10;

rmSync(tmp, { recursive: true, force: true });
const f = (x) => x.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
console.log(`Arşiv: ${f(n)} bölüm (${f(docs.length)} belge; kurumun ${DOCS.length} belgesi ${copies} kez çoğaltıldı)`);
console.log(`Kelime dizini kurulumu: ${f(buildMs)} ms`);
console.log(`Kelime araması, soru başına: ${wordMs.toFixed(1)} ms (${questions.length} soru × ${rounds} tur ortalaması)`);
console.log(`Anlam karşılaştırması, soru başına: ${meaningMs.toFixed(1)} ms (${f(n)} × ${dims} boyut)`);
console.log(`Node ${process.version}, ${process.platform}`);
