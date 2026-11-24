import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DocView } from '../../components/DocView';
import { ClassLabel, Status } from '../../components/Labels';
import { canOpen, docById, review, versions } from '../../data/library';
import type { Doc } from '../../data/types';
import { compareDocs, type ClauseDiff } from '../../lib/diff';
import { date } from '../../lib/format';
import { t } from '../../lib/i18n';
import { currentRole } from '../../lib/role';
import { href } from '../../lib/router';

/** Belgenin tamamı: içindekiler, belgede arama ve (varsa) önceki sürümle kelime kelime karşılaştırma */
export function Viewer({ doc, focus }: { doc: Doc; focus?: string }) {
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(0);
  const [total, setTotal] = useState(0);
  const [compare, setCompare] = useState(false);
  const [all, setAll] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const role = currentRole();
  const vs = versions(doc).filter((v) => canOpen(v, role));
  const older = doc.supersedes ? docById(doc.supersedes) : undefined;
  const canCompare = !!older && canOpen(older, role) && older.sections.length > 0;
  const rv = review(doc);
  const find = q.trim().length >= 2 ? q.trim() : '';

  useEffect(() => titleRef.current?.focus({ preventScroll: true }), [doc.id]);
  useEffect(() => { setCompare(false); setQ(''); }, [doc.id]);

  // Arama sonuçları sayılır; geçerli sonuç vurgulanır ve görünür alana kaydırılır
  useLayoutEffect(() => {
    const marks = [...(scroll.current?.querySelectorAll<HTMLElement>('mark.find') ?? [])];
    setTotal(marks.length);
    const i = Math.min(cur, Math.max(0, marks.length - 1));
    marks.forEach((m, k) => m.classList.toggle('cur', k === i));
    const el = marks[i];
    const box = scroll.current;
    if (el && box) {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (r.top < b.top + 40 || r.bottom > b.bottom - 40) box.scrollTo({ top: box.scrollTop + r.top - b.top - b.height / 3 });
    }
  }, [find, cur, compare, doc.id]);

  const step = (d: number) => total && setCur((c) => (c + d + total) % total);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter sonraki sonuca, Shift+Enter öncekine gider (ekranda yazılmaz)
    if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
  };

  const contents = doc.sections.length > 0 && (
    <ol className="vw-toc-list">
      {doc.sections.map((s) => (
        <li key={s.n}>
          <a href={href('documents', doc.id, 'view', s.n)} aria-current={focus === s.n ? 'location' : undefined}>
            <span className="tn">{s.n}</span>
            <span className="tt">{s.title}</span>
            <span className="tp">{t('d.page', { n: s.page })}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="viewer">
      <header className="vw-head">
        <a className="vw-back" href={href('documents', doc.id)}>‹ {t('vw.back')}</a>
        <div className="vw-title">
          <h1 ref={titleRef} tabIndex={-1}>{doc.title}</h1>
          <ClassLabel c={doc.classification} />
        </div>
        <p className="vw-facts">
          <span>{t(`kind.${doc.kind}` as const)} · {doc.version}</span>
          <span>{t('src.inforce', { date: date(doc.inForce) })}</span>
          <span>{t('src.owner', { name: doc.owner.name })}</span>
          {rv.state === 'overdue' ? <Status kind="warn">{t('ans.overdue', { date: date(doc.reviewDue) })}</Status> : rv.state !== 'superseded' ? <span>{t('src.review', { date: date(doc.reviewDue) })}</span> : null}
        </p>
        {doc.sections.length > 0 && (
          <div className="vw-tools">
            <div className="vw-find">
              <label className="sr-only" htmlFor="vw-q">{t('vw.find')}</label>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" /><path d="M12.5 12.5l4 4" strokeLinecap="round" /></svg>
              <input id="vw-q" type="search" value={q} placeholder={t('vw.find.ph')} autoComplete="off"
                onChange={(e) => { setQ(e.target.value); setCur(0); }} onKeyDown={onKey} aria-describedby="vw-count" />
              <span id="vw-count" className="vw-count" aria-live="polite">
                {find ? (total ? t('vw.count', { i: Math.min(cur, total - 1) + 1, n: total }) : t('vw.none')) : ''}
              </span>
              <button type="button" className="vw-step" onClick={() => step(-1)} disabled={!total} aria-label={t('vw.prev')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" className="vw-step" onClick={() => step(1)} disabled={!total} aria-label={t('vw.next')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            {vs.length > 1 && (
              <div className="vw-ver">
                <span className="small" id="vw-ver-k">{t('vw.version')}</span>
                <div className="seg" role="group" aria-labelledby="vw-ver-k">
                  {vs.map((v) => (
                    <a key={v.id} className="seg-a" href={href('documents', v.id, 'view')} aria-current={v.id === doc.id ? 'page' : undefined}>{v.version}</a>
                  ))}
                </div>
              </div>
            )}
            {canCompare && (
              <button type="button" className="btn" aria-pressed={compare} onClick={() => setCompare((c) => !c)}>
                {t('vw.compare', { v: older!.version })}
              </button>
            )}
          </div>
        )}
      </header>

      <div className="vw-body">
        {contents && (
          <nav className="vw-toc" aria-label={t('d.contents')}>
            <h2>{t('d.contents')}</h2>
            {contents}
          </nav>
        )}
        <div className="doc-scroll" ref={scroll} tabIndex={0} role="region" aria-label={doc.title}>
          {doc.sections.length === 0 ? (
            <div className="msg"><h3>{t('vw.unavailable')}</h3></div>
          ) : compare && older ? (
            <Compare older={older} newer={doc} all={all} setAll={setAll} find={find} />
          ) : (
            <>
              {contents && (
                <details className="vw-toc-phone">
                  <summary>{t('d.contents')}</summary>
                  {contents}
                </details>
              )}
              <DocView doc={doc} find={find} focus={focus} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Compare({ older, newer, all, setAll, find }: { older: Doc; newer: Doc; all: boolean; setAll: (b: boolean) => void; find: string }) {
  const diffs = compareDocs(older, newer);
  const changed = diffs.filter((d) => d.state !== 'same');
  const shown = all ? diffs : changed;
  const bySection = new Map<string, ClauseDiff[]>();
  for (const d of shown) bySection.set(d.section, [...(bySection.get(d.section) ?? []), d]);
  const withFind = (s: string) => {
    if (!find) return s;
    const esc = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return s.split(new RegExp(`(${esc})`, 'gi')).map((p, i) => (i % 2 ? <mark key={i} className="find">{p}</mark> : <Fragment key={i}>{p}</Fragment>));
  };
  return (
    <article className="pg cmp" lang="en">
      <div className="cmp-sum" lang={undefined}>
        <p>{t('vw.cmp.summary', { n: changed.length, a: older.version, b: newer.version })}</p>
        <button type="button" className="linkish" onClick={() => setAll(!all)}>{all ? t('vw.cmp.hide') : t('vw.cmp.show')}</button>
        {!all && <span className="small">{t('vw.cmp.unchanged', { n: diffs.length - changed.length })}</span>}
      </div>
      {[...bySection].map(([sec, list]) => (
        <section key={sec} className="pg-sec">
          <h3><span className="n">{sec}</span><span>{list[0].title}</span></h3>
          {list.map((d) => (
            <div key={d.n} className={`cl ${d.state}`}>
              <span className="n">{d.n}</span>
              <div className="cl-body">
                {d.state === 'added' && <p className="small">{t('vw.new')}</p>}
                {d.state === 'removed' && <p className="small">{t('vw.gone')}</p>}
                <p className="cmp-text">
                  {d.pieces.map((p, i) =>
                    p.t === 'same' ? <Fragment key={i}>{withFind(p.s)}</Fragment>
                    : p.t === 'add' ? <ins key={i}><span className="sr-only">[{t('vw.added')}] </span>{withFind(p.s)}</ins>
                    : <del key={i}><span className="sr-only">[{t('vw.removed')}] </span>{p.s}</del>
                  )}
                </p>
              </div>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
