// Yanıt ucunun yetki denetimi için belge listesini üretir: server/handbook-corpus.json
// İçinde metin yok; her belgenin kimlere açık olduğu ve her bölüm metninin özeti (SHA-256) var.
// Sunucu, modele gönderilen her bölümün gerçekten o belgede olduğunu ve soran rolün o belgeyi açabildiğini bununla denetler.
// Belgeler (src/data/docs/) değişince çalıştırın:  npm run corpus
import { build } from 'vite';
import { createHash } from 'node:crypto';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const tmp = join(root, '.corpus');
const target = process.argv[2] ?? fileURLToPath(new URL('../server/handbook-corpus.json', import.meta.url));

await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'scripts/corpus-entry.ts', outDir: tmp, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'corpus.mjs' } } }
});
const { corpus } = await import(pathToFileURL(join(tmp, 'corpus.mjs')).href);

// worker/handbook.js'teki clean() ve sha() ile aynı
const clean = (v, max) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 32);

const out = { v: 1, docs: {} };
let n = 0;
for (const d of corpus()) {
  out.docs[d.id] = { audience: d.audience, keys: Object.fromEntries(d.passages.map((p) => [p.key, sha(clean(p.text, 1800))])) };
  n += d.passages.length;
}
writeFileSync(target, JSON.stringify(out) + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(`${Object.keys(out.docs).length} belge, ${n} bölüm →`, target);
