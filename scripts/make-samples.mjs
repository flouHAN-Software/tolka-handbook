// Belge ekleme penceresindeki örnek dosyaları üretir (public/samples/):
//   Home Emergency Cover 2026.1.pdf   metin katmanlı PDF; yüklenince gerçekten okunur
//   Boiler Service Leaflet (scan).pdf yalnızca görüntüden oluşan PDF; yüklenince "seçilebilir metin yok" hatası verir
// Kullanım: node scripts/make-samples.mjs   (metin özgündür, kurgusal Tolka Insurance için yazıldı)

import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = fileURLToPath(new URL('public/samples/', root));
const font = async (p) => (await readFile(new URL(p, root))).toString('base64');
const serif = await font('node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-normal.woff2');
const sans = await font('node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2');

const css = `
@font-face { font-family: S; src: url(data:font/woff2;base64,${serif}) format('woff2'); font-weight: 200 900; }
@font-face { font-family: A; src: url(data:font/woff2;base64,${sans}) format('woff2'); font-weight: 200 800; }
@page { size: A4; margin: 22mm 22mm 24mm; }
body { font: 10.5pt/1.55 S, Georgia, serif; color: #15171A; margin: 0; }
.lh { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.6pt solid #999; padding-bottom: 6pt; margin-bottom: 18pt; font: 9pt A, sans-serif; color: #555; }
.lh b { font: 600 15pt S, serif; color: #0E4B54; }
h1 { font-size: 20pt; line-height: 1.2; margin: 0 0 4pt; font-weight: 620; }
.sub { font: 9.5pt A, sans-serif; color: #555; margin-bottom: 18pt; }
h2 { font-size: 13pt; margin: 16pt 0 6pt; font-weight: 620; }
p { margin: 0 0 7pt; }
ol { margin: 0 0 8pt; padding-left: 18pt; }
li { margin-bottom: 4pt; }
.pb { break-before: page; }
`;

const emergency = `<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="lh"><b>Tolka</b><span>Home Emergency Cover · Policy wording 2026.1</span></div>
<h1>Home Emergency Cover</h1>
<div class="sub">Optional add-on to Tolka Home Insurance. In force from 1 March 2026.</div>
<h2>1 What this cover is</h2>
<p>If your schedule shows Home Emergency Cover, we will send an approved tradesperson to deal with an emergency at your home, at any time of the day or night.</p>
<p>This cover is separate from your home insurance. Using it does not count as a claim on your home insurance and does not affect your no-claims discount.</p>
<h2>2 What counts as an emergency</h2>
<p>An emergency is a sudden event at your home that needs attention straight away to:</p>
<ol type="a">
<li>stop damage to your home or its contents;</li>
<li>make your home safe or secure; or</li>
<li>restore heating, lighting, power or water to your home.</li>
</ol>
<p>Examples are a burst pipe you cannot stop, a boiler that has stopped working in winter, a toilet that will not flush when it is the only one in your home, and a lost key or broken lock when you cannot lock your home.</p>
<h2>3 What we will pay</h2>
<p>We will pay up to €750 for each emergency, including the call-out charge, up to two hours of labour, and parts. We will pay for up to three emergencies in any period of insurance.</p>
<p>If your home cannot be lived in because of the emergency, we will also pay up to €150 a night for up to two nights' accommodation.</p>
<h2 class="pb">4 What we will not pay for</h2>
<ol type="a">
<li>a boiler that is more than 15 years old, or that has not been serviced in the 12 months before the emergency;</li>
<li>any problem you knew about before this cover started;</li>
<li>a permanent repair, when a temporary repair has made your home safe and a permanent repair would cost more than €750;</li>
<li>damage to the tradesperson's access, such as lifting floor coverings, unless that damage is covered by your home insurance;</li>
<li>emergencies while your home is unoccupied for more than 45 days in a row.</li>
</ol>
<h2>5 How to get help</h2>
<p>Call the emergency line shown on your schedule. Do not arrange your own tradesperson: we can only pay for work that we arrange.</p>
<p>Tell us your policy number, what has happened, and whether anyone in your home is elderly, unwell or very young. We aim to have someone with you within four hours in Dublin, Cork, Limerick and Galway, and within eight hours elsewhere.</p>
<h2>6 If you are unhappy</h2>
<p>Please contact Customer Relations. If you are not satisfied with our final response, you can refer your complaint to the Financial Services and Pensions Ombudsman.</p>
</body></html>`;

const leaflet = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: S; src: url(data:font/woff2;base64,${serif}) format('woff2'); font-weight: 200 900; }
@font-face { font-family: A; src: url(data:font/woff2;base64,${sans}) format('woff2'); font-weight: 200 800; }
body { margin: 0; width: 794px; height: 1123px; background: #fff; font: 17px/1.55 S, serif; color: #222; }
.w { padding: 80px 84px; }
b.t { font: 600 26px S, serif; color: #0E4B54; }
h1 { font-size: 34px; margin: 40px 0 10px; }
p { margin: 0 0 14px; max-width: 560px; }
.box { border: 1.5px solid #444; padding: 18px 22px; margin-top: 26px; }
small { font: 13px A, sans-serif; color: #555; }
</style></head><body><div class="w">
<b class="t">Tolka</b>
<h1>Has your boiler been serviced this year?</h1>
<p>A boiler that is serviced every year is less likely to break down in winter, uses less gas and is safer.</p>
<p>If you have Home Emergency Cover, a boiler must have been serviced in the 12 months before a breakdown for us to repair it.</p>
<div class="box"><p><b>Book your service in the autumn.</b> Engineers are busiest from November to February.</p>
<p>Keep the service record: we may ask for it if you make a claim.</p></div>
<p style="margin-top:40px"><small>Tolka Insurance DAC · Boiler service leaflet · Printed September 2025</small></p>
</div></body></html>`;

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(emergency, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out + 'Home Emergency Cover 2026.1.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true });

  // Taranmış görünüm: sayfanın görüntüsü alınır, hafif eğilip griye çekilir ve yalnızca görüntü olarak PDF'e konur
  const shot = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.5 });
  await shot.setContent(leaflet, { waitUntil: 'load' });
  await shot.evaluate(() => document.fonts.ready);
  const png = (await shot.screenshot({ type: 'jpeg', quality: 72 })).toString('base64');
  const scan = await browser.newPage();
  await scan.setContent(`<!doctype html><html><head><style>@page{size:A4;margin:0}body{margin:0;background:#f4f3ef}
    img{width:210mm;height:297mm;display:block;filter:grayscale(1) contrast(1.15) brightness(1.02);transform:rotate(0.6deg) scale(1.01)}</style></head>
    <body><img src="data:image/jpeg;base64,${png}"></body></html>`, { waitUntil: 'load' });
  await scan.pdf({ path: out + 'Boiler Service Leaflet (scan).pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
} finally {
  await browser.close();
}
console.log('Örnek dosyalar:', out);
