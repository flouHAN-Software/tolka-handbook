// Tanıtım videosu (masaüstü, 1440×900): demonun gerçek ekran kaydı, görünür imleç ve adım altyazılarıyla.
// Akış: rehber → yanıt ve kaynak → hasar tarihi → iki rolde aynı soru → sürüm karşılaştırması → Yanıt kalitesi.
// Kullanım (geliştirme sunucusu ve yerel Worker açıkken):
//   npm run video -- en   →  output/tanitim-en.mp4 + .jpg
//   npm run video -- tr   →  output/tanitim-tr.mp4 + .jpg
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { encode, overlay, record } from './rec.mjs';

const LANG = process.argv[2] === 'tr' ? 'tr' : 'en';
const BASE = process.env.BASE ?? 'http://localhost:5192';
const W = 1440;
const H = 900;
const OUT = fileURLToPath(new URL('../output/', import.meta.url));
const TMP = fileURLToPath(new URL(`../output/checks/video-${LANG}/`, import.meta.url));

// Altyazılar ve yazılan sorular (iki dil ayrı yazıldı)
const L = {
  en: {
    fraud: 'What are the fraud indicators in escape of water claims?',
    excess: 'What is the escape of water excess?',
    sample: 'Word',
    own: 'How much is the broadband contribution?',
    c: [
      'An internal document assistant for a home insurer. The first visit explains each screen and what to try.',
      'The answer streams in as it is written, only from the passages found, and it notices that two documents disagree.',
      'Each number opens the source document, with the passage marked.',
      'With a date of loss before March 2026, the 2024.2 wording applies, and the answer says why.',
      'Each role sees different documents. An investigator gets an answer from the fraud indicators.',
      'A claims handler asking the same question gets nothing from that document, not even its name.',
      'Your own PDF or Word file works too: the answer comes only from that document, and the file stays in your browser.',
      'Every document has an owner, a review date and versions. Two versions compare word for word.',
      'Questions the documents couldn’t answer reach the Knowledge team, grouped by what is missing.',
      'Concept project by flouHAN Software · flouhan.com'
    ]
  },
  tr: {
    fraud: 'Su kaçağı dosyalarında suistimal göstergeleri neler?',
    excess: 'Su kaçağı muafiyeti ne kadar?',
    sample: 'Türkçe personel',
    own: 'Yıllık izin kaç gün? Kullanmadığım izinler ne olur?',
    c: [
      'Bir konut sigortacısının iç doküman asistanı. İlk girişte her ekranın ne işe yaradığı ve önce ne deneneceği anlatılır.',
      'Yanıt yazıldıkça akar; yalnızca bulunan bölümlerden yazılır ve iki belgenin çeliştiğini de fark eder.',
      'Her numara kaynak belgeyi açar; ilgili bölüm işaretlidir.',
      'Hasar Mart 2026’dan önceyse 2024.2 şartları geçerlidir; yanıt bunun nedenini de söyler.',
      'Her rol farklı belgeleri görür. Araştırmacı yanıtını suistimal göstergelerinden alır.',
      'Aynı soruyu soran hasar uzmanı o belgeden hiçbir şey almaz; belgenin adı bile geçmez.',
      'Kendi PDF ya da Word dosyanız da olur: yanıt yalnızca o belgeden gelir, dosya tarayıcınızda kalır.',
      'Her belgenin bir sorumlusu, gözden geçirme tarihi ve sürümleri var. İki sürüm kelime kelime karşılaştırılır.',
      'Belgelerin yanıtlayamadığı sorular, eksiğin türüne göre gruplanıp bilgi yönetimine düşer.',
      'flouHAN Software konsept çalışması · flouhan.com'
    ]
  }
}[LANG];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light' });
await ctx.addInitScript(overlay, false);
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const cap = (step, text) => page.evaluate(([s, t]) => window.__cap?.(s, t), [step, text]);
let mx = W / 2, my = H / 2;
async function moveTo(loc, { steps = 14 } = {}) {
  await loc.scrollIntoViewIfNeeded();
  await pause(200);
  const bb = await loc.boundingBox();
  if (!bb) throw new Error('öğe görünmüyor');
  mx = bb.x + bb.width / 2;
  my = bb.y + bb.height / 2;
  await page.mouse.move(mx, my, { steps });
}
async function click(sel) {
  const loc = typeof sel === 'string' ? page.locator(sel).first() : sel;
  await moveTo(loc);
  await pause(100);
  await loc.click({ timeout: 8000 });
}
const answered = async () => {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 40000 });
  await pause(500);
};
async function type(text) {
  await click('#ask-q');
  await page.keyboard.type(text, { delay: 16 });
  await pause(250);
  await page.keyboard.press('Enter');
}
async function switchTo(name) {
  await click('.side-foot .switch');
  await pause(500);
  await click(page.locator('.si-row', { hasText: name }).locator('.btn'));
  await pause(400);
}

