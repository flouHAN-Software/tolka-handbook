// Doküman asistanı demosunun (Tolka Handbook) yanıt yazan ucu.
//
// POST /api/handbook/answer
//   Tarayıcı, kullanıcının rolünün açabildiği belgelerden soruya en yakın bölümleri (en çok 6) gönderir.
//   Cloudflare Workers AI üzerindeki dil modeli yalnızca bu bölümlerden kısa bir yanıt yazar, her cümleye
//   bölüm numarasını koyar ve bölümlerde yanıt yoksa "none" der. Model iki kısa alıntı da verir;
//   alıntılar bölüm metninde birebir aranır, bulunamayan alıntı yanıttan çıkarılır ve sayısı bildirilir.
//   "stream": true ile yanıt yazılırken parça parça gönderilir (text/event-stream): {t:"d", s} parçalar, {t:"done", r} sonuç.
//
// POST /api/handbook/embed
//   Anlam araması için metinleri vektöre çevirir (bge-m3, çok dilli: Türkçe soru İngilizce bölümü bulur).
//   Vektörler normalleştirilip 8 bitlik tamsayıya indirilir (her biri için bir ölçek); tarayıcı karşılaştırmayı kendisi yapar.
//
// Ücret ve koruma:
//   Workers AI günde 10.000 Neuron ücretsiz verir; Workers Free planında aşılırsa istek hata verir, ücret çıkmaz.
//   Burada ayrıca günlük 8.000 Neuron sınırı, kişi (IP) başına günde 40 soru ve aynı soru + bölümler için
//   gün içinde önbellek var (HandbookMeter, SQLite depolamalı Durable Object). Sınır dolunca tarayıcı arama moduna döner.
//   Yerel geliştirmede (HANDBOOK_DEV=1) önbellek gün sınırı olmadan kalıcıdır: denetimler ve kayıtlar aynı soruları
//   tekrar sorduğunda hesabın günlük kotası harcanmaz (yerel denemeler ile canlı demo aynı kotayı paylaşır).
//   Yalnızca uygulamanın kendi sayfasından (ve yerel geliştirmede localhost'tan) gelen istek kabul edilir.
//
// Yetki sunucuda da denetlenir: gelen her bölüm, kurumun belge listesinde (handbook-corpus.json) o belgeye ait olmalı,
//   metni birebir aynı olmalı ve soran rol o belgeyi açabilmeli; olmazsa model çalıştırılmaz (403 "access").
//   Kullanıcının kendi eklediği belgeler ("up-" ile başlar) yalnızca onun tarayıcısındadır; metni oradan gelir.
//   Demoda parola olmadığı için rol tarayıcıdan gelir; gerçek kurulumda kurumun girişinden (SSO) gelir.
import { DurableObject } from 'cloudflare:workers';
import CORPUS from './handbook-corpus.json';

