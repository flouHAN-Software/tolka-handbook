// Doküman asistanı demosunun (Tolka Handbook) yanıt yazan ucu.
//
// POST /api/handbook/answer
//   Tarayıcı, kullanıcının rolünün açabildiği belgelerden soruya en yakın bölümleri (en çok 6) gönderir.
//   Cloudflare Workers AI üzerindeki dil modeli yalnızca bu bölümlerden kısa bir yanıt yazar, her cümleye
//   bölüm numarasını koyar ve bölümlerde yanıt yoksa "none" der. Model iki kısa alıntı da verir;
//   alıntılar bölüm metninde birebir aranır, bulunamayan alıntı yanıttan çıkarılır ve sayısı bildirilir.
//
// Ücret ve koruma:
//   Workers AI günde 10.000 Neuron ücretsiz verir; Workers Free planında aşılırsa istek hata verir, ücret çıkmaz.
//   Burada ayrıca günlük 8.000 Neuron sınırı, kişi (IP) başına günde 40 soru ve aynı soru + bölümler için
//   gün içinde önbellek var (HandbookMeter, SQLite depolamalı Durable Object). Sınır dolunca tarayıcı arama moduna döner.
//   Yalnızca uygulamanın kendi sayfasından (ve yerel geliştirmede localhost'tan) gelen istek kabul edilir.
//
// Not: Yetki (hangi belgenin kime açık olduğu) bu demoda tarayıcıda uygulanır; gerçek kurulumda sunucuda uygulanır.
import { DurableObject } from 'cloudflare:workers';