// İlk yanıt önbellekten değil, yazdırılarak gelsin: akış görünür (yalnızca yerelde geçerli bayrak)
let fresh = 1;
await page.route('**/api/handbook/answer', (r) => {
  if (fresh-- <= 0) return r.continue();
  const body = JSON.parse(r.request().postData() || '{}');
  return r.continue({ postData: JSON.stringify({ ...body, fresh: true }) });
});
await page.goto(`${BASE}/?lang=${LANG}&theme=light#/ask`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await pause(400);
const rec = await record(ctx, page, TMP, { maxWidth: W, maxHeight: H });
await page.mouse.move(mx, my);

// 1. Rehber
await cap(1, L.c[0]);
await pause(1800);
await page.locator('#g-try').scrollIntoViewIfNeeded();
await pause(900);
await click('.g-tries li >> nth=0 >> .btn');

// 2. Yanıt: yazıldıkça akar
await cap(2, L.c[1]);
await answered();
await pause(1800);
// 3. Kaynak
await click('.qa:last-child .ai-text .cite >> nth=1');
await cap(3, L.c[2]);
await pause(2000);
await click('.qa:last-child .ai-text .cite >> nth=0');
await pause(800);

// 4. Hasar tarihi
await click('.composer-row > .linkish');
await page.fill('#ask-loss', '2026-02-20');
await pause(300);
await type(L.excess);
await answered();
await cap(4, L.c[3]);
await pause(2800);

// 5–6. İki rol, aynı soru
await switchTo('Aoife');
await type(L.fraud);
await answered();
await cap(5, L.c[4]);
await pause(2600);
await switchTo('Ciarán');
await type(L.fraud);
await answered();
await cap(6, L.c[5]);
await pause(2600);

// 7. Kendi PDF'iniz: yalnızca o belgeye sorulur
await click('.convo-head .btn');
await pause(300);
await click('.start-own .btn');
await pause(400);
await click(page.locator('dialog.add .samples .linkish', { hasText: L.sample }));
await pause(500);
await click('dialog.add button[type=submit]');
await page.waitForFunction(() => document.querySelector('.scope') && !/reading|okunuyor/.test(document.querySelector('.scope').textContent), null, { timeout: 30000 });
await pause(300);
await type(L.own);
await answered();
await cap(7, L.c[6]);
await pause(3000);
await click('.scope .linkish');
await pause(300);

// 8. Belgeler ve sürüm karşılaştırması
await click('.side-list a[href="#/documents"]');
await pause(600);
await click('.lib-table a[href="#/documents/home-policy-2026"]');
await pause(700);
await click('.detail-open');
await pause(700);
await click('.vw-tools .btn');
await cap(8, L.c[7]);
await pause(3000);

// 9. Yanıt kalitesi (bilgi yönetimi)
await switchTo('Declan');
await click('.side-list a[href="#/quality"]');
await pause(600);
await click('.iq-row >> nth=0');
await cap(9, L.c[8]);
await pause(3000);

// Son
await cap(null, L.c[9]);
await pause(2000);
const res = await rec.stop();
await b.close();
const sec = encode(res, TMP, { mp4: join(OUT, `tanitim-${LANG}.mp4`), jpg: join(OUT, `tanitim-${LANG}.jpg`), w: W, h: H, posterAt: 9 });
console.log(`tanitim-${LANG}.mp4 · ${sec} sn`);
