// Anlam araması için kurumun belgelerindeki her bölümün vektörünü hesaplar: public/vectors/seed.json
// Vektörler yanıt ucunun /api/handbook/embed adresinden alınır (bge-m3); 8 bitlik tamsayı ve ölçek olarak saklanır.
// Belgeler (src/data/docs/) değişince çalıştırın (yerel Worker açıkken):  npm run vectors
import { build } from 'vite';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const tmp = join(root, '.vectors');
const API = process.env.API ?? 'http://localhost:8787/api/handbook/embed';

await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'scripts/vectors-entry.ts', outDir: tmp, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'vectors.mjs' } } }
});
const { items } = await import(pathToFileURL(join(tmp, 'vectors.mjs')).href);
const all = items();

const out = { model: 'bge-m3', dims: 0, items: {} };
for (let i = 0; i < all.length; i += 32) {
  const part = all.slice(i, i + 32);
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5192' },
    body: JSON.stringify({ texts: part.map((x) => x.text) })
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`vektör ucu: ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  out.dims = j.dims;
  part.forEach((x, k) => { out.items[x.key] = [j.s[k], j.q[k]]; });
  process.stdout.write(`\r${Math.min(i + 32, all.length)}/${all.length}`);
}
const dir = join(root, 'public/vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'seed.json'), JSON.stringify(out));
rmSync(tmp, { recursive: true, force: true });
console.log(`\n${Object.keys(out.items).length} bölüm, ${out.dims} boyut → public/vectors/seed.json`);
