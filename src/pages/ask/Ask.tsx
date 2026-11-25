import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { DocView } from '../../components/DocView';
import { ClassLabel, Status } from '../../components/Labels';
import { passageOf, type AnswerData } from '../../data/answer';
import { ask, type Mode } from '../../data/ask';
import { conversationById, useConversations } from '../../data/conversations';
import { canOpen, docById, review } from '../../data/library';
import { liveStatus, useProcessing } from '../../data/processing';
import { onUploadFinished, useUploads } from '../../data/uploads';
import { currentAccount } from '../../lib/account';
import { ADD_KEY, scope as currentScope, setScope, useScope } from '../../lib/scope';
import { switchAccount } from '../../components/Shell';
import { AddDocument } from '../documents/AddDocument';
import { findDate } from '../../lib/dates';
import { date } from '../../lib/format';
import { getLang, t } from '../../lib/i18n';
import { currentRole } from '../../lib/role';
import { go, href, useRoute } from '../../lib/router';
import { useMedia } from '../../lib/useMedia';
import { AnswerView } from './Answer';
import { TRY_KEY } from '../../components/Guide';

// Başlangıç önerileri: demonun gerçek senaryoları, her dil kendi sözleriyle
const ROLE_SUGGEST: Record<string, { en: string; tr: string }> = {
  care: { en: 'The customer’s kitchen is flooded and they can’t stay at home tonight. What can I arrange?', tr: 'Müşterinin mutfağını su basmış, bu gece evde kalamıyor. Ne ayarlayabilirim?' },
  claims: { en: 'Can I settle a €12,000 buildings claim myself?', tr: '12.000 € tutarındaki bina hasarını kendim ödeyebilir miyim?' },
  siu: { en: 'What are the fraud indicators in escape of water claims?', tr: 'Su kaçağı dosyalarında suistimal göstergeleri neler?' },
  knowledge: { en: 'How are the authority limits measured?', tr: 'Yetki limitleri neye göre hesaplanır?' }
};

const SUGGEST: { group: 'start.cover' | 'start.limits' | 'start.process'; en: string; tr: string }[] = [
  { group: 'start.cover', en: 'A customer noticed a slow leak under the kitchen sink three months after it started. Are we covering it?', tr: 'Müşteri mutfak lavabosunun altındaki sızıntıyı üç ay sonra fark etmiş. Karşılıyor muyuz?' },
  { group: 'start.cover', en: 'Do we cover a dog chewing the sofa?', tr: 'Köpek kanepeyi çiğnemiş, karşılıyor muyuz?' },
  { group: 'start.cover', en: 'The customer will be away for two months over the winter. What do they need to do?', tr: 'Ev kışın iki ay boş kalacak, müşteri ne yapmalı?' },
  { group: 'start.limits', en: 'What is the escape of water excess?', tr: 'Su kaçağı muafiyeti ne kadar?' },
  { group: 'start.limits', en: 'The loss happened on 20 February 2026. What is the escape of water excess?', tr: 'Hasar 20 Şubat 2026’da oldu. Su kaçağı muafiyeti ne kadar?' },
  { group: 'start.limits', en: 'What is the limit for alternative accommodation?', tr: 'Geçici konaklama için ödeme limiti ne kadar?' },
  { group: 'start.process', en: 'Can I tell the customer the claim has been referred to SIU?', tr: 'Müşteriye dosyanın suistimal birimine gönderildiğini söyleyebilir miyim?' },
  { group: 'start.process', en: 'How quickly must we acknowledge a complaint?', tr: 'Şikâyeti ne kadar sürede yanıtlamalıyız?' }
];

export interface Pick { answerId: string; i: number }