const MODELS = {
  gemma: { id: '@cf/google/gemma-4-26b-a4b-it', name: 'Gemma 4', inN: 9091, outN: 27273, extra: { chat_template_kwargs: { enable_thinking: false } } },
  llama: { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B', inN: 26668, outN: 204805 },
  mistral: { id: '@cf/mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', inN: 31876, outN: 50488 },
  oss: { id: '@cf/openai/gpt-oss-120b', name: 'gpt-oss-120b', inN: 31818, outN: 68182 }
};
const DEFAULT_MODEL = 'gemma';
// Anlam araması: çok dilli gömme modeli (girdi milyon token başına Neuron)
const EMBED = { id: '@cf/baai/bge-m3', name: 'bge-m3', inN: 1075 };
// İstem değişince önbellekteki eski yanıtlar kullanılmasın
const PROMPT_V = 6;
const ROLES = ['care', 'claims', 'siu', 'knowledge'];
const DAILY_NEURONS = 8000;
const PER_IP_DAILY = 40;
const EMBED_PER_IP = 400;

export class HandbookMeter extends DurableObject {
  /** Gün içindeki harcamayı ve kişi sayacını kontrol eder; izin verirse kişi sayacını artırır (kind: soru "ip", vektör "e") */
  async reserve(ip, perIp = PER_IP_DAILY, kind = 'ip') {
    const day = today();
    const used = (await this.ctx.storage.get(`n:${day}`)) || 0;
    if (used >= DAILY_NEURONS) return { ok: false, reason: 'quota', used };
    const k = `${kind}:${day}:${ip}`;
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
  /** persist: yerel geliştirmede gün sınırı olmadan saklanır */
  async cacheGet(key, persist = false) {
    const v = await this.ctx.storage.get(persist ? `cd:${key}` : `c:${today()}:${key}`);
    return v || null;
  }
  async cachePut(key, value, persist = false) {
    await this.ctx.storage.put(persist ? `cd:${key}` : `c:${today()}:${key}`, value);
    // Dünden kalan kayıtlar silinir (kalıcı yerel önbellek hariç)
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 6 * 3600 * 1000);
  }
  async alarm() {
    const day = today();
    const all = await this.ctx.storage.list();
    const old = [...all.keys()].filter((k) => !k.includes(day) && !k.startsWith('cd:'));
    for (let i = 0; i < old.length; i += 128) await this.ctx.storage.delete(old.slice(i, i + 128));
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export async function handbook(request, env, url) {
  const route = url.pathname;
  if (route !== '/api/handbook/answer' && route !== '/api/handbook/embed') return json({ ok: false, reason: 'not_found' }, 404);
  if (request.method !== 'POST') return json({ ok: false, reason: 'method' }, 405, { Allow: 'POST' });
  // Yerel geliştirme yalnızca .dev.vars dosyasındaki HANDBOOK_DEV=1 ile anlaşılır (wrangler dev isteği flouhan.com adıyla gösterir;
  // .dev.vars canlıya yüklenmez). Yerelde localhost kaynaklı istek ve model seçimi serbesttir.
  const local = env.HANDBOOK_DEV === '1';
  const origin = request.headers.get('Origin') || '';
  if (origin !== url.origin && !(local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) return json({ ok: false, reason: 'origin' }, 403);
  if (!env.AI || !env.HANDBOOK) return json({ ok: false, reason: 'unavailable' }, 503);

  const raw = await request.text();
  if (raw.length > (route.endsWith('/embed') ? 140000 : 24000)) return json({ ok: false, reason: 'bad' }, 413);
  let b;
  try { b = JSON.parse(raw); } catch { return json({ ok: false, reason: 'bad' }, 400); }
  const meter = env.HANDBOOK.get(env.HANDBOOK.idFromName('meter'));
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  if (route.endsWith('/embed')) return embed(b, env, meter, ip, local);

  const q = clean(b?.q, 600);
  const lang = b?.lang === 'tr' ? 'tr' : 'en';
  const asker = clean(b?.asker, 80);
  const role = ROLES.includes(b?.role) ? b.role : '';
  const passages = Array.isArray(b?.passages)
    ? b.passages.slice(0, 6).map((p) => ({ label: clean(p?.label, 200), overdue: clean(p?.overdue, 60), text: clean(p?.text, 1800), doc: clean(p?.doc, 80), key: clean(p?.key, 160) })).filter((p) => p.text)
    : [];
  if (q.length < 3 || !passages.length || !role) return json({ ok: false, reason: 'bad' }, 400);
  // Yetki: kurumun belgesinden gelen her bölüm gerçekten o belgede olmalı ve rol o belgeyi açabilmeli
  for (const p of passages) {
    if (/^up-[a-z0-9]+$/.test(p.doc) && p.key.startsWith(p.doc + '#')) continue;
    const d = CORPUS.docs[p.doc];
    if (!d || !d.audience.includes(role) || !p.key.startsWith(p.doc + '#') || d.keys[p.key] !== (await sha(p.text))) {
      return json({ ok: false, reason: 'access' }, 403);
    }
  }
  // Modeli yalnızca yerel denemede seçmek mümkün (karşılaştırma için)
  const key = local && MODELS[b?.model] ? b.model : DEFAULT_MODEL;
  const model = MODELS[key];

  const cacheKey = await sha(JSON.stringify([PROMPT_V, key, lang, role, asker, q.toLowerCase(), passages.map((p) => [p.label, p.overdue, p.text])]));
  // Yalnızca yerelde: tanıtım videosu akan yanıtı gösterebilsin diye önbellek okunmadan yazdırılabilir ("fresh")
  const hit = local && b?.fresh === true ? null : await meter.cacheGet(cacheKey, local);
  if (hit) return json({ ...hit, cached: true });

  const allowed = await meter.reserve(ip, local ? 1000 : PER_IP_DAILY);
  if (!allowed.ok) return json({ ok: false, reason: allowed.reason }, 429);

  const system = SYSTEM(lang);
  const user = (asker ? `The person asking: ${asker}.\n` : '') + `Question: ${q}\n\nPassages:\n` + passages.map((p, i) => `[${i + 1}] ${p.label}${p.overdue ? ` (${p.overdue})` : ''}\n"${p.text}"`).join('\n\n');
  const ctx = { env, model, key, system, user, passages, meter, cacheKey, local, lang };

  if (b?.stream === true && key !== 'oss') return streamAnswer(ctx);

  let out;
  try {
    out = await run(env, model, key, system, user);
  } catch (e) {
    return json({ ok: false, reason: aiReason(e), detail: local ? String(e?.message || e).slice(0, 300) : undefined }, 503);
  }
  const neurons = cost(model, out.usage, system, user, out.text);
  await meter.spend(neurons);
  const parsed = parse(out.text);
  if (!parsed) return json({ ok: false, reason: 'format', detail: local ? out.text.slice(0, 400) : undefined }, 502);
  const result = finish(parsed, passages, model, key, neurons, lang);
  await meter.cachePut(cacheKey, result, local);
  return json(result);
}

/* ---------- Akan yanıt ---------- */
// Model yazdıkça yalnızca "ANSWER:" ile "QUOTES:" arasındaki metin tarayıcıya gider; sonunda alıntılar denetlenir ve
// tam sonuç gönderilir. Bağlantı yarıda kesilse de harcama ve önbellek kaydedilir.
function streamAnswer({ env, model, key, system, user, passages, meter, cacheKey, local, lang }) {
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();
  let open = true;
  const send = async (o) => {
    if (!open) return;
    try { await w.write(enc.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { open = false; }
  };
  const end = async () => { if (open) { open = false; try { await w.close(); } catch { /* kapalı */ } } };

  (async () => {
    let src;
    try {
      src = await env.AI.run(model.id, {
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: 700,
        temperature: 0.2,
        stream: true,
        ...(model.extra || {})
      });
    } catch (e) {
      await send({ t: 'err', reason: aiReason(e), detail: local ? String(e?.message || e).slice(0, 300) : undefined });
      return end();
    }
    let full = '';
    let sent = 0;
    let usage = null;
    let buf = '';
    const reader = src.getReader();
    const dec = new TextDecoder();
    const take = (event) => {
      for (const line of event.split('\n')) {
        const m = /^data:\s?(.*)$/.exec(line.trim());
        if (!m || m[1] === '[DONE]') continue;
        let j;
        try { j = JSON.parse(m[1]); } catch { continue; }
        if (j.usage) usage = j.usage;
        const piece = j.response ?? j.choices?.[0]?.delta?.content ?? '';
        if (typeof piece === 'string') full += piece;
      }
    };
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          take(buf.slice(0, i));
          buf = buf.slice(i + 2);
        }
        const d = answerDelta(full, sent);
        if (d.text) {
          sent = d.upto;
          await send({ t: 'd', s: d.text });
        }
      }
      if (buf.trim()) take(buf);
    } catch (e) {
      await send({ t: 'err', reason: aiReason(e) });
      return end();
    }
    const neurons = cost(model, usage || {}, system, user, full);
    await meter.spend(neurons);
    const parsed = parse(full);
    if (!parsed) {
      await send({ t: 'err', reason: 'format', detail: local ? full.slice(0, 400) : undefined });
      return end();
    }
    const result = finish(parsed, passages, model, key, neurons, lang);
    await meter.cachePut(cacheKey, result, local);
    await send({ t: 'done', r: result, raw: local ? full.slice(-700) : undefined });
    return end();
  })();

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' }
  });
}

/** Yanıt bölümünden henüz gönderilmemiş kısım. "QUOTES:" gelene kadar son birkaç karakter tutulur (yarım gelmiş olabilir). */
function answerDelta(full, sent) {
  const a = /ANSWER:[ \t]*\n?/i.exec(full);
  if (!a) return { text: '', upto: sent };
  const start = a.index + a[0].length;
  const q = /\n[ \t]*QUOTES:/i.exec(full.slice(start));
  const end = q ? start + q.index : Math.max(start, full.length - 12);
  const from = Math.max(sent, start);
  if (end <= from) return { text: '', upto: sent };
  return { text: full.slice(from, end), upto: end };
}

/* ---------- Anlam araması: vektörler ---------- */
async function embed(b, env, meter, ip, local) {
  const texts = Array.isArray(b?.texts) ? b.texts.slice(0, 64).map((t) => clean(t, 2000)).filter(Boolean) : [];
  if (!texts.length) return json({ ok: false, reason: 'bad' }, 400);
  const chars = texts.reduce((n, t) => n + t.length, 0);
  if (chars > 60000) return json({ ok: false, reason: 'bad' }, 413);
  const cacheKey = await sha(JSON.stringify(['e1', EMBED.id, texts]));
  const hit = await meter.cacheGet(cacheKey, local);
  if (hit) return json({ ...hit, cached: true });
  const allowed = await meter.reserve(ip, local ? 100000 : EMBED_PER_IP, 'e');
  if (!allowed.ok) return json({ ok: false, reason: allowed.reason }, 429);
  let res;
  try {
    res = await env.AI.run(EMBED.id, { text: texts });
  } catch (e) {
    return json({ ok: false, reason: aiReason(e), detail: local ? String(e?.message || e).slice(0, 300) : undefined }, 503);
  }
  const data = res?.data;
  if (!Array.isArray(data) || data.length !== texts.length) return json({ ok: false, reason: 'format' }, 502);
  const s = [];
  const q = [];
  for (const v of data) {
    const r = quantize(v);
    s.push(r.s);
    q.push(r.q);
  }
  const neurons = Math.max(1, Math.ceil(((chars / 4) * EMBED.inN) / 1e6));
  await meter.spend(neurons);
  const result = { ok: true, model: EMBED.name, dims: data[0].length, s, q, neurons };
  await meter.cachePut(cacheKey, result, local);
  return json(result);
}

/** Birim vektör → 8 bitlik tamsayı (base64) ve ölçek; iki vektörün iç çarpımı ≈ kosinüs benzerliği */
function quantize(v) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  let m = 0;
  for (const x of v) m = Math.max(m, Math.abs(x / n));
  const scale = m / 127 || 1;
  const bytes = new Uint8Array(v.length);
  for (let i = 0; i < v.length; i++) bytes[i] = Math.round(v[i] / n / scale) & 0xff;
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { s: scale, q: btoa(bin) };
}

