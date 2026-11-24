// Telefon tanıtım videosu (dikey, 1080×1920): müşteri temsilcisi bir görüşme sırasında soru soruyor.
// Kullanım (geliştirme sunucusu ve yerel Worker açıkken):
//   npm run video-phone -- en   →  output/telefon-en.mp4 + .jpg
//   npm run video-phone -- tr   →  output/telefon-tr.mp4 + .jpg
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { encode, overlay, record } from './rec.mjs';

const LANG = process.argv[2] === 'tr' ? 'tr' : 'en';
const BASE = process.env.BASE ?? 'http://localhost:5192';
const W = 360;
const H = 640;
const OUT = fileURLToPath(new URL('../output/', import.meta.url));
const TMP = fileURLToPath(new URL(`../output/checks/video-phone-${LANG}/`, import.meta.url));

const L = {
  en: [
    'On the phone with a customer, a customer care agent asks the Handbook.',
    'The answer uses only documents her role can open, with a number for each source.',
    'The source opens full screen, with the passage marked.',
    'Her list has 8 documents. The claims manual and authority limits aren’t among them.',
    'Concept project by flouHAN Software · flouhan.com'
  ],
  tr: [
    'Müşteriyle telefondayken müşteri temsilcisi Handbook’a soruyor.',
    'Yanıt yalnızca rolünün açabildiği belgelerden gelir; her kaynağın bir numarası var.',
    'Kaynak tam ekran açılır; ilgili bölüm işaretlidir.',
    'Listesinde 8 belge var. Hasar talimatı ve yetki limitleri bunların arasında değil.',
    'flouHAN Software konsept çalışması · flouhan.com'
  ]
}[LANG];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light' });
await ctx.addInitScript(overlay, true);
await ctx.addInitScript(() => { try { localStorage.setItem('tolka-prefs', JSON.stringify({ guideSeen: true })); } catch (e) {} });
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const cap = (step, text, pos) => page.evaluate(([s, t, p]) => window.__cap?.(s, t, p), [step, text, pos]);
async function tap(sel) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded();
  await pause(250);
  const bb = await loc.boundingBox();
  if (bb) await page.evaluate(([x, y]) => window.__tap?.(x, y), [bb.x + bb.width / 2, bb.y + bb.height / 2]);
  await pause(120);
  await loc.tap({ timeout: 8000 });
}

await page.goto(`${BASE}/?lang=${LANG}&theme=light#/ask`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await pause(400);
const rec = await record(ctx, page, TMP, { maxWidth: W * 3, maxHeight: H * 3 });

await cap(1, L[0], 'low');
await pause(1800);
await tap('.si-row:has-text("Niamh") .btn');
await pause(900);
await tap('.start-group >> nth=0 >> .suggest');
await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 40000 });
await pause(600);
await cap(2, L[1], 'low');
await pause(3800);
await tap('.qa:last-child .ai-text .cite >> nth=0');
await pause(400);
await cap(3, L[2], 'low');
await pause(3400);
await tap('.src .back');
await pause(500);
await tap('.tabs a[href="#/documents"]');
await pause(500);
await cap(4, L[3], 'low');
await pause(3600);
await cap(null, L[4], 'low');
await pause(2400);
const res = await rec.stop();
await b.close();
const sec = encode(res, TMP, { mp4: join(OUT, `telefon-${LANG}.mp4`), jpg: join(OUT, `telefon-${LANG}.jpg`), w: 1080, h: 1920, posterAt: 7 });
console.log(`telefon-${LANG}.mp4 · ${sec} sn`);
