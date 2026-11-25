import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ClassLabel, Status } from '../../components/Labels';
import { DocText } from '../../components/Text';
import { ROLE_GRADE, answerLevel, passageOf, type AnswerData, type Cite, type Trace } from '../../data/answer';
import { markHandoff } from '../../data/conversations';
import { docById, review } from '../../data/library';
import { turkishDoc } from '../../lib/search';
import { streamView, useStream } from '../../lib/stream';
import { date } from '../../lib/format';
import { getLang, t } from '../../lib/i18n';
import { currentRole } from '../../lib/role';
import type { Key } from '../../lib/strings';
import type { Pick } from './Ask';

const time = (iso: string) => new Date(iso).toLocaleTimeString(getLang() === 'tr' ? 'tr-TR' : 'en-IE', { hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => date(iso.slice(0, 10));
const FALLBACK: Record<string, Key> = { quota: 'fb.quota', rate: 'fb.rate', offline: 'fb.offline', access: 'fb.access' };

const Ok = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Lens = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="5" />
    <path d="M12.5 12.5l4 4" strokeLinecap="round" />
  </svg>
);

export function AnswerView({ a, convId, pick, onPick, onAnnounce }: {
  a: AnswerData; convId: string; pick: Pick | null; onPick: (p: Pick) => void; onAnnounce: (s: string) => void;
}) {
  const streaming = useStream(a.id);
  const level = answerLevel(a);
  const sources = [...new Set(a.cites.map((c) => c.docId))];
  const wording = a.wording ? docById(a.wording.docId) : undefined;
  const notSearched = a.notSearched.map((n) => `${docById(n.docId)?.title ?? n.docId} (${t(n.why === 'failed' ? 'ans.failed' : 'ans.processing')})`);
  const turkish = /[çğıöşü]/i.test(a.q) && a.cites.some((c) => { const d = docById(c.docId); return !!d && !turkishDoc(d); });
  const on = (i: number) => pick?.answerId === a.id && pick.i === i;
  const show = (i: number) => onPick({ answerId: a.id, i });

  // Önizleme fişi (Wikipedia sayfa önizlemelerinden): fareyle numaranın üstüne gelince ya da klavyeyle odaklanınca
  // ilgili bölüm küçük bir kâğıt fişte görünür; tıklamak yine belgeyi açar. Dokunmatik ekranda açılmaz.
  // Fişin üstüne geçince açık kalır, Esc ve kaydırma kapatır (WCAG 1.4.13).
  const [peek, setPeek] = useState<{ i: number; left: number; top: number; up: boolean } | null>(null);
  const shut = useRef(0);
  const peekId = `peek-${a.id}`;
  const keep = () => window.clearTimeout(shut.current);
  const hover: Hover = {
    enter: (i, el, focus) => {
      if (focus && !el.matches(':focus-visible')) return;
      keep();
      const r = el.getBoundingClientRect();
      const w = Math.min(380, innerWidth - 24);
      const up = r.bottom + 250 > innerHeight;
      setPeek({ i, left: Math.max(12, Math.min(r.left - 24, innerWidth - w - 12)), top: up ? r.top - 10 : r.bottom + 10, up });
    },
    leave: () => {
      keep();
      shut.current = window.setTimeout(() => setPeek(null), 160);
    },
    close: () => {
      keep();
      setPeek(null);
    },
    desc: (i) => (peek?.i === i ? peekId : undefined)
  };
  useEffect(() => {
    if (!peek) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPeek(null); };
    const away = () => setPeek(null);
    window.addEventListener('keydown', key);
    window.addEventListener('scroll', away, true);
    window.addEventListener('resize', away);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('scroll', away, true);
      window.removeEventListener('resize', away);
    };
  }, [peek]);
  useEffect(() => () => window.clearTimeout(shut.current), []);
  const peekCard = (() => {
    if (!peek) return null;
    const p = passageOf(a.cites[peek.i]);
    if (!p) return null;
    return createPortal(
      <div className={`peek${peek.up ? ' up' : ''}`} role="tooltip" id={peekId} style={{ left: peek.left, top: peek.top }}
        onPointerEnter={keep} onPointerLeave={hover.leave}>
        <span className="peek-doc">
          <span className="cite sm" aria-hidden="true">{peek.i + 1}</span>
          <span>{p.doc.title} {p.doc.version} · {t('ans.clause', { n: p.ref })}</span>
        </span>
        <p className="peek-q" lang={turkishDoc(p.doc) ? 'tr' : 'en'}><mark>{clip(p.text, 260)}</mark></p>
        <span className="peek-hint">{t('peek.open')}</span>
      </div>,
      document.body
    );
  })();

  const copy = async () => {
    const lines = [a.q, ''];
    if (a.ai) lines.push(a.ai.text, '');
    a.cites.forEach((c, i) => {
      const p = passageOf(c);
      if (p) lines.push(`[${i + 1}] ${p.doc.title} ${p.doc.version}, ${t('ans.page', { n: p.section.page })}, ${t('ans.clause', { n: p.ref })}`, `    “${p.text}”`);
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      onAnnounce(t('ans.copied'));
    } catch {
      /* pano izni yoksa sessizce geçilir */
    }
  };

  // Model yazarken: ne yapıldığı yazar ve modelin gerçekten yazdığı metin geldikçe görünür (sahte yazma gösterisi yok).
  // Kaynak numaraları ve alıntılar yanıt bitip denetlenince eklenir. Yarım metin ekran okuyucuya okunmaz; bitince duyurulur.
  if (a.pending) {
    const view = streamView(streaming);
    const papers = a.cites.map(passageOf).filter((p): p is NonNullable<typeof p> => !!p);
    return (
      <article className="qa" data-answer={a.id} aria-busy="true">
        <Question a={a} />
        <div className="pending" role="status">
          <p className="sr-only">{a.cites.length ? t('ai.pending', { n: a.cites.length }) : t('ai.searching')}</p>
          {a.trace ? <TraceList tr={a.trace} live /> : <p aria-hidden="true">{t('ai.searching')}</p>}
        </div>
        {/* Kaynak kâğıtları (Perplexity'den): yanıt yazılmadan önce nereden geleceği görünür */}
        {papers.length > 0 && (
          <ul className="papers" aria-hidden="true">
            {papers.map((p, i) => (
              <li key={p.key} style={{ '--i': i } as CSSProperties}>
                <span className="paper-doc">{p.doc.title}</span>
                <span className="paper-ref">{t('ans.clause', { n: p.ref })}</span>
                <span className="paper-text" lang={turkishDoc(p.doc) ? 'tr' : 'en'}>{clip(p.text, 110)}</span>
              </li>
            ))}
          </ul>
        )}
        {view && (
          <div className="ai-text streaming" aria-hidden="true">
            <p>{view}<span className="caret" /></p>
          </div>
        )}
      </article>
    );
  }

  const byline = (
    <div className="byline">
      {level && (
        <div className="row">
          <ClassLabel c={level.level} />
          <span>{sources.length > 1 ? t('ans.level', { n: sources.length, doc: level.from.title }) : t('ans.level.one', { doc: level.from.title })}</span>
        </div>
      )}
      {a.ai ? (
        <div className="row ok">
          <Ok />
          <span>
            {t('ai.by', { model: a.ai.model, n: a.ai.sent })}{' '}
            {a.ai.dropped ? t('ai.quotes.dropped', { n: a.ai.dropped }) : a.ai.quotes.length ? t('ai.quotes.ok') : ''}
          </span>
        </div>
      ) : null}
      {a.ai && a.trace?.chosen !== undefined ? (
        <details className="how">
          <summary>{t('tr.how')}</summary>
          <TraceList tr={a.trace} quotes={{ ok: a.ai.quotes.length, all: a.ai.quotes.length + a.ai.dropped }} />
        </details>
      ) : null}
      {a.ai ? null : (
        <div className="row">
          <Lens />
          <span>
            {a.fallback ? t(FALLBACK[a.fallback] ?? 'fb.busy') + ' ' : ''}
            {t('mode.search')}
            {turkish ? ' ' + t('mode.search.tr') : ''}
          </span>
        </div>
      )}
    </div>
  );

  // Yanıtın altındaki notlar: hangi sürüm, hangi satır, aranmayan belgeler
  const notes = [
    a.ai?.verdict === 'partial' && t('ai.partial'),
    wording && a.lossDate && t('ans.wording.date', { v: wording.version, loss: date(a.lossDate) }),
    wording && !a.lossDate && wording.supersedes && t('ans.wording.today', { v: wording.version, date: date(wording.inForce) }),
    a.cites.some((c) => c.loc.row !== undefined) && ROLE_GRADE[currentRole()] && t('ans.grade', { grade: ROLE_GRADE[currentRole()]! }),
    notSearched.length > 0 && t('ans.notSearched', { list: notSearched.join(', ') }),
    a.ai?.cached && t('ai.cached')
  ].filter(Boolean) as string[];
  const noteList = notes.length > 0 && (
    <ul className="notes">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
  );

  if (a.kind === 'none') {
    return (
      <article className="qa" data-answer={a.id}>
        <Question a={a} />
        <div className="none">
          <h2>{t('ans.none.title')}</h2>
          {a.ai && <p className="ai-none">{a.ai.text}</p>}
          <p>{t('ans.none.text')}</p>
          <Handoff a={a} convId={convId} primary />
          {a.ai && <p className="small none-by">{t('ai.by', { model: a.ai.model, n: a.ai.sent })}</p>}
          {a.fallback && <p className="small none-by">{t(FALLBACK[a.fallback] ?? 'fb.busy')}</p>}
          {a.trace?.chosen !== undefined && (
            <details className="how none-how">
              <summary>{t('tr.how')}</summary>
              <TraceList tr={a.trace} />
            </details>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="qa" data-answer={a.id}>
      <Question a={a} />
      <div className="ans">
        {byline}
        {a.ai ? (
          <>
            {/* Asistanın sözü: düz yazı, her iddiada kaynak numarası */}
            <div className="ai-text">
              {a.ai.text.split(/\n{2,}/).map((para, pi) => (
                <p key={pi}>{withCites(para, a.cites, on, show, hover)}</p>
              ))}
            </div>
            {/* Belgenin sözü: birebir doğrulanmış alıntılar, serif */}
            {a.ai.quotes.length > 0 && (
              <>
                <h3 className="sr-only">{t('ai.quotes')}</h3>
                {a.ai.quotes.map((qt, k) => {
                  const p = passageOf(a.cites[qt.i]);
                  return (
                    <figure key={k} className="aiq">
                      <blockquote className="quote" lang={p && turkishDoc(p.doc) ? 'tr' : 'en'}>{qt.text}</blockquote>
                      {p && (
                        <figcaption>
                          <button type="button" className="cite sm" aria-pressed={on(qt.i)} onClick={() => show(qt.i)} aria-label={`${qt.i + 1}: ${p.doc.title} ${p.doc.version}, ${t('ans.clause', { n: p.ref })}`}>{qt.i + 1}</button>
                          {p.doc.title} {p.doc.version} · {t('ans.page', { n: p.section.page })} · {t('ans.clause', { n: p.ref })}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </>
            )}
            <h3 className="srcs-h">{t('ai.sources')}</h3>
            <ol className="srcs">
              {a.cites.map((c, i) => {
                const p = passageOf(c);
                if (!p) return null;
                return (
                  <li key={c.key}>
                    <button type="button" className={`src-row${on(i) ? ' on' : ''}`} aria-pressed={on(i)} onClick={() => show(i)}>
                      <span className="cite" aria-hidden="true">{i + 1}</span>
                      <span className="src-row-t">
                        <span className="qdoc">{p.doc.title} {p.doc.version}</span>
                        <span>{t('ans.page', { n: p.section.page })} · {t('ans.clause', { n: p.ref })}</span>
                        {review(p.doc).state === 'overdue' && <Status kind="warn">{t('ans.overdue', { date: date(p.doc.reviewDue) })}</Status>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <>
            <h2 className="sr-only">{t('ans.sources')}</h2>
            <ol className="quotes">
              {a.cites.map((c, i) => {
                const p = passageOf(c);
                if (!p) return null;
                const rv = review(p.doc);
                return (
                  <li key={c.key} className={`qcard${on(i) ? ' on' : ''}`}>
                    <button type="button" className="cite" aria-pressed={on(i)} onClick={() => show(i)}
                      aria-label={`${i + 1}: ${p.doc.title} ${p.doc.version}, ${t('ans.clause', { n: p.ref })}`}>
                      {i + 1}
                    </button>
                    <div className="qbody">
                      <p className="qmeta">
                        <span className="qdoc">{p.doc.title} {p.doc.version}</span>
                        <span>{t('ans.page', { n: p.section.page })} · {t('ans.clause', { n: p.ref })}</span>
                      </p>
                      {rv.state === 'overdue' && <Status kind="warn">{t('ans.overdue', { date: date(p.doc.reviewDue) })}</Status>}
                      <blockquote className="quote" lang={turkishDoc(p.doc) ? 'tr' : 'en'}><DocText text={p.quote} matched={c.matched} /></blockquote>
                      <button type="button" className="linkish show" onClick={() => show(i)} aria-pressed={on(i)}>
                        {on(i) ? t('ans.showing') : t('ans.show')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
        {noteList}
        <div className="acts">
          <button type="button" className="btn" onClick={copy}>{t('ans.copy')}</button>
          <Handoff a={a} convId={convId} />
        </div>
      </div>
      {peekCard}
    </article>
  );
}

type Hover = {
  enter: (i: number, el: HTMLElement, focus: boolean) => void;
  leave: () => void;
  close: () => void;
  desc: (i: number) => string | undefined;
};

/** Metni kelime sınırında kısaltır */
const clip = (s: string, n: number) => {
  if (s.length <= n) return s;
  const cut = s.lastIndexOf(' ', n);
  return s.slice(0, cut > n * 0.6 ? cut : n).replace(/[\s,;:.]+$/, '') + '…';
};

/** Arama izi: her satır bu soruda gerçekten yapılan iştir; yazarken canlı, sonra "Bu yanıt nasıl bulundu" altında */
function TraceList({ tr, live = false, quotes }: { tr: Trace; live?: boolean; quotes?: { ok: number; all: number } }) {
  const matched = tr.chosen !== undefined;
  return (
    <ol className={`trace${live ? ' live' : ''}`} aria-hidden={live ? 'true' : undefined}>
      <li className="done">{t('tr.scan', { docs: tr.docs, passages: tr.passages })}</li>
      <li className={matched ? 'done' : 'now'}>
        {!matched ? t('tr.finding') : tr.meaning === null ? t('tr.found.nomean', { words: tr.words ?? 0 }) : t('tr.found', { words: tr.words ?? 0, meaning: tr.meaning ?? 0 })}
      </li>
      {matched && <li className="done">{t('tr.chosen', { n: tr.chosen ?? 0 })}</li>}
      {matched && live && <li className="now">{t('tr.write')}</li>}
      {quotes && quotes.all > 0 && <li className="done">{t('tr.quotes', quotes)}</li>}
    </ol>
  );
}

/** Yanıt metnindeki [1], [1, 2] işaretleri tıklanabilir kaynak numarasına dönüşür */
// Kaynak numaraları önceki kelimeye ve ardından gelen noktalamaya yapışık kalır; nokta satır başına düşmez
function withCites(text: string, cites: Cite[], on: (i: number) => boolean, show: (i: number) => void, hover?: Hover) {
  const parts = text.split(/((?:\s*\[\d+(?:\s*,\s*\d+)*\])+)/g);
  const out: ReactNode[] = [];
  let skip = 0;
  for (let k = 0; k < parts.length; k += 2) {
    let txt = parts[k].slice(skip);
    skip = 0;
    const group = parts[k + 1];
    if (group === undefined) {
      out.push(<Fragment key={k}>{txt}</Fragment>);
      break;
    }
    const tail = /\S+$/.exec(txt)?.[0] ?? '';
    txt = txt.slice(0, txt.length - tail.length);
    const punct = /^[.,;:!?)’”]+/.exec(parts[k + 2] ?? '')?.[0] ?? '';
    skip = punct.length;
    const nums = [...group.matchAll(/\d+/g)].map((m) => +m[0] - 1).filter((i) => i >= 0 && i < cites.length);
    out.push(
      <Fragment key={k}>
        {txt}
        <span className="cite-glue">
          {tail}{tail && /^\s/.test(group) ? ' ' : ''}
          {nums.map((i) => {
            const p = passageOf(cites[i]);
            return (
              <button key={i} type="button" className="cite in" aria-pressed={on(i)}
                onClick={() => { hover?.close(); show(i); }}
                onPointerEnter={hover ? (e) => { if (e.pointerType === 'mouse') hover.enter(i, e.currentTarget, false); } : undefined}
                onPointerLeave={hover?.leave}
                onFocus={hover ? (e) => hover.enter(i, e.currentTarget, true) : undefined}
                onBlur={hover?.close}
                aria-describedby={hover?.desc(i)}
                aria-label={p ? `${i + 1}: ${p.doc.title} ${p.doc.version}, ${t('ans.clause', { n: p.ref })}` : String(i + 1)}>
                {i + 1}
              </button>
            );
          })}
          {punct}
        </span>
      </Fragment>
    );
  }
  return out;
}

function Question({ a }: { a: AnswerData }) {
  return (
    <div className="q">
      <div className="by">{t('ask.you')} · {time(a.askedAt)}{a.lossDate ? ` · ${t('ask.lossDate', { date: date(a.lossDate) })}` : ''}</div>
      <p>{a.q}</p>
    </div>
  );
}

/** Belgelerde yanıt yoksa ya da bölümler yanıtlamıyorsa soru bilgi yönetimine aktarılır */
function Handoff({ a, convId, primary = false }: { a: AnswerData; convId: string; primary?: boolean }) {
  if (a.handoff) return <p className="sent" role="status">{t('ans.sent', { date: day(a.handoff.at), time: time(a.handoff.at) })}</p>;
  return (
    <button type="button" className={`btn${primary ? ' primary' : ''}`} onClick={() => markHandoff(convId, a.id)}>
      {primary ? t('ans.send') : t('ans.handoff')}
    </button>
  );
}
