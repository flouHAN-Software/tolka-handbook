// Tolka Handbook'un otomatik denetimi (Playwright, Chromium + axe-core).
// Her ekranı 1440 / 1024 / 375 px'te açar ve şunlara bakar:
//   konsol ve sayfa hataları, yatay taşma, 14 px altı yazı (kimlik kuralı),
//   erişilebilirlik (WCAG 2.1 A ve AA: ciddi ve kritik ihlal hata, diğerleri uyarı).
// Ardından gezinmeyi dener: menü bağlantıları, dil ve tema değiştirme, telefonda alt sekmeler.
//
// Kullanım (geliştirme sunucusu açıkken: `npm run dev`):
//   npm run check                 EN-açık ve TR-koyu
//   npm run check -- --all        dört dil/tema birleşimi
//   npm run check -- --no-shots   görüntü almadan
//   npm run check -- --no-axe     erişilebilirlik denetimi olmadan (daha hızlı)
//   BASE=http://localhost:5193 npm run check   başka adres (ör. vite preview)
// Çıktı: output/checks/<genişlik>/<ekran>-<dil>-<tema>.png ve output/checks/rapor.txt
// Her çalıştırma yeni ve boş bir tarayıcı profiliyle açılır; kişisel tarayıcıya dokunmaz.

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://localhost:5192';
const OUT = fileURLToPath(new URL('../output/checks/', import.meta.url));
const ALL = process.argv.includes('--all');
const SHOTS = !process.argv.includes('--no-shots');
const AXE = !process.argv.includes('--no-axe');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const ROUTES = ['ask', 'documents', 'documents/claims-manual', 'documents/eow-guide', 'documents/surveyor-panel', 'documents/authority-limits/view', 'documents/home-policy-2026/view/7', 'history', 'quality', 'more', 'about'];
const SIZES = [
  { id: '1440', opts: { viewport: { width: 1440, height: 900 } } },
  { id: '1024', opts: { viewport: { width: 1024, height: 768 } } },
  { id: '375', opts: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } }
];
const COMBOS = ALL
  ? [['en', 'light'], ['en', 'dark'], ['tr', 'light'], ['tr', 'dark']]
  : [['en', 'light'], ['tr', 'dark']];

/** Sayfa içinde çalışır: taşan öğeler ve 14 px altı yazılar */
function audit() {
  const vw = document.documentElement.clientWidth;
  const hidden = (el) => {
    const s = getComputedStyle(el);
    return s.display === 'none' || s.visibility === 'hidden' || el.closest('.sr-only');
  };
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true;
    }
    return false;
  };
  const name = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  const over = [];
  const small = new Map();
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || hidden(el)) continue;
    if (r.right > vw + 1 && !inScroller(el) && over.length < 8) over.push(`${name(el)} (sağ kenar ${Math.round(r.right)} > ${vw})`);
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (text) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 14) small.set(name(el), `${fs}px "${el.textContent.trim().slice(0, 24)}"`);
    }
  }
  return { pageOverflow: document.documentElement.scrollWidth - vw, over, small: [...small].slice(0, 6).map(([k, v]) => `${k} ${v}`) };
}