export function Ask() {
  useProcessing();
  useUploads();
  useConversations();
  const { rest } = useRoute();
  const phone = useMedia('(max-width: 767px)');
  const role = currentRole();
  const conv = conversationById(rest[0]);
  const items = conv?.items ?? [];

  const [q, setQ] = useState('');
  const [loss, setLoss] = useState('');
  const [showDate, setShowDate] = useState(false);
  // Telefonda yanıt modu ve hasar tarihi "Seçenekler" altında; soru kutusu yanıtı örtmesin
  const [opts, setOpts] = useState(false);
  const [err, setErr] = useState(false);
  const [pick, setPick] = useState<Pick | null>(null);
  const [sheet, setSheet] = useState(false);
  const [announce, setAnnounce] = useState('');
  // Yanıtı kim yazsın: Gemma 4 (varsayılan) ya da yalnızca arama. Tercih bu tarayıcıda saklanır
  const [mode, setModeState] = useState<Mode>(() => (localStorage.getItem('tolka-mode') === 'search' ? 'search' : 'ai'));
  const setMode = (m: Mode) => {
    setModeState(m);
    try { localStorage.setItem('tolka-mode', m); } catch { /* depolama kapalı */ }
  };
  const box = useRef<HTMLTextAreaElement>(null);
  const thread = useRef<HTMLDivElement>(null);

  // "Yalnızca bu belgeye sor": kendi eklenen PDF ya da kütüphaneden seçilen belge
  const scopeId = useScope();
  const scoped = scopeId ? docById(scopeId) : undefined;
  const scopedDoc = scoped && canOpen(scoped, role) ? scoped : undefined;
  useEffect(() => { if (scopeId && !scopedDoc) setScope(null); }, [scopeId, scopedDoc]);
  const scopeStatus = scopedDoc ? liveStatus(scopedDoc) : undefined;
  const scopeNote = !scopeStatus
    ? ''
    : scopeStatus.status === 'processing'
      ? (scopeStatus.pages ? t('scope.reading', { page: scopeStatus.page ?? 0, pages: scopeStatus.pages }) : t('scope.reading0'))
      : scopeStatus.status === 'failed' ? t('scope.failed') : '';

  // Kendi belgenizle deneyin: ekleme penceresi (rehberden de açılır)
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(ADD_KEY)) { sessionStorage.removeItem(ADD_KEY); setAdding(true); }
    } catch { /* depolama kapalı */ }
    const on = () => {
      try { sessionStorage.removeItem(ADD_KEY); } catch { /* depolama kapalı */ }
      setAdding(true);
    };
    window.addEventListener('tolka:add', on);
    return () => window.removeEventListener('tolka:add', on);
  }, []);
  useEffect(
    () => onUploadFinished((d) => {
      if (d.id === currentScope()) setAnnounce(d.status === 'ready' ? t('own.ready', { title: d.title }) : t('add.failed', { title: d.title }));
    }),
    []
  );
  // Telefonda model yanıtı gelince: yanıt metninden üç satır bile görünmüyorsa yanıtın başına kaydırılır
  const reveal = useRef<string | null>(null);
  useEffect(() => {
    const id = reveal.current;
    if (!id) return;
    const body = thread.current?.querySelector<HTMLElement>(`[data-answer="${id}"] :is(.ans, .none)`);
    if (!body) return;
    reveal.current = null;
    const top = body.getBoundingClientRect().top;
    const floor = document.querySelector('.composer')?.getBoundingClientRect().top ?? innerHeight;
    if (floor - top >= 160) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bar = document.querySelector('.bar')?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({ top: top + window.scrollY - bar - 12, behavior: smooth ? 'smooth' : 'auto' });
  });

  // Konuşma açılınca son yanıtın ilk kaynağı gösterilir
  useEffect(() => {
    const last = items[items.length - 1];
    setPick(last?.cites.length ? { answerId: last.id, i: 0 } : null);
    setSheet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id]);

  const tr = getLang() === 'tr';

  const run = (text: string, lossOverride?: string) => {
    const question = text.trim();
    if (!question) {
      setErr(true);
      box.current?.focus();
      return;
    }
    const { convId: id, answer: a, done } = ask(conv?.id, question, role, lossOverride ?? (loss || undefined), tr ? 'tr' : 'en', mode, scopedDoc?.id);
    setQ('');
    setLoss('');
    setShowDate(false);
    setErr(false);
    // Yanıtın kaynağı yoksa önceki kaynak açık kalır
    if (a.cites.length) setPick({ answerId: a.id, i: 0 });
    const say = (x: AnswerData) => setAnnounce(x.kind === 'found' ? t('ans.ready', { n: x.cites.length }) : t('ans.ready.none'));
    if (a.pending) {
      setAnnounce(t('ai.pending', { n: a.cites.length }));
      done.then((x) => {
        say(x);
        // Model yanıtı gelince ilk kaynağı açılır (kaynak yoksa önceki açık kalır)
        setPick((p) => (x.cites.length ? { answerId: x.id, i: 0 } : p?.answerId === x.id ? null : p));
        if (phone) reveal.current = x.id;
      });
    } else say(a);
    if (id !== conv?.id) go('ask', id);
    // Yalnızca konuşma alanı kayar (scrollIntoView bütün sayfayı da kaydırıyordu)
    requestAnimationFrame(() => {
      const box = thread.current;
      const el = box?.querySelector<HTMLElement>(`[data-answer="${a.id}"]`);
      if (!box || !el) return;
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (phone) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: smooth ? 'smooth' : 'auto' });
      else box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: smooth ? 'smooth' : 'auto' });
    });
  };

  // Rehberdeki "… olarak sor" düğmesi: soru bir kez sorulur (açılışta ya da ekran zaten açıksa olayla)
  useEffect(() => {
    const take = () => {
      let x: { q: string; loss?: string } | null = null;
      try {
        x = JSON.parse(sessionStorage.getItem(TRY_KEY) || 'null');
        sessionStorage.removeItem(TRY_KEY);
      } catch {
        x = null;
      }
      if (x?.q) run(x.q, x.loss);
    };
    take();
    window.addEventListener('tolka:try', take);
    return () => window.removeEventListener('tolka:try', take);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(q);
  };
  // Enter sorar, Shift+Enter yeni satır. Kısayol çalışır ama ekranda yazılmaz (kullanıcı kuralı)
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      run(q);
    }
  };

  const choose = (p: Pick) => {
    setPick(p);
    if (phone) setSheet(true);
  };

  const picked = pick ? items.find((a) => a.id === pick.answerId) : undefined;
  const cite = picked?.cites[pick!.i];
  const passage = cite ? passageOf(cite) : undefined;
  const inQuestion = !loss && findDate(q);

  const composer = (
    <form className="composer" onSubmit={submit} noValidate data-opts={opts || !!loss ? '1' : undefined}>
      <label htmlFor="ask-q" className="composer-l">{t('ask.label')}</label>
      {err && <p className="field-err" id="ask-err">{t('ask.empty')}</p>}
      {scopedDoc && (
        <div className="scope" role="group" aria-label={t('scope.label')}>
          <span className="scope-t"><b>{t('scope.only', { title: scopedDoc.title })}</b>{scopeNote ? ` · ${scopeNote}` : ''}</span>
          <button type="button" className="linkish" onClick={() => setScope(null)}>{t('scope.clear')}</button>
        </div>
      )}
      <div className="composer-box">
        <textarea id="ask-q" ref={box} rows={2} value={q} placeholder={t('ask.ph')}
          onChange={(e) => { setQ(e.target.value); if (err) setErr(false); }} onKeyDown={onKey}
          aria-describedby={['ask-hint', err ? 'ask-err' : ''].filter(Boolean).join(' ')} aria-invalid={err} />
        <button type="submit" className="btn primary">{t('ask.submit')}</button>
      </div>
      <button type="button" className="linkish opts-toggle" aria-expanded={opts || !!loss} aria-controls="ask-opts" onClick={() => setOpts((o) => !o)}>
        {t('ask.opts')}{mode === 'search' ? ` · ${t('mode.searchOnly')}` : ''}{loss ? ` · ${date(loss)}` : ''}
      </button>
      <div className="composer-row" id="ask-opts">
        <div className="mode">
          <span className="mode-k" id="mode-k">{t('mode.label')}</span>
          <div className="seg" role="group" aria-labelledby="mode-k">
            <button type="button" aria-pressed={mode === 'ai'} onClick={() => setMode('ai')}>{t('mode.ai')}</button>
            <button type="button" aria-pressed={mode === 'search'} onClick={() => setMode('search')}>{t('mode.searchOnly')}</button>
          </div>
        </div>
        {showDate || loss ? (
          <div className="loss">
            <label htmlFor="ask-loss">{t('ask.date')}</label>
            <input id="ask-loss" type="date" className="input" value={loss} onChange={(e) => setLoss(e.target.value)} aria-describedby="ask-loss-h" />
            <span className="small" id="ask-loss-h">{t('ask.date.hint')}</span>
            <button type="button" className="linkish" onClick={() => { setLoss(''); setShowDate(false); }}>{t('ask.date.remove')}</button>
          </div>
        ) : (
          <button type="button" className="linkish" onClick={() => setShowDate(true)}>{t('ask.date.add')}</button>
        )}
        {inQuestion && <span className="chip">{t('ask.lossDate', { date: date(inQuestion) })}</span>}
      </div>
      <p className="small" id="ask-hint">{t('ask.hint')}</p>
    </form>
  );

  return (
    <div className={`ask${pick ? ' has-src' : ''}`}>
      <section className="convo" aria-label={t('nav.ask')}>
        <header className="convo-head">
          {conv ? <h1 className="convo-title">{conv.title}</h1> : <h1 className="convo-title">{t('ask.title')}</h1>}
          {conv && <a className="btn" href={href('ask')}>{t('ask.new')}</a>}
        </header>

        <div className="thread" ref={thread}>
          {!conv ? (
            <div className="start">
              <p className="start-lead">{t('ask.lead')}</p>
              <div className="start-who">
                <p>{t('start.who', { name: currentAccount()?.name ?? '', job: t(`job.${role}` as const).toLocaleLowerCase(tr ? 'tr' : 'en') })}</p>
                <button type="button" className="linkish" onClick={switchAccount}>{t('start.switch')}</button>
              </div>
              <section className="start-own" aria-labelledby="own-h">
                <div>
                  <h2 id="own-h">{t('own.title')}</h2>
                  <p>{t('own.text')}</p>
                </div>
                <button type="button" className="btn" onClick={() => setAdding(true)}>{t('own.add')}</button>
              </section>
              <h2 className="start-h">{t('start.try')}</h2>
              <div className="start-group">
                <h3>{t('start.role', { role: t(`job.${role}` as const) })}</h3>
                <ul>
                  <li><button type="button" className="suggest" onClick={() => run(tr ? ROLE_SUGGEST[role].tr : ROLE_SUGGEST[role].en)}>{tr ? ROLE_SUGGEST[role].tr : ROLE_SUGGEST[role].en}</button></li>
                </ul>
              </div>
              {(['start.cover', 'start.limits', 'start.process'] as const).map((g) => (
                <div key={g} className="start-group">
                  <h3>{t(g)}</h3>
                  <ul>
                    {SUGGEST.filter((s) => s.group === g).map((s) => (
                      <li key={s.en}><button type="button" className="suggest" onClick={() => run(tr ? s.tr : s.en)}>{tr ? s.tr : s.en}</button></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            items.map((a: AnswerData) => (
              <AnswerView key={a.id} a={a} convId={conv.id} pick={pick} onPick={choose} onAnnounce={setAnnounce} />
            ))
          )}
        </div>
        {composer}
      </section>

      {/* Kaynak: belge, işaretli yeriyle. Telefonda tam ekran açılır */}
      <aside className={`src${sheet ? ' open' : ''}`} aria-label={t('src.title')}>
        {cite && passage ? (
          <>
            <header className="src-head">
              {phone ? (
                <button type="button" className="back" onClick={() => setSheet(false)}>‹ {t('src.back')}</button>
              ) : (
                <button type="button" className="x" onClick={() => setPick(null)}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
                  <span className="sr-only">{t('src.close')}</span>
                </button>
              )}
              <div className="src-title">
                <h2>{passage.doc.title}</h2>
                <ClassLabel c={passage.doc.classification} />
              </div>
              <a className="src-open" href={href('documents', passage.doc.id, 'view', cite.loc.clause)}>{t('src.open')}</a>
              <p className="src-facts">
                <span>{passage.doc.version}</span>
                <span>{t('src.inforce', { date: date(passage.doc.inForce) })}</span>
                <span>{t('src.owner', { name: passage.doc.owner.name })}</span>
                {review(passage.doc).state === 'overdue' ? (
                  <Status kind="warn">{t('ans.overdue', { date: date(passage.doc.reviewDue) })}</Status>
                ) : !passage.doc.supersededBy ? (
                  <span>{t('src.review', { date: date(passage.doc.reviewDue) })}</span>
                ) : null}
              </p>
            </header>
            <div className="doc-scroll" tabIndex={0} role="region" aria-label={passage.doc.title}>
              {/* Telefonda panel açılınca yeniden çizilir: işaretli yere ancak görünürken kaydırılabilir */}
              <DocView key={phone ? String(sheet) : 'pane'} doc={docById(passage.doc.id)!} hl={cite.loc} n={pick!.i + 1} />
            </div>
          </>
        ) : (
          <div className="src-empty">
            <div className="src-demo" aria-hidden="true">
              <span className="sd-line" />
              <span className="sd-line" />
              <span className="sd-line sd-short" />
              <span className="sd-row"><span className="sd-n">1</span><span className="sd-line sd-mark" /></span>
              <span className="sd-line" />
              <span className="sd-line sd-short" />
            </div>
            <h2>{t('src.empty.title')}</h2>
            <p>{t('src.empty.text')}</p>
          </div>
        )}
      </aside>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      <AddDocument open={adding} quick onClose={() => setAdding(false)} onAdded={(id, title) => {
        setAdding(false);
        setScope(id);
        setAnnounce(t('add.added', { title }));
        requestAnimationFrame(() => box.current?.focus());
      }} />
    </div>
  );
}