/* ---------- Model ---------- */
const SYSTEM = (lang) => `You answer questions from staff at Tolka Insurance, a home insurer in Ireland. Use only the numbered passages in the user message: they come from its internal Handbook, or from a document the user added themselves.

Rules:
- Use only the passages. Do not use outside knowledge and do not guess.
- If the passages do not answer the question, the verdict is "none": say in one sentence what the documents do not cover.
- If they answer only part of it, the verdict is "partial": say which part is not covered.
- After every statement that relies on a passage, put its number in square brackets, for example [2].
- If passages disagree, for example two different amounts, say so plainly and say which one applies: the policy wording prevails over guides and manuals, and a passage marked "review overdue" may be out of date.
- If a decision belongs to a person, for example whether the customer knew about a leak, say who decides. Do not decide for them.
- "I", "me" and "myself" in the question mean the person asking; use their role to apply limits that depend on it.
- Answer only what was asked. Do not mention topics the question did not raise, and never list things the documents do not cover unless they are part of the question.
- Use "partial" only when part of what was asked is not covered by the passages.
- ${lang === 'tr' ? "Write the answer in natural Turkish, the way an experienced Turkish colleague would say it, not a translation from English: short sentences, active voice, formal 'siz'. Express conditions with Turkish suffixes (-sa/-se, -ırsa) instead of starting sentences with 'Eğer', and avoid stiff, translated phrasing such as 'yaşanabilir durumda', 'olmaması halinde' or 'dahilinde'. Use these Turkish terms: 'cannot be lived in' = 'evde kalınamıyorsa', 'within the policy limit' = 'poliçe limitine kadar', 'claims handler' = 'hasar uzmanı', 'excess' = 'muafiyet', 'arrange' = 'ayarlamak'. Example of the style wanted, on another subject: 'Fatura 30 gün içinde ödenmezse müşteriye hatırlatma gönderilir [1]. İkinci hatırlatmadan sonra dosyayı hukuk birimi alır [2].' Keep document titles as they are." : 'Write the answer in plain British English.'} Calm, direct, at most 110 words, no headings, no lists.
- Give one or two short quotes, copied exactly, word for word, from the passages, each under 30 words. Never change a quote and never put a quote inside the answer. Quotes stay in the language of the passage.

Reply in exactly this format and nothing else:
VERDICT: answered
ANSWER:
<the answer, with [n] after each statement>
QUOTES:
[1] "<exact words from passage 1>"
The verdict is one of answered, partial, none.`;

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