async function open(page, lang, theme, route) {
  await page.goto(`${BASE}/?lang=${lang}&theme=${theme}#/${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

const lines = [];
let failures = 0;
const log = (s) => { lines.push(s); console.log(s); };
const fail = (s) => { failures++; log('HATA  ' + s); };
const ok = (s) => log('tamam ' + s);

async function axeCheck(page, tag) {
  if (!AXE) return;
  const v = (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations;
  for (const x of v) {
    const serious = x.impact === 'serious' || x.impact === 'critical';
    if (serious) failures++;
    log(`        erişilebilirlik (${x.impact}${serious ? ', HATA' : ''}): ${x.id} · ${x.nodes.length} öğe · ör. ${String(x.nodes[0]?.target ?? '').slice(0, 70)}  [${tag}]`);
  }
}

const browser = await chromium.launch();
// Ekran denetimleri hasar uzmanı (Ciarán) olarak girilmiş sayılır; giriş ekranı ve roller ayrıca denenir (10).
// Adresteki ?as=… bunu geçersiz kılar.
// Rehber ilk girişte açılır; ekran denetimlerinde görülmüş sayılır (rehberin kendisi 12'de denenir).
const rawContext = browser.newContext.bind(browser);
const freshContext = async (o) => {
  const c = await rawContext(o);
  await c.addInitScript(() => {
    try {
      const p = JSON.parse(localStorage.getItem('tolka-prefs') || '{}');
      if (p.guideSeen === undefined) localStorage.setItem('tolka-prefs', JSON.stringify({ ...p, guideSeen: true }));
    } catch (e) {}
  });
  return c;
};
browser.newContext = async (o) => {
  const c = await freshContext(o);
  await c.addInitScript(() => { try { if (!localStorage.getItem('tolka-account')) localStorage.setItem('tolka-account', 'ciaran'); } catch (e) {} });
  return c;
};
try {
  // 1) Ekranlar
  for (const size of SIZES) {
    if (SHOTS) await mkdir(join(OUT, size.id), { recursive: true });
    for (const [lang, theme] of COMBOS) {
      const ctx = await browser.newContext({ ...size.opts, colorScheme: theme });
      for (const route of ROUTES) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('pageerror', (e) => errors.push(e.message));
        await open(page, lang, theme, route);
        const a = await page.evaluate(audit);
        if (SHOTS) await page.screenshot({ path: join(OUT, size.id, `${route.replace("/", "--")}-${lang}-${theme}.png`), fullPage: !size.opts.isMobile });
        const tag = `${route.padEnd(26)} ${size.id.padEnd(4)} ${lang}-${theme}`;
        const bad = errors.length || a.pageOverflow > 0 || a.over.length || a.small.length;
        (bad ? fail : ok)(tag);
        errors.forEach((e) => log(`        konsol: ${e.slice(0, 160)}`));
        if (a.pageOverflow > 0) log(`        sayfa ${a.pageOverflow} px yatay taşıyor`);
        a.over.forEach((o) => log(`        taşan: ${o}`));
        a.small.forEach((s) => log(`        küçük yazı: ${s}`));
        await axeCheck(page, tag);
        await page.close();
      }
      await ctx.close();
    }
  }

  // 2) Gezinme: masaüstünde menü, dil ve tema
  {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    await open(page, 'en', 'light', 'ask');
    await page.click('.side-list a[href="#/documents"]');
    await page.waitForTimeout(250);
    const docOk = (await page.evaluate(() => location.hash)) === '#/documents' && (await page.textContent('h1')) === 'Documents';
    (docOk ? ok : fail)('menü: Documents ekranı açılıyor');
    const focused = await page.evaluate(() => document.activeElement?.id);
    (focused === 'main' ? ok : fail)('menü: ekran değişince odak içeriğe taşınıyor');
    const copy = (await page.textContent('.side-foot .copy-long'))?.trim();
    (copy === '© 2026 flouHAN Software. All rights reserved.' && (await page.locator('.side-foot .copy-long').isVisible()) ? ok : fail)('telif: menünün en altında "© 2026 flouHAN Software. All rights reserved."');
    await page.click('.side-foot .about-link');
    await page.waitForTimeout(250);
    const about = (await page.textContent('h1')) === 'About this project'
      && (await page.locator('.ab-skills > div').count()) >= 6
      && (await page.locator('.ab-tools > div').count()) >= 5
      && (await page.locator('.ab-licence', { hasText: 'All rights reserved' }).count()) === 1
      && (await page.getAttribute('.side-foot .about-link', 'aria-current')) === 'page';
    (about ? ok : fail)('Bu proje hakkında: menüden açılıyor; yapılanlar, diller ve araçlar, telif ve lisans bölümleri var');
    await page.click('.side-list a[href="#/documents"]');
    await page.waitForTimeout(250);
    await page.click('.side-prefs button[lang="tr"]');
    await page.waitForTimeout(250);
    const trOk = (await page.textContent('h1')) === 'Belgeler' && (await page.evaluate(() => document.documentElement.lang)) === 'tr' && (await page.evaluate(() => location.hash)) === '#/documents';
    (trOk ? ok : fail)('dil: Türkçeye geçince ekran ve adres yerinde kalıyor');
    await page.getByRole('button', { name: 'Koyu' }).first().click();
    await page.waitForTimeout(150);
    const dark = await page.evaluate(() => document.documentElement.dataset.theme);
    (dark === 'dark' ? ok : fail)('tema: koyu temaya geçiyor');
    await page.reload({ waitUntil: 'networkidle' });
    const kept = await page.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.lang]);
    const url = await page.evaluate(() => location.search);
    (kept[0] === 'dark' && kept[1] === 'tr' && url === '' ? ok : fail)('tercih: yenilemeden sonra dil ve tema korunuyor, adres temiz');
    // klavye: ilk Tab "İçeriğe geç" bağlantısına gider
    // (yalnızca adresin # kısmı değişirse sayfa yeniden yüklenmez; yeni sekmede açılır)
    const fresh = await ctx.newPage();
    await fresh.goto(`${BASE}/#/ask`, { waitUntil: 'networkidle' });
    await fresh.keyboard.press('Tab');
    const skip = await fresh.evaluate(() => document.activeElement?.className);
    (skip === 'skip' ? ok : fail)('klavye: ilk Tab "İçeriğe geç" bağlantısında');
    await ctx.close();
  }

  // 3) Simge menü: ipucu ve dil düğmesi
  {
    const ctx = await browser.newContext(SIZES[1].opts);
    const page = await ctx.newPage();
    await open(page, 'en', 'light', 'ask');
    await page.hover('.side-list a[href="#/history"]');
    await page.waitForTimeout(200);
    const tip = await page.evaluate(() => getComputedStyle(document.querySelector('.side-list a[href="#/history"] .tip')).opacity);
    (tip === '1' ? ok : fail)('simge menü: üstüne gelince ipucu görünüyor');
    const name = await page.getByRole('link', { name: 'History' }).count();
    (name === 1 ? ok : fail)('simge menü: bağlantının erişilebilir adı var');
    const railCopy = (await page.locator('.side-foot .copy-short').isVisible()) && !(await page.locator('.side-foot .copy-long').isVisible())
      && (await page.textContent('.side-foot .copy-sr'))?.trim() === '© 2026 flouHAN Software. All rights reserved.';
    (railCopy ? ok : fail)('simge menü: "© 2026" görünüyor, tam telif metni ekran okuyucuya açık');
    ((await page.getByRole('link', { name: 'About this project' }).count()) === 1 ? ok : fail)('simge menü: "About this project" bağlantısı var');
    await page.click('.rail-btn:has-text("Türkçe arayüze geç")');
    await page.waitForTimeout(250);
    (await page.textContent('h1')) === "Handbook'a sorun" ? ok('simge menü: dil düğmesi Türkçeye geçiriyor') : fail('simge menü: dil düğmesi');
    await ctx.close();
  }

  // 4) Telefon: alt sekmeler ve "Daha fazla"
  {
    const ctx = await browser.newContext(SIZES[2].opts);
    const page = await ctx.newPage();
    await open(page, 'en', 'light', 'ask');
    await page.tap('.tabs a[href="#/more"]');
    await page.waitForTimeout(250);
    (await page.textContent('h1')) === 'More' ? ok('telefon: Daha fazla açılıyor') : fail('telefon: Daha fazla');
    const noQuality = (await page.locator('.more-row[href="#/quality"]').count()) === 0 && (await page.locator('.more-block .btn', { hasText: 'Switch account' }).count()) === 1;
    (noQuality ? ok : fail)('telefon (claims): Daha fazla sayfasında Yanıt kalitesi yok, "Switch account" var');
    ((await page.locator('.page > .copy', { hasText: '© 2026 flouHAN Software. All rights reserved.' }).isVisible()) ? ok : fail)('telefon: Daha fazla sayfasının sonunda telif satırı');
    await page.tap('.more-row[href="#/about"]');
    await page.waitForTimeout(250);
    const ab = (await page.textContent('h1')) === 'About this project' && (await page.getAttribute('.tabs a[href="#/more"]', 'aria-current')) === 'page';
    (ab ? ok : fail)('telefon: "About this project" açılıyor, "Daha fazla" sekmesi seçili kalıyor');
    // Bilgi yönetimi olarak Yanıt kalitesi
    await page.goto(`${BASE}/?as=knowledge#/more`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    await page.tap('.more-row[href="#/quality"]');
    await page.waitForTimeout(250);
    const q = (await page.textContent('h1')) === 'Answer quality';
    const cur = await page.getAttribute('.tabs a[href="#/more"]', 'aria-current');
    (q && cur === 'page' ? ok : fail)('telefon: Yanıt kalitesi açılıyor, "Daha fazla" sekmesi seçili kalıyor');
    const tabsBox = await page.locator('.tabs').boundingBox();
    (tabsBox && Math.round(tabsBox.y + tabsBox.height) === 812 ? ok : fail)('telefon: alt sekmeler ekranın altında sabit');
    // Belgeler: satıra dokununca tam ekran kart, "‹ Documents" ile geri
    await page.tap('.tabs a[href="#/documents"]');
    await page.waitForTimeout(250);
    await page.tap('.lib-table a[href="#/documents/claims-manual"]');
    await page.waitForTimeout(250);
    const full = (await page.locator('.lib-table').count()) === 0 && (await page.textContent('#detail-title')) === 'Claims Handling Manual';
    (full ? ok : fail)('telefon: belge kartı tam ekran açılıyor');
    await page.tap('.detail .back');
    await page.waitForTimeout(250);
    ((await page.locator('.lib-table').count()) === 1 ? ok : fail)('telefon: "‹ Documents" listeye dönüyor');
    await ctx.close();
  }

  // 5) Belgeler: süzgeç, görünümler, kart, yetki, işlenen belge
  {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    await open(page, 'en', 'light', 'documents');
    const rows = () => page.locator('.lib-table tbody tr').count();
    const all = await rows();
    const fraud = await page.locator('text=Fraud Indicators').count();
    (all === 10 && fraud === 0 ? ok : fail)(`belgeler: hasar uzmanı 10 belge görüyor, çok gizli belge listede yok (${all})`);
    await page.fill('#lib-q', 'zzzz');
    await page.waitForTimeout(100);
    const none = (await page.locator('.empty').count()) === 1 && (await page.textContent('.empty b')).includes('zzzz');
    (none ? ok : fail)('belgeler: eşleşme yoksa "No documents match" ve aranan kelime');
    await page.click('.empty .btn');
    await page.waitForTimeout(100);
    const cleared = (await rows()) === 10 && (await page.evaluate(() => document.activeElement?.id)) === 'lib-q';
    (cleared ? ok : fail)('belgeler: "Clear filter" listeyi geri getiriyor, odak arama kutusunda');
    await page.fill('#lib-q', 'nolan');
    await page.waitForTimeout(100);
    ((await rows()) === 2 ? ok : fail)('belgeler: sorumlu adıyla süzme (Nolan → 2 belge)');
    await page.fill('#lib-q', '');
    await page.click('.lib-views button >> nth=1');
    await page.waitForTimeout(100);
    ((await rows()) === 4 ? ok : fail)('belgeler: "Needs attention" 4 belge (okunamayan, işlenen, iki gecikmiş)');
    await page.click('.lib-views button >> nth=2');
    await page.waitForTimeout(100);
    ((await rows()) === 1 ? ok : fail)('belgeler: "Earlier versions" yalnızca poliçe 2024.2');
    await page.click('.lib-views button >> nth=0');
    // Kart: okunamayan belge sade dille ne yapılacağını söylüyor
    await page.click('text=Surveyor Panel 2025');
    await page.waitForTimeout(250);
    const failed = (await page.textContent('.detail .msg.err h3')) === 'This PDF has no selectable text';
    (failed ? ok : fail)('kart: okunamayan PDF için "no selectable text" mesajı');
    const focus = await page.evaluate(() => document.activeElement?.id);
    (focus === 'detail-title' ? ok : fail)('kart: açılınca odak kartın başlığında');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    ((await page.locator('.detail').count()) === 0 ? ok : fail)('kart: Esc kapatıyor');
    // Önceki sürüm: yenisine bağlantı, "hasar tarihine göre" notu
    await page.goto(`${BASE}/#/documents/home-policy-2024`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const earlier = (await page.locator('.detail .versions a.v').count()) === 1 && (await page.textContent('.detail')).includes('loss happened before');
    (earlier ? ok : fail)('kart: önceki sürüm yenisine bağlanıyor ve ne zaman geçerli olduğunu söylüyor');
    // Yetki: hasar uzmanı çok gizli belgeyi adresle de açamaz
    await page.goto(`${BASE}/#/documents/fraud-indicators`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    ((await page.locator('.detail').count()) === 0 ? ok : fail)('yetki: çok gizli belge adresle açılmıyor');
    // İşlenen belge ilerliyor
    await page.goto(`${BASE}/#/documents/complaints-procedure`, { waitUntil: 'networkidle' });
    const p1 = await page.getAttribute('.detail [role="progressbar"]', 'aria-valuenow');
    await page.waitForTimeout(2300);
    const p2 = await page.getAttribute('.detail [role="progressbar"]', 'aria-valuenow');
    (Number(p2) > Number(p1) ? ok : fail)(`işleme: sayfa sayısı ilerliyor (${p1} → ${p2})`);
    await ctx.close();
  }

  // 6) Belge ekleme: boş form, yanlış dosya türü, metinli PDF, taranmış PDF, kaldırma, yenileme sonrası kalıcılık
  {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/?lang=en&theme=light&as=knowledge#/documents`, { waitUntil: "networkidle" }); // belge eklemeyi bilgi yönetimi yapar
    const samples = fileURLToPath(new URL('../public/samples/', import.meta.url));
    const openAdd = async () => { await page.click('.lib-add'); await page.waitForTimeout(150); };

    await openAdd();
    ((await page.locator('dialog.add[open]').count()) === 1 ? ok : fail)('ekleme: pencere açılıyor');
    await page.click('.add-foot .btn.primary');
    await page.waitForTimeout(150);
    const sum = await page.locator('.err-summary li').allTextContents();
    const focusSum = await page.evaluate(() => document.activeElement?.classList.contains('err-summary'));
    (sum.join('|') === 'Select a file to add|Enter a title|Enter a version, for example 1.0' && focusSum ? ok : fail)(`ekleme: boş formda hata özeti ve odak (${sum.join(' / ')})`);
    await page.click('.err-summary a >> nth=1');
    ((await page.evaluate(() => document.activeElement?.id)) === 'add-title' ? ok : fail)('ekleme: özetteki bağlantı ilgili alana götürüyor');
    await page.fill('#add-title', 'Claims notes');
    await page.setInputFiles('#add-file', { name: 'notes.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('x') });
    await page.waitForTimeout(100);
    const typeErr = (await page.textContent('#add-file-err'))?.includes('must be a PDF, Word (.docx), TXT or Markdown');
    const kept = (await page.inputValue('#add-title')) === 'Claims notes';
    (typeErr && kept ? ok : fail)('ekleme: desteklenmeyen dosya (Excel) reddediliyor, girilen ad silinmiyor');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const closed = (await page.locator('dialog.add[open]').count()) === 0 && (await page.evaluate(() => document.activeElement?.classList.contains('lib-add')));
    (closed ? ok : fail)('ekleme: Esc pencereyi kapatıyor, odak "Add a document" düğmesine dönüyor');

    // Metinli PDF (dosya seçerek): okunur, bölümler çıkar
    await openAdd();
    await page.setInputFiles('#add-file', join(samples, 'Home Emergency Cover 2026.1.pdf'));
    await page.waitForTimeout(100);
    const guessed = (await page.inputValue('#add-title')) === 'Home Emergency Cover' && (await page.inputValue('#add-version')) === '2026.1';
    (guessed ? ok : fail)('ekleme: dosya adından ad ve sürüm öneriliyor');
    await page.click('.add-foot .btn.primary');
    await page.waitForFunction(() => document.querySelector('#detail-title')?.textContent === 'Home Emergency Cover', null, { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector('.detail .st-ok'), null, { timeout: 15000 }).catch(() => {});
    const toc = await page.locator('.detail .toc li').count();
    const passages = await page.textContent('.detail .facts');
    (toc >= 6 && /\d+ passages/.test(passages ?? '') ? ok : fail)(`ekleme: metinli PDF okundu, ${toc} bölüm çıktı`);
    const said = await page.textContent('.lib [role="status"]');
    (said?.includes('has been read') ? ok : fail)('ekleme: okuma bitince ekran okuyucuya duyuruluyor');

    // Taranmış PDF (örnek düğmesiyle): okunamıyor, sade dille neden ve ne yapılacağı
    await openAdd();
    await page.click('.samples .linkish >> nth=1');
    await page.waitForTimeout(400);
    await page.click('.add-foot .btn.primary');
    await page.waitForFunction(() => document.querySelector('.detail .msg.err'), null, { timeout: 10000 }).catch(() => {});
    const scanMsg = await page.textContent('.detail .msg.err h3').catch(() => '');
    (scanMsg === 'This PDF has no selectable text' ? ok : fail)('ekleme: taranmış PDF "no selectable text" ile reddediliyor');

    // Yenileme sonrası iki belge de listede; taranmış olanı kaldır
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const rowsAfter = await page.locator('.lib-table tbody tr').count();
    (rowsAfter === 12 ? ok : fail)(`ekleme: yenilemeden sonra eklenen belgeler duruyor (${rowsAfter} satır)`);
    await page.click('.detail .remove .btn');
    await page.waitForTimeout(100);
    ((await page.evaluate(() => document.activeElement?.textContent)) === 'Remove' ? ok : fail)('kaldırma: önce onay soruluyor, odak "Remove" düğmesinde');
    await page.click('.confirm .btn.danger');
    await page.waitForTimeout(200);
    const rowsRemoved = await page.locator('.lib-table tbody tr').count();
    (rowsRemoved === 11 && (await page.locator('.detail').count()) === 0 ? ok : fail)('kaldırma: belge listeden çıkıyor, kart kapanıyor');
    (errors.length ? fail : ok)(`ekleme: sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);

    // Pencerenin kendisi: erişilebilirlik ve görüntü (1440 ve telefon)
    await openAdd();
    await page.click('.add-foot .btn.primary');
    await page.waitForTimeout(150);
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'ekle-hatalar-en-light.png') });
    await axeCheck(page, 'ekleme penceresi 1440');
    await ctx.close();

    const phone = await browser.newContext(SIZES[2].opts);
    const pp = await phone.newPage();
    await pp.goto(`${BASE}/?lang=tr&theme=dark&as=knowledge#/documents`, { waitUntil: "networkidle" });
    await pp.tap('.lib-add');
    await pp.waitForTimeout(200);
    await pp.tap('.samples .linkish >> nth=0');
    await pp.waitForTimeout(400);
    const a = await pp.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length ? ok : fail)('ekleme: telefonda pencere taşmıyor, küçük yazı yok');
    if (SHOTS) await pp.screenshot({ path: join(OUT, '375', 'ekle-tr-dark.png') });
    await axeCheck(pp, 'ekleme penceresi 375');
    await phone.close();
  }

  // 7) Soru-yanıt (arama modu): öneriler, hasar tarihi, yetki satırı, Türkçe, yanıt yok + aktarma, kaynak paneli
  //    Arama modu kota harcamaz ve sonucu belirlenimcidir; model modu aşağıda (8) ayrıca denenir
  const searchOnly = () => { try { localStorage.setItem('tolka-mode', 'search'); } catch (e) {} };
  for (const size of SIZES) {
    const ctx = await browser.newContext({ ...size.opts });
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const tag = `soru-yanıt ${size.id}:`;
    const mobile = !!size.opts.isMobile;
    const press = (sel) => (mobile ? page.tap(sel) : page.click(sel));
    await open(page, 'en', 'light', 'ask');
    const n = await page.locator('.suggest').count();
    (n === 9 ? ok : fail)(`${tag} başlangıçta 9 öneri (biri role özel), boş ekran yok`);
    if (size.id === '1440') {
      await page.click('.composer .btn.primary');
      await page.waitForTimeout(100);
      ((await page.textContent('#ask-err')) === 'Write a question first' ? ok : fail)(`${tag} boş soru "Write a question first"`);
    }
    // Hasar tarihi sorudan okunuyor → 2024.2 şartları, €350
    await press('.suggest:has-text("20 February 2026")');
    await page.waitForTimeout(700);
    const note = await page.textContent('.qa:last-child .notes');
    const q1 = await page.textContent('.qa:last-child .quotes li:first-child .quote');
    (note?.includes('Uses policy wording 2024.2') && q1?.includes('€350') ? ok : fail)(`${tag} hasar tarihi 2024.2 şartlarını seçtiriyor (€350)`);
    if (!mobile) {
      const pane = await page.textContent('.src .src-facts');
      const marked = await page.locator('.src mark.hl').count();
      (pane?.includes('2024.2') && marked > 0 ? ok : fail)(`${tag} kaynak panelinde 2024.2 açık, yer işaretli`);
      if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'sor-tarih-en-light.png') });
    } else {
      await page.tap('.qa:last-child .cite >> nth=0');
      await page.waitForTimeout(500);
      const full = await page.evaluate(() => { const r = document.querySelector('.src.open')?.getBoundingClientRect(); return r ? Math.round(r.width) : 0; });
      const seen = await page.evaluate(() => { const m = document.querySelector('.src mark.hl')?.getBoundingClientRect(); return m ? m.top > 0 && m.bottom < innerHeight : false; });
      (full === 375 && seen ? ok : fail)(`${tag} kaynağa dokununca belge tam ekran, işaretli yer ekranda`);
      if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'sor-kaynak-en-light.png') });
      await page.tap('.src .back');
      await page.waitForTimeout(200);
      ((await page.locator('.src.open').count()) === 0 ? ok : fail)(`${tag} "Back to the answer" yanıta dönüyor`);
      // Sabit soru kutusu yanıtı örtmesin (portföy görselinde yakalanan sorun)
      const ch = await page.evaluate(() => Math.round(document.querySelector('.composer').getBoundingClientRect().height));
      (ch <= 170 ? ok : fail)(`${tag} telefonda soru kutusu küçük (${ch} px), yanıtı örtmüyor`);
    }
    // Yetki: kendi unvanının satırı
    await page.fill('#ask-q', 'Can I settle a €12,000 buildings claim myself?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    const q2 = await page.textContent('.qa:last-child .quotes li:first-child .quote');
    (q2?.startsWith('Grade: Claims handler') ? ok : fail)(`${tag} yetki sorusunda "Claims handler" satırı`);
    // Bir başka kaynağa geçiş
    if (!mobile) {
      await page.click('.qa:last-child .cite >> nth=1');
      await page.waitForTimeout(400);
      const pressed = await page.getAttribute('.qa:last-child .cite >> nth=1', 'aria-pressed');
      (pressed === 'true' ? ok : fail)(`${tag} 2 numaralı kaynağa geçiliyor`);
    }
    const a = await page.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length && !a.over.length ? ok : fail)(`${tag} taşma ve küçük yazı yok${a.over.length ? ' · ' + a.over[0] : ''}${a.small.length ? ' · ' + a.small[0] : ''}`);
    await axeCheck(page, `${tag} yanıt`);
    // Yenilemeden sonra konuşma duruyor
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    ((await page.locator('.qa').count()) === 2 ? ok : fail)(`${tag} yenilemeden sonra konuşma duruyor`);
    (errors.length ? fail : ok)(`${tag} sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }
  {
    // Türkçe arayüz: Türkçe soru, sözlük notu; belgelerde olmayan soru ve bilgi yönetimine aktarma
    const ctx = await browser.newContext({ ...SIZES[0].opts, colorScheme: 'dark' });
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    await open(page, 'tr', 'dark', 'ask');
    await page.click('.suggest:has-text("Köpek")');
    await page.waitForTimeout(700);
    const by = await page.textContent('.qa:last-child .byline');
    const qt = await page.textContent('.qa:last-child .quotes li:first-child .quote');
    (by?.includes('sözlüğü') && qt?.includes('pets') ? ok : fail)('soru-yanıt TR: köpek sorusu 10.2(b) maddesini buluyor, sözlük notu var');
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'sor-kopek-tr-dark.png') });
    await page.fill('#ask-q', 'Drone çarpması hasarı teminat kapsamında mı?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    const none = await page.textContent('.qa:last-child .none h2').catch(() => '');
    (none === 'Rolünüzün açabildiği belgelerde bu konu yok.' ? ok : fail)('soru-yanıt TR: belgelerde olmayan soru tahmin edilmiyor');
    await page.click('.qa:last-child .none .btn');
    await page.waitForTimeout(200);
    const sent = await page.textContent('.qa:last-child .sent').catch(() => '');
    (sent?.includes('bilgi yönetimine gönderildi') ? ok : fail)('soru-yanıt TR: soru bilgi yönetimine aktarılıyor');
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'sor-yok-tr-dark.png') });
    await axeCheck(page, 'soru-yanıt TR koyu');
    await ctx.close();
  }

  // 8) Model modu (Gemma 4, Workers AI): yerel Worker açıksa (npm run server, 8787) gerçek yanıt;
  //    hizmete ulaşılamazsa arama moduna dönüş. Aynı sorular gün içinde önbellekten gelir, kota harcamaz.
  //    NO_AI=1 ile atlanır.
  if (!process.env.NO_AI) {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 'en', 'light', 'ask');
    const live = await page.evaluate(async () => (await fetch('/api/handbook/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
    if (live === 400) {
      // Önbellekten gelen yanıt anında döner; "yazıyor" durumu görülsün diye yanıt kısa süre geciktirilir
      const slow = async (r) => { await new Promise((res) => setTimeout(res, 900)); await r.continue(); };
      await page.route('**/api/handbook/answer', slow);
      await page.click('.suggest:has-text("What is the escape of water excess?")');
      await page.waitForTimeout(200);
      const busy = (await page.locator('[aria-busy="true"]').count()) === 1;
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(300);
      const by = (await page.textContent('.qa:last-child .byline')) ?? '';
      const inline = await page.locator('.qa:last-child .ai-text .cite').count();
      const text = (await page.textContent('.qa:last-child .ai-text').catch(() => '')) ?? '';
      await page.unroute('**/api/handbook/answer', slow);
      (busy ? ok : fail)('model: yazarken ne yapıldığı gösteriliyor (sahte yazma yok)');
      (by.includes('Written by Gemma 4') && inline > 0 ? ok : fail)(`model: Gemma 4 yanıtı, metin içinde ${inline} kaynak numarası`);
      (text.includes('400') ? ok : fail)('model: muafiyet sorusunda poliçe şartlarındaki €400 yazıyor');
      const marked = await page.locator('.src mark.hl').count();
      (marked > 0 ? ok : fail)('model: ilk kaynak belgede işaretli açılıyor');
      if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'model-en-light.png') });
      await axeCheck(page, 'model yanıtı');
    } else {
      log(`bilgi model: yerel Worker kapalı (yanıt ${live}); gerçek model denemesi atlandı`);
    }
    // Hizmete ulaşılamıyor: arama moduna dönüş ve nedeni
    await page.route('**/api/handbook/answer', (r) => r.abort());
    await page.fill('#ask-q', 'Do we cover a dog chewing the sofa?');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    const fb = (await page.textContent('.qa:last-child .byline')) ?? '';
    const cards = await page.locator('.qa:last-child .quotes li').count();
    (fb.includes('couldn’t be reached') && cards > 0 ? ok : fail)('model: hizmete ulaşılamazsa nedenini söyleyip arama moduna dönüyor');
    (errors.length ? fail : ok)(`model: sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }
  if (!process.env.NO_AI) {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?as=care&lang=tr#/ask`, { waitUntil: 'networkidle' });
    const live = await page.evaluate(async () => (await fetch('/api/handbook/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
    if (live === 400) {
      await page.fill('#ask-q', 'Evde kalamayan müşteriye otel ayarlayabilir miyim?');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 40000 }).catch(() => {});
      await page.waitForTimeout(300);
      const srcs = (await page.textContent('.qa:last-child')) ?? '';
      (srcs.includes('Customer Care Call Guide') && (await page.locator('.qa:last-child .ai-text .cite').count()) > 0 ? ok : fail)('anlam: Türkçe "evde kalamayan" sorusu İngilizce "cannot be lived in" maddesini buluyor (görüşme rehberi)');
    } else {
      log(`bilgi anlam: vektör ucu kapalı (yanıt ${live}); anlam araması denemesi atlandı`);
    }
    await ctx.close();
  }

  // 9) Belge görüntüleyici: karttan açma, içindekiler, belgede arama, sürüm karşılaştırması, kaynak panelinden açma
  for (const size of [SIZES[0], SIZES[2]]) {
    const ctx = await browser.newContext(size.opts);
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const tag = `görüntüleyici ${size.id}:`;
    const mobile = !!size.opts.isMobile;
    await open(page, 'en', 'light', 'documents/home-policy-2026');
    await (mobile ? page.tap('.detail-open') : page.click('.detail-open'));
    await page.waitForTimeout(300);
    const h1 = await page.textContent('.vw-title h1');
    (h1 === 'Home Insurance Policy Wording' && (await page.locator('.pg .cl').count()) > 40 ? ok : fail)(`${tag} karttaki "Open document" belgenin tamamını açıyor`);
    await page.fill('#vw-q', 'unoccupied');
    await page.waitForTimeout(250);
    const count = await page.textContent('#vw-count');
    const n = Number(/of (\d+)/.exec(count ?? '')?.[1] ?? 0);
    (n >= 5 && (await page.locator('mark.find.cur').count()) === 1 ? ok : fail)(`${tag} belgede arama: "unoccupied" ${n} yerde, geçerli sonuç işaretli`);
    await page.press('#vw-q', 'Enter');
    await page.waitForTimeout(150);
    ((await page.textContent('#vw-count'))?.startsWith('2 of') ? ok : fail)(`${tag} Enter sonraki sonuca geçiyor`);
    await page.fill('#vw-q', 'zzqx');
    await page.waitForTimeout(150);
    ((await page.textContent('#vw-count')) === 'No matches' ? ok : fail)(`${tag} sonuç yoksa "No matches"`);
    await page.fill('#vw-q', '');
    await (mobile ? page.tap('.vw-tools .btn') : page.click('.vw-tools .btn'));
    await page.waitForTimeout(300);
    const sum = (await page.textContent('.cmp-sum p')) ?? '';
    const ins = await page.locator('.cmp ins').count();
    const del = await page.locator('.cmp del').count();
    (/^\d+ clauses changed between 2024\.2 and 2026\.1/.test(sum) && ins > 0 && del > 0 ? ok : fail)(`${tag} sürüm karşılaştırması: ${sum.split('.')[0]}, ${ins} ekleme, ${del} çıkarma`);
    const cmpText = (await page.textContent('.cmp')) ?? '';
    (cmpText.includes('€350') && cmpText.includes('€400') ? ok : fail)(`${tag} karşılaştırmada €350 → €400 görünüyor`);
    if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'gor-karsilastirma-en-light.png') });
    const a = await page.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length && !a.over.length ? ok : fail)(`${tag} taşma ve küçük yazı yok${a.over[0] ? ' · ' + a.over[0] : ''}${a.small[0] ? ' · ' + a.small[0] : ''}`);
    await axeCheck(page, `${tag} karşılaştırma`);
    // Kaynak panelinden "belgenin tamamını aç" → ilgili madde
    if (!mobile) {
      await open(page, 'en', 'light', 'ask');
      await page.click('.suggest:has-text("What is the escape of water excess?")');
      await page.waitForTimeout(600);
      await page.click('.src-open');
      await page.waitForTimeout(400);
      const focused = await page.locator('.cl.focus').count();
      (page.url().includes('/view/') && focused === 1 ? ok : fail)(`${tag} kaynak panelinden belgenin tamamı ilgili maddede açılıyor`);
      if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'gor-madde-en-light.png') });
    }
    (errors.length ? fail : ok)(`${tag} sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }

  // 10) Giriş ve roller: dört hesap, role göre belgeler, menü, ekleme düğmesi, yetki yok sayfası, aynı soru iki rolde
  {
    const ctx = await freshContext(SIZES[0].opts);
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const text = () => page.evaluate(() => document.body.innerText);
    const as = async (name) => { await page.click(`.si-row:has-text("${name}") .btn`); await page.waitForTimeout(300); };
    await open(page, 'en', 'light', 'ask');
    const first = (await page.textContent('h1')) === 'Ask the Handbook' && (await page.locator('.signin').count()) === 0
      && (await page.textContent('.start-who p'))?.includes('Ciarán Byrne, claims handler');
    (first ? ok : fail)('ilk ziyaret: giriş ekranı yok, Sor ekranı Ciarán (hasar uzmanı) olarak açılıyor ve bu yazıyor');
    await page.click('.start-who .linkish');
    await page.waitForTimeout(250);
    const h = await page.textContent('h1');
    (h === 'Who are you signing in as?' && (await page.locator('.si-row').count()) === 4 ? ok : fail)('giriş: "Switch role" dört deneme hesabını gösteriyor');
    ((await text()).includes('no password') ? ok : fail)('giriş: parola olmadığı ve gerçek kurulumda sunucuda denetlendiği yazıyor');
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'giris-en-light.png') });
    await axeCheck(page, 'giriş 1440');

    // Müşteri temsilcisi
    await as('Niamh Gallagher');
    ((await page.textContent('.who b')) === 'Niamh Gallagher' ? ok : fail)('rol (care): menüde Niamh Gallagher');
    ((await page.locator('.side-list a[href="#/quality"]').count()) === 0 ? ok : fail)('rol (care): menüde Yanıt kalitesi yok');
    await page.goto(`${BASE}/#/documents`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const careRows = await page.locator('.lib-table tbody tr').count();
    const careText = await text();
    (careRows === 8 && !careText.includes('Claims Handling Manual') && !careText.includes('Delegated Authority') ? ok : fail)(`rol (care): 8 belge, hasar talimatı ve yetki limitleri yok (${careRows})`);
    await page.click('.lib-add');
    await page.waitForTimeout(200);
    const demoNote = (await page.locator('dialog.add[open] .add-demo').count()) === 1 && (await page.textContent('dialog.add .add-demo'))?.includes('anyone can add');
    (demoNote ? ok : fail)('rol (care): demoda belge ekleyebiliyor; pencerede gerçek kurulumda bunun bilgi yönetiminin işi olduğu yazıyor');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/#/documents/claims-manual`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const denied = await text();
    (denied.includes('isn’t shared with your role') && denied.includes('Customer care agent') && !denied.includes('Claims Handling Manual') ? ok : fail)('rol (care): bağlantıyla gelinen gizli belgede açıklama var, belgenin adı görünmüyor');
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'yetki-yok-en-light.png') });
    await page.goto(`${BASE}/#/quality`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    ((await page.textContent('h1')) === 'Answer quality is for the Knowledge team' ? ok : fail)('rol (care): Yanıt kalitesi adresinde nedenini anlatan sayfa');

    // Hesap değiştir → vazgeç → araştırmacı
    await page.click('.side-foot .switch');
    await page.waitForTimeout(200);
    await page.click('.si-back');
    await page.waitForTimeout(200);
    ((await page.textContent('.who b')) === 'Niamh Gallagher' ? ok : fail)('hesap: "Keep the current account" aynı hesapla geri dönüyor');
    await page.click('.side-foot .switch');
    await page.waitForTimeout(200);
    await as('Aoife Doherty');
    await page.goto(`${BASE}/#/documents`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const siuRows = await page.locator('.lib-table tbody tr').count();
    (siuRows === 11 && (await text()).includes('Fraud Indicators') ? ok : fail)(`rol (siu): 11 belge, suistimal göstergeleri görünüyor (${siuRows})`);
    const q = 'What are the fraud indicators in escape of water claims?';
    await page.goto(`${BASE}/#/ask`, { waitUntil: 'networkidle' });
    await page.fill('#ask-q', q);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const siuAns = (await page.textContent('.qa:last-child')) ?? '';
    (siuAns.includes('Fraud Indicators: Household') ? ok : fail)('rol (siu): aynı soru suistimal göstergelerinden yanıtlanıyor');

    // Aynı soru hasar uzmanıyla: kısıtlı belge yanıtta da görünmüyor
    await page.click('.side-foot .switch');
    await page.waitForTimeout(200);
    await as('Ciarán Byrne');
    await page.goto(`${BASE}/#/ask`, { waitUntil: 'networkidle' });
    await page.fill('#ask-q', q);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const claimsAns = (await page.textContent('.qa:last-child')) ?? '';
    (!claimsAns.includes('Fraud Indicators') ? ok : fail)('rol (claims): aynı soruda suistimal göstergeleri ne kaynakta ne metinde var');
    ((await page.locator('.start').count()) === 0 && (await page.locator('.qa').count()) === 1 ? ok : fail)('hesap: her hesap yalnızca kendi konuşmalarını görüyor');

    // Bilgi yönetimi
    await page.click('.side-foot .switch');
    await page.waitForTimeout(200);
    await as('Declan Moran');
    await page.goto(`${BASE}/#/documents`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    ((await page.locator('.lib-add').count()) === 1 && (await page.locator('.side-list a[href="#/quality"]').count()) === 1 ? ok : fail)('rol (knowledge): "Add a document" ve Yanıt kalitesi görünüyor');
    (errors.length ? fail : ok)(`roller: sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();

    // Telefonda giriş ekranı
    const phone = await freshContext(SIZES[2].opts);
    const pp = await phone.newPage();
    await open(pp, 'tr', 'dark', 'ask');
    const a = await pp.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length && !a.over.length ? ok : fail)(`giriş 375: taşma ve küçük yazı yok${a.over[0] ? ' · ' + a.over[0] : ''}`);
    if (SHOTS) await pp.screenshot({ path: join(OUT, '375', 'giris-tr-dark.png'), fullPage: true });
    await axeCheck(pp, 'giriş 375');
    await phone.close();
  }

  // 11) Yanıt kalitesi (bilgi yönetimi): gruplar, ayrıntı, atama, çözüldü (boş not reddi), canlı aktarılan soru
  for (const size of SIZES) {
    const ctx = await freshContext(size.opts);
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const tag = `kalite ${size.id}:`;
    const mobile = !!size.opts.isMobile;
    const press = (sel) => (mobile ? page.tap(sel) : page.click(sel));
    // Önce hasar uzmanı olarak bir soruyu bilgi yönetimine gönder (canlı kayıt)
    await page.goto(`${BASE}/?lang=en&theme=light&as=claims#/ask`, { waitUntil: 'networkidle' });
    await page.fill('#ask-q', 'Drone çarpması hasarı teminat kapsamında mı?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await press('.qa:last-child .none .btn');
    await page.waitForTimeout(200);
    // Bilgi yönetimi olarak Yanıt kalitesi
    await page.goto(`${BASE}/?as=knowledge#/quality`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const rows = await page.locator('.iq-row').count();
    const sum = (await page.textContent('.iq-sum')) ?? '';
    (rows >= 7 && /open issues behind \d+ questions/.test(sum) ? ok : fail)(`${tag} ${rows} açık konu, özet cümlesi (${sum.slice(0, 60)}…)`);
    const liveRow = page.locator('.iq-row', { hasText: 'Sent from the Handbook: not in the documents' });
    ((await liveRow.count()) === 1 ? ok : fail)(`${tag} hasar uzmanının gönderdiği soru "Not in the documents" grubunda`);
    // En çok sorulan konu: €350 / €400 çelişkisi
    await press('.iq-row:has-text("Escape of water excess")');
    await page.waitForTimeout(300);
    const det = (await page.textContent('.iq-detail')) ?? '';
    (det.includes('€350') && det.includes('€400') && (await page.locator('.iq-asked li').count()) === 3 ? ok : fail)(`${tag} ayrıntı: ne yanlış (€350 / €400) ve 3 soru`);
    if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'kalite-en-light.png'), fullPage: !mobile });
    await axeCheck(page, `${tag} ayrıntı`);
    await press('.iq-detail .btn.primary');
    await page.waitForTimeout(200);
    ((await page.textContent('.iq-status'))?.startsWith('Assigned to Eoin Farrell') ? ok : fail)(`${tag} "Assign to Eoin Farrell" atıyor`);
    await press('.iq-detail .confirm-acts .btn');
    await page.waitForTimeout(150);
    await press('.iq-detail form .btn.primary');
    await page.waitForTimeout(150);
    ((await page.textContent('#iq-note-err')) === 'Describe what was changed' ? ok : fail)(`${tag} boş notla çözüldü denemesi reddediliyor`);
    await page.fill('#iq-note', 'Guide 3.2 now says €400, in line with the policy.');
    await press('.iq-detail form .btn.primary');
    await page.waitForTimeout(200);
    ((await page.textContent('.iq-status'))?.startsWith('Resolved on') ? ok : fail)(`${tag} notla çözüldü olarak işaretleniyor`);
    if (mobile) { await page.tap('.iq-detail .back'); await page.waitForTimeout(200); }
    await press('.lib-views button >> nth=1');
    await page.waitForTimeout(200);
    ((await page.locator('.iq-row', { hasText: 'Escape of water excess' }).count()) === 1 ? ok : fail)(`${tag} çözülen konu "Resolved" görünümünde`);
    const a = await page.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length && !a.over.length ? ok : fail)(`${tag} taşma ve küçük yazı yok${a.over[0] ? ' · ' + a.over[0] : ''}${a.small[0] ? ' · ' + a.small[0] : ''}`);
    (errors.length ? fail : ok)(`${tag} sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }

  // 12) İlk giriş rehberi ve Geçmiş: rehber kendiliğinden açılıyor, "… olarak sor" soruyu soruyor, bir daha açılmıyor,
  //     menüden yeniden açılıyor; Geçmiş konuşmayı listeliyor ve açıyor
  for (const size of [SIZES[0], SIZES[2]]) {
    const ctx = await rawContext(size.opts);
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const tag = `rehber ${size.id}:`;
    const mobile = !!size.opts.isMobile;
    const press = (sel) => (mobile ? page.tap(sel) : page.click(sel));
    await open(page, 'en', 'light', 'ask');
    const shown = (await page.locator('dialog.guide[open]').count()) === 1 && (await page.textContent('#g-h')) === 'How the Handbook works';
    (shown ? ok : fail)(`${tag} ilk girişte rehber açılıyor`);
    const g = (await page.textContent('dialog.guide')) ?? '';
    (g.includes('What each screen is for') && g.includes('Try these first') && g.includes('Look for:') && g.includes('You’re in as Ciarán Byrne') && !/Ctrl|⌘|Esc\b/.test(g) ? ok : fail)(`${tag} amaç, hangi rolle girildiği, ekranlar, önce denenecekler, neye bakılacak; kısayol işareti yok`);
    ((await page.locator('.g-tries li').count()) === 4 && (await page.locator('.g-tries li .btn', { hasText: 'Add a document' }).count()) === 1 ? ok : fail)(`${tag} 4 deneme (biri kendi PDF'iniz), her birinde düğme`);
    if (!mobile) {
      const side = await page.evaluate(() => { const d = document.querySelector('dialog.guide'); return !!d && d.classList.contains('side') && !d.matches(':modal'); });
      (side ? ok : fail)(`${tag} geniş ekranda rehber yan panel, arkadaki Sor ekranı kullanılabilir`);
    }
    if (SHOTS) await page.screenshot({ path: join(OUT, size.id, 'rehber-en-light.png') });
    const a = await page.evaluate(audit);
    (a.pageOverflow <= 0 && !a.small.length ? ok : fail)(`${tag} taşma ve küçük yazı yok${a.small[0] ? ' · ' + a.small[0] : ''}`);
    await axeCheck(page, `${tag} rehber`);
    await press('.g-lang button[lang="tr"]');
    await page.waitForTimeout(200);
    ((await page.textContent('#g-h')) === 'Handbook nasıl çalışır?' ? ok : fail)(`${tag} rehberde Türkçeye geçiliyor`);
    await press('.g-lang button[lang="en"]');
    await page.waitForTimeout(200);
    await press('.g-tries li >> nth=0 >> .btn');
    await page.waitForTimeout(700);
    const asked = (await page.locator('dialog.guide[open]').count()) === 0 && (await page.textContent('.qa .q p').catch(() => '')) === 'What is the escape of water excess?';
    (asked ? ok : fail)(`${tag} "Ask as Ciarán" rehberi kapatıp soruyu Ciarán olarak soruyor`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    ((await page.locator('dialog.guide[open]').count()) === 0 ? ok : fail)(`${tag} rehber bir kez görülünce kendiliğinden açılmıyor`);
    // Geçmiş
    await page.goto(`${BASE}/#/history`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    ((await page.locator('.hist-row').count()) === 1 && (await page.textContent('.hist-title')) === 'What is the escape of water excess?' ? ok : fail)(`${tag} Geçmiş konuşmayı listeliyor`);
    await page.fill('#hist-q', 'zzqx');
    await page.waitForTimeout(150);
    ((await page.textContent('.empty b'))?.includes('zzqx') ? ok : fail)(`${tag} Geçmiş'te eşleşme yoksa söylüyor`);
    await page.fill('#hist-q', '');
    await press('.hist-row');
    await page.waitForTimeout(300);
    (page.url().includes('#/ask/c-') && (await page.locator('.qa').count()) === 1 ? ok : fail)(`${tag} Geçmiş'ten konuşma kaldığı yerden açılıyor`);
    // Menüden yeniden aç
    if (mobile) {
      await page.tap('.tabs a[href="#/more"]');
      await page.waitForTimeout(200);
      await page.tap('.more-block .btn:has-text("How it works")');
    } else {
      await page.click('.side-foot .guide-link');
    }
    await page.waitForTimeout(200);
    ((await page.locator('dialog.guide[open]').count()) === 1 ? ok : fail)(`${tag} "How it works" rehberi yeniden açıyor`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    ((await page.locator('dialog.guide[open]').count()) === 0 ? ok : fail)(`${tag} Esc rehberi kapatıyor`);
    (errors.length ? fail : ok)(`${tag} sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }

  // 13) Kendi belgenizle deneyin: Sor ekranındaki kart, hızlı ekleme, Türkçe PDF'e Türkçe soru, kapsamı kaldırma
  {
    const ctx = await browser.newContext(SIZES[0].opts);
    await ctx.addInitScript(searchOnly);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 'tr', 'light', 'ask');
    await page.click('.start-own .btn');
    await page.waitForTimeout(250);
    const quick = (await page.locator('dialog.add[open]').count()) === 1 && (await page.locator('dialog.add #add-version').count()) === 0
      && (await page.textContent('#add-h')) === 'Kendi belgenizi ekleyin';
    (quick ? ok : fail)('kendi belge: Sor ekranından hızlı ekleme açılıyor (yalnızca dosya ve ad)');
    const firstSample = (await page.textContent('dialog.add .samples .linkish >> nth=0'))?.trim();
    (firstSample === 'Türkçe personel el kitabı (metinli PDF)' ? ok : fail)('kendi belge: Türkçe arayüzde Türkçe örnek başta');
    await page.click('dialog.add .samples .linkish >> nth=0');
    await page.waitForTimeout(600);
    await page.click('dialog.add button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.scope') && !/okunuyor/.test(document.querySelector('.scope').textContent), null, { timeout: 30000 });
    ((await page.textContent('.scope-t'))?.includes('Yalnızca “Personel El Kitabı” içinde soruluyor') ? ok : fail)('kendi belge: soru kutusunun üstünde "Yalnızca … içinde soruluyor"');
    if (SHOTS) await page.screenshot({ path: join(OUT, '1440', 'kendi-belge-tr-light.png') });
    await page.fill('#ask-q', 'Yıllık izin kaç gün?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const src = await page.evaluate(() => [...document.querySelectorAll('.qa:last-child .src-title, .qa:last-child .cite-doc, .qa:last-child .found-doc, .qa:last-child')].map((e) => e.textContent).join(' '));
    (src.includes('Personel El Kitabı') && src.includes('16 iş günü') ? ok : fail)('kendi belge: Türkçe belgeye Türkçe soru doğru bölümü buluyor (16 iş günü)');
    await page.click('.scope .linkish');
    await page.waitForTimeout(200);
    ((await page.locator('.scope').count()) === 0 ? ok : fail)('kendi belge: "Bütün belgelere sor" kapsamı kaldırıyor');
    // Belge kartından "Yalnızca bu belgeye sor"
    await page.goto(`${BASE}/#/documents/eow-guide`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    await page.click('.detail-ask');
    await page.waitForTimeout(300);
    (page.url().endsWith('#/ask') && (await page.textContent('.scope-t'))?.includes('Escape of Water Claims Guide') ? ok : fail)('belge kartı: "Yalnızca bu belgeye sor" Sor ekranını o belgeyle açıyor');
    // Word dosyası: başlıklar, madde işaretli liste ve tablo okunuyor; tablodaki satır bulunuyor
    await page.goto(`${BASE}/#/ask`, { waitUntil: 'networkidle' });
    await page.click('.start-own .btn');
    await page.waitForTimeout(250);
    await page.click('dialog.add .samples .linkish:has-text("Word")');
    await page.waitForTimeout(500);
    await page.click('dialog.add button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.scope') && !/okunuyor|reading/.test(document.querySelector('.scope').textContent), null, { timeout: 30000 });
    const docx = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('tolka:uploads') || '[]').find((x) => /\.docx$/.test(x.file));
      return d ? { n: d.sections.length, kinds: d.sections.flatMap((s) => s.clauses.flatMap((c) => c.blocks.map((b) => b.t))) } : null;
    });
    (docx && docx.n === 6 && docx.kinds.includes('list') && docx.kinds.includes('table') ? ok : fail)(`Word: .docx başlıklara, listeye ve tabloya ayrışıyor (${docx ? docx.n + ' bölüm' : 'yok'})`);
    // Yalnızca arama modu kelimeyle arar (Türkçe soru İngilizce tabloyla eşleşmez; onu model modundaki anlam araması bulur)
    await page.fill('#ask-q', 'How much is the broadband contribution?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    (((await page.textContent('.qa:last-child')) ?? '').includes('Broadband contribution') ? ok : fail)('Word: tablodaki satır soruyla bulunuyor (Broadband contribution)');
    (errors.length ? fail : ok)(`kendi belge: sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }

  // 14) Akan yanıt (taklit sunucuyla, kota harcamadan): parçalar ekranda birleşiyor, sonunda kaynak numarası ekleniyor;
  //     sunucu kota hatası gönderirse arama moduna dönülüp nedeni yazılıyor
  {
    const ctx = await browser.newContext(SIZES[0].opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const done = { ok: true, model: 'Gemma 4', modelKey: 'gemma', verdict: 'answered', answer: 'The excess is €400 [1].', quotes: [], dropped: 0, cited: [1], neurons: 1 };
    const sse = (events) => events.map((e) => `data: ${JSON.stringify(e)}`).join('\n\n') + '\n\n';
    await page.route('**/api/handbook/embed', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"reason":"busy"}' }));
    await page.route('**/api/handbook/answer', (r) => r.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }, body: sse([{ t: 'd', s: 'The excess ' }, { t: 'd', s: 'is €400 [1' }, { t: 'd', s: '].' }, { t: 'done', r: done }]) }));
    await open(page, 'en', 'light', 'ask');
    await page.fill('#ask-q', 'What is the escape of water excess?');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(200);
    const txt = (await page.textContent('.qa:last-child .ai-text')) ?? '';
    (txt.includes('The excess is €400') && (await page.locator('.qa:last-child .ai-text .cite').count()) === 1 ? ok : fail)('akış: parçalar birleşiyor, yanıt bitince kaynak numarası ekleniyor');
    await page.unroute('**/api/handbook/answer');
    await page.route('**/api/handbook/answer', (r) => r.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: sse([{ t: 'err', reason: 'quota' }]) }));
    await page.fill('#ask-q', 'Do we cover a dog chewing the sofa?');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(200);
    const fb = (await page.textContent('.qa:last-child')) ?? '';
    (/daily|allowance|quota/i.test(fb) ? ok : fail)('akış: sunucu kota hatası gönderirse arama moduna dönüp nedenini yazıyor');
    (errors.length ? fail : ok)(`akış: sayfa hatası yok${errors.length ? ' · ' + errors[0] : ''}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

log(failures ? `\n${failures} sorun bulundu.` : '\nSorun bulunmadı.');
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'rapor.txt'), lines.join('\n') + '\n');
process.exit(failures ? 1 : 0);