const MODELS = {
  gemma: { id: '@cf/google/gemma-4-26b-a4b-it', name: 'Gemma 4', inN: 9091, outN: 27273, extra: { chat_template_kwargs: { enable_thinking: false } } },
  llama: { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B', inN: 26668, outN: 204805 },
  mistral: { id: '@cf/mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', inN: 31876, outN: 50488 },
  oss: { id: '@cf/openai/gpt-oss-120b', name: 'gpt-oss-120b', inN: 31818, outN: 68182 }
};
const DEFAULT_MODEL = 'gemma';
// İstem değişince önbellekteki eski yanıtlar kullanılmasın
const PROMPT_V = 2;
const DAILY_NEURONS = 8000;
const PER_IP_DAILY = 40;

export class HandbookMeter extends DurableObject {
  /** Gün içindeki harcamayı ve kişi sayacını kontrol eder; izin verirse kişi sayacını artırır */
  async reserve(ip, perIp = PER_IP_DAILY) {
    const day = today();
    const used = (await this.ctx.storage.get(`n:${day}`)) || 0;
    if (used >= DAILY_NEURONS) return { ok: false, reason: 'quota', used };
    const k = `ip:${day}:${ip}`;
    const n = (await this.ctx.storage.get(k)) || 0;
    if (n >= perIp) return { ok: false, reason: 'rate', used };
    await this.ctx.storage.put(k, n + 1);
    return { ok: true, used };
  }
  async spend(neurons) {
    const k = `n:${today()}`;
    const used = ((await this.ctx.storage.get(k)) || 0) + neurons;
    await this.ctx.storage.put(k, used);
    return used;
  }
  async cacheGet(key) {
    const v = await this.ctx.storage.get(`c:${today()}:${key}`);
    return v || null;
  }
  async cachePut(key, value) {
    await this.ctx.storage.put(`c:${today()}:${key}`, value);
    // Dünden kalan kayıtlar silinir
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 6 * 3600 * 1000);
  }
  async alarm() {
    const day = today();
    const all = await this.ctx.storage.list();
    const old = [...all.keys()].filter((k) => !k.includes(day));
    for (let i = 0; i < old.length; i += 128) await this.ctx.storage.delete(old.slice(i, i + 128));
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export async function handbook(request, env, url) {
  if (url.pathname !== '/api/handbook/answer') return json({ ok: false, reason: 'not_found' }, 404);
  if (request.method !== 'POST') return json({ ok: false, reason: 'method' }, 405, { Allow: 'POST' });
  // Yerel geliştirme yalnızca .dev.vars dosyasındaki HANDBOOK_DEV=1 ile anlaşılır (wrangler dev isteği flouhan.com adıyla gösterir;
  // .dev.vars canlıya yüklenmez). Yerelde localhost kaynaklı istek ve model seçimi serbesttir.
  const local = env.HANDBOOK_DEV === '1';
  const origin = request.headers.get('Origin') || '';
  if (origin !== url.origin && !(local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) return json({ ok: false, reason: 'origin' }, 403);
  if (!env.AI || !env.HANDBOOK) return json({ ok: false, reason: 'unavailable' }, 503);

  const raw = await request.text();
  if (raw.length > 24000) return json({ ok: false, reason: 'bad' }, 413);
  let b;
  try { b = JSON.parse(raw); } catch { return json({ ok: false, reason: 'bad' }, 400); }
  const q = clean(b?.q, 600);
  const lang = b?.lang === 'tr' ? 'tr' : 'en';
  const asker = clean(b?.asker, 80);
  const passages = Array.isArray(b?.passages)
    ? b.passages.slice(0, 6).map((p) => ({ label: clean(p?.label, 200), overdue: clean(p?.overdue, 60), text: clean(p?.text, 1800) })).filter((p) => p.text)
    : [];
  if (q.length < 3 || !passages.length) return json({ ok: false, reason: 'bad' }, 400);
  // Modeli yalnızca yerel denemede seçmek mümkün (karşılaştırma için)
  const key = local && MODELS[b?.model] ? b.model : DEFAULT_MODEL;
  const model = MODELS[key];

  const meter = env.HANDBOOK.get(env.HANDBOOK.idFromName('meter'));
  const cacheKey = await sha(JSON.stringify([PROMPT_V, key, lang, asker, q.toLowerCase(), passages]));
  const hit = await meter.cacheGet(cacheKey);
  if (hit) return json({ ...hit, cached: true });

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const allowed = await meter.reserve(ip, local ? 1000 : PER_IP_DAILY);
  if (!allowed.ok) return json({ ok: false, reason: allowed.reason }, 429);

  const system = SYSTEM(lang);
  const user = (asker ? `The person asking: ${asker}.\n` : '') + `Question: ${q}\n\nPassages:\n` + passages.map((p, i) => `[${i + 1}] ${p.label}${p.overdue ? ` (${p.overdue})` : ''}\n"${p.text}"`).join('\n\n');

  let out;
  try {
    out = await run(env, model, key, system, user);
  } catch (e) {
    return json({ ok: false, reason: 'busy', detail: local ? String(e?.message || e).slice(0, 300) : undefined }, 503);
  }
  const neurons = Math.ceil(((out.usage.prompt_tokens ?? user.length / 4 + system.length / 4) * model.inN + (out.usage.completion_tokens ?? out.text.length / 4) * model.outN) / 1e6);
  await meter.spend(neurons);

  const parsed = parse(out.text);
  if (!parsed) return json({ ok: false, reason: 'format', detail: local ? out.text.slice(0, 400) : undefined }, 502);

  // Alıntı denetimi: bölüm metninde birebir geçmeyen alıntı gösterilmez
  const quotes = [];
  let dropped = 0;
  for (const qt of parsed.quotes) {
    const p = passages[qt.n - 1];
    if (p && qt.text.length >= 8 && norm(p.text).includes(norm(qt.text).replace(/[.;,:]$/, ''))) quotes.push(qt);
    else dropped++;
  }
  // Yanıttaki [n] işaretleri: var olmayan bölüme işaret eden çıkarılır
  const answer = parsed.answer.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (m, list) => {
    const ok = list.split(',').map((x) => +x.trim()).filter((n) => n >= 1 && n <= passages.length);
    return ok.length ? `[${ok.join(', ')}]` : '';
  });
  const cited = [...new Set([...answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(',').map((x) => +x.trim())))];

  const result = { ok: true, model: model.name, modelKey: key, verdict: parsed.verdict, answer, quotes, dropped, cited, neurons };
  await meter.cachePut(cacheKey, result);
  return json(result);
}

const SYSTEM = (lang) => `You answer questions from staff at Tolka Insurance, a home insurer in Ireland. Use only the numbered passages from its internal Handbook in the user message.

Rules:
- Use only the passages. Do not use outside knowledge and do not guess.
- If the passages do not answer the question, set "verdict" to "none" and say in one sentence what the documents do not cover.
- If they answer only part of it, set "verdict" to "partial" and say which part is not covered.
- After every statement that relies on a passage, put its number in square brackets, for example [2].
- If passages disagree, for example two different amounts, say so plainly and say which one applies: the policy wording prevails over guides and manuals, and a passage marked "review overdue" may be out of date.
- If a decision belongs to a person, for example whether the customer knew about a leak, say who decides. Do not decide for them.
- "I", "me" and "myself" in the question mean the person asking; use their role to apply limits that depend on it.
- Answer only what was asked. Do not mention topics the question did not raise, and never list things the documents do not cover unless they are part of the question.
- Use "partial" only when part of what was asked is not covered by the passages.
- ${lang === 'tr' ? 'Write the answer in Turkish, addressing the reader formally (siz). Keep insurance terms accurate.' : 'Write the answer in plain British English.'} Calm, direct, at most 110 words, no headings.
- Give one or two short quotes in the "quotes" field only, copied exactly, word for word, from the passages, each under 30 words. Never change a quote, never put a quote inside "answer". Quotes stay in English.

Reply with JSON only, no other text:
{"verdict":"answered","answer":"...","quotes":[{"n":1,"text":"..."}]}
"verdict" is one of "answered", "partial", "none".`;

async function run(env, model, key, system, user) {
  let res;
  if (key === 'oss') {
    res = await env.AI.run(model.id, { instructions: system, input: user, reasoning: { effort: 'low' }, max_output_tokens: 900 });
  } else {
    res = await env.AI.run(model.id, {
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: 700,
      temperature: 0.2,
      ...(model.extra || {})
    });
  }
  let text = res?.response ?? res?.choices?.[0]?.message?.content;
  if (text === undefined && Array.isArray(res?.output)) {
    const msg = res.output.filter((o) => o.type === 'message').flatMap((o) => o.content || []);
    text = msg.map((c) => c.text || '').join('');
  }
  if (text && typeof text === 'object') text = JSON.stringify(text);
  return { text: String(text ?? ''), usage: res?.usage || {} };
}

function parse(text) {
  const s = text.replace(/```(?:json)?/g, '');
  const a = s.indexOf('{');
  const z = s.lastIndexOf('}');
  if (a < 0 || z <= a) return null;
  let j;
  try { j = JSON.parse(s.slice(a, z + 1)); } catch { return null; }
  const verdict = ['answered', 'partial', 'none'].includes(j?.verdict) ? j.verdict : null;
  const answer = clean(j?.answer, 1500);
  if (!verdict || !answer) return null;
  const quotes = Array.isArray(j.quotes)
    ? j.quotes.slice(0, 3).map((q) => ({ n: Math.trunc(+q?.n), text: clean(q?.text, 300).replace(/^["“]|["”]$/g, '') })).filter((q) => q.n > 0 && q.text)
    : [];
  return { verdict, answer, quotes };
}

const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