const cost = (model, usage, system, user, text) =>
  Math.ceil(((usage.prompt_tokens ?? user.length / 4 + system.length / 4) * model.inN + (usage.completion_tokens ?? text.length / 4) * model.outN) / 1e6);

/** Workers AI hatası: hesabın günlük ücretsiz kotası dolduysa "quota", değilse "busy" */
function aiReason(e) {
  return /allocation|neurons|quota|daily free|3036/i.test(String(e?.message || e)) ? 'quota' : 'busy';
}

/** Modelin çıktısı: önce "VERDICT/ANSWER/QUOTES" biçimi, olmazsa eski JSON biçimi */
function parse(text) {
  const v = /VERDICT:\s*(answered|partial|none)/i.exec(text)?.[1]?.toLowerCase();
  const a = /ANSWER:[ \t]*\n?/i.exec(text);
  if (v && a) {
    const rest = text.slice(a.index + a[0].length);
    const qi = /\n[ \t]*QUOTES:/i.exec(rest);
    const answer = clean((qi ? rest.slice(0, qi.index) : rest).trim(), 1500);
    const quotes = [];
    if (qi) {
      for (const m of rest.slice(qi.index).matchAll(/\[(\d+)\]\s*["“„]?(.+?)["”]?\s*$/gm)) {
        const t = clean(m[2], 300).replace(/^["“„]|["”]$/g, '');
        if (+m[1] > 0 && t) quotes.push({ n: +m[1], text: t });
        if (quotes.length >= 3) break;
      }
    }
    if (answer) return { verdict: v, answer, quotes };
  }
  const s = text.replace(/```(?:json)?/g, '');
  const i = s.indexOf('{');
  const z = s.lastIndexOf('}');
  if (i < 0 || z <= i) return null;
  let j;
  try { j = JSON.parse(s.slice(i, z + 1)); } catch { return null; }
  const verdict = ['answered', 'partial', 'none'].includes(j?.verdict) ? j.verdict : null;
  const answer = clean(j?.answer, 1500);
  if (!verdict || !answer) return null;
  const quotes = Array.isArray(j.quotes)
    ? j.quotes.slice(0, 3).map((q) => ({ n: Math.trunc(+q?.n), text: clean(q?.text, 300).replace(/^["“]|["”]$/g, '') })).filter((q) => q.n > 0 && q.text)
    : [];
  return { verdict, answer, quotes };
}

/** Alıntı denetimi ve kaynak numaraları; sonuç önbelleğe ve tarayıcıya gider */
function finish(parsed, passages, model, key, neurons, lang) {
  // Bölüm metninde birebir geçmeyen alıntı gösterilmez
  const quotes = [];
  let dropped = 0;
  for (const qt of parsed.quotes) {
    const p = passages[qt.n - 1];
    if (p && qt.text.length >= 8 && norm(p.text).includes(norm(qt.text).replace(/[.;,:]$/, ''))) quotes.push(qt);
    else dropped++;
  }
  // Yanıttaki [n] işaretleri: var olmayan bölüme işaret eden çıkarılır
  // Numarasız uydurma işaretler ([rule] gibi) silinir
  let answer = parsed.answer.replace(/\s?\[(?!\d)[^\]\n]{1,24}\]/g, '').replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (m, list) => {
    const ok = list.split(',').map((x) => +x.trim()).filter((n) => n >= 1 && n <= passages.length);
    return ok.length ? `[${ok.join(', ')}]` : '';
  });
  // Türkçede koşulu ek taşır; cümle başındaki "Eğer" çeviri gibi okunur ve atılır ("Eğer evde kalınamıyorsa" → "Evde kalınamıyorsa")
  if (lang === 'tr') answer = answer.replace(/(^|[.!?]\s+)Eğer\s+(\p{L})/gu, (_m, a, c) => a + c.toLocaleUpperCase('tr'));
  const cited = [...new Set([...answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(',').map((x) => +x.trim())))];
  return { ok: true, model: model.name, modelKey: key, verdict: parsed.verdict, answer, quotes, dropped, cited, neurons };
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
