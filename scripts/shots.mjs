// Portföy görselleri: demonun gerçek ekranları, boş tarayıcı profiliyle (2x; telefonda 3x).
// Kullanım (geliştirme sunucusu ve yerel Worker açıkken: `npm run dev` ve `npm run server`):
//   npm run shots   →  output/01-…png
// Model yanıtları gün içinde Worker'ın önbelleğinden gelir; yeni soru kota harcar (Free planda ücret yok).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://localhost:5192';
const OUT = fileURLToPath(new URL('../output/', import.meta.url));
await mkdir(OUT, { recursive: true });

const b = await chromium.launch();
const seen = () => { try { localStorage.setItem('tolka-prefs', JSON.stringify({ guideSeen: true })); } catch (e) {} };
async function page({ w = 1440, h = 900, scale = 2, as = 'claims', lang = 'en', theme = 'light', mobile = false, guide = false } = {}) {
  const ctx = await b.newContext(mobile
    ? { viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: w, height: h }, deviceScaleFactor: scale });
  if (!guide) await ctx.addInitScript(seen);
  const p = await ctx.newPage();
  p.lang = lang; p.theme = theme; p.as = as;
  return p;
}
const go = async (p, route) => {
  await p.goto(`${BASE}/?lang=${p.lang}&theme=${p.theme}${p.as ? `&as=${p.as}` : ''}#/${route}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
};
const ask = async (p, q, loss) => {
  if (loss) { await p.click('.composer-row .linkish'); await p.fill('#ask-loss', loss); }
  await p.fill('#ask-q', q);
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 30000 });
  await p.waitForTimeout(1200);
};
const shot = async (p, name, opts = {}) => { await p.screenshot({ path: join(OUT, name), ...opts }); console.log('görsel', name); };

// 1. Yanıt: iki belge çelişiyor, kaynak belgede işaretli
{
  const p = await page();
  await go(p, 'ask');
  await ask(p, 'What is the escape of water excess?');
  await p.click('.qa:last-child .ai-text .cite >> nth=1');
  await p.waitForTimeout(1200);
  await shot(p, '01-yanit-kaynak.png');
  await p.context().close();
}
// 2. Hasar tarihi: 2024.2 şartları (koyu tema, Türkçe)
{
  const p = await page({ lang: 'tr', theme: 'dark' });
  await go(p, 'ask');
  await ask(p, 'Su kaçağı muafiyeti ne kadar?', '2026-02-20');
  await shot(p, '02-hasar-tarihi-koyu.png');
  await p.context().close();
}
// 3. Roller: giriş ekranı ("Rolü değiştir" ile açılır)
{
  const p = await page();
  await go(p, 'ask');
  await p.evaluate(() => window.dispatchEvent(new Event('tolka:switch')));
  await p.waitForTimeout(400);
  await shot(p, '03-roller.png');
  await p.context().close();
}
// 4. Belgeler: gözden geçirmesi gecikmiş rehberin kartı
{
  const p = await page();
  await go(p, 'documents/eow-guide');
  await shot(p, '04-belgeler.png');
  await p.context().close();
}
// 5. Sürüm karşılaştırması
{
  const p = await page();
  await go(p, 'documents/home-policy-2026/view');
  await p.click('.vw-tools .btn');
  await p.waitForTimeout(500);
  await shot(p, '05-karsilastirma.png');
  await p.context().close();
}
// 6. Yanıt kalitesi
{
  const p = await page({ as: 'knowledge' });
  await go(p, 'quality/q-eow-excess');
  await shot(p, '06-yanit-kalitesi.png');
  await p.context().close();
}
// 7. Telefon: müşteri temsilcisi, kaynak tam ekran
{
  const p = await page({ w: 375, h: 812, mobile: true, as: 'care' });
  await go(p, 'ask');
  await ask(p, 'The customer’s kitchen is flooded and they can’t stay at home tonight. What can I arrange?');
  await shot(p, '07-telefon-yanit.png');
  await p.tap('.qa:last-child .ai-text .cite >> nth=0');
  await p.waitForTimeout(1200);
  await shot(p, '08-telefon-kaynak.png');
  await p.context().close();
}
// 10. Sitedeki proje kartı: koyu tema, yanıt ve işaretli kaynak (3:2; site-images 1200×800 WebP yapar)
{
  const p = await page({ w: 1440, h: 960, scale: 1, theme: 'dark' });
  await go(p, 'ask');
  await ask(p, 'What is the escape of water excess?');
  await p.click('.qa:last-child .ai-text .cite >> nth=1');
  await p.waitForTimeout(1200);
  await shot(p, '10-kart-koyu.png');
  await p.context().close();
}
// 11. Kendi belge: Türkçe personel el kitabı eklenip yalnızca ona Türkçe soru
{
  const p = await page({ lang: 'tr' });
  await go(p, 'ask');
  await p.click('.start-own .btn');
  await p.waitForTimeout(300);
  await p.click('dialog.add .samples .linkish >> nth=0');
  await p.waitForTimeout(700);
  await p.click('dialog.add button[type=submit]');
  await p.waitForFunction(() => document.querySelector('.scope') && !/okunuyor/.test(document.querySelector('.scope').textContent), null, { timeout: 30000 });
  await ask(p, 'Yıllık izin kaç gün? Kullanmadığım izinler ne olur?');
  await p.click('.qa:last-child .ai-text .cite >> nth=0');
  await p.waitForTimeout(1200);
  await shot(p, '11-kendi-belge.png');
  await p.context().close();
}
// 9. Rehber
{
  const p = await page({ guide: true, as: '' });
  await go(p, 'ask');
  await shot(p, '09-rehber.png');
  await p.context().close();
}
await b.close();
