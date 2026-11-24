import { useEffect, useRef, useState } from 'react';
import { ClassLabel } from '../../components/Labels';
import { liveStatus } from '../../data/processing';
import { canOpen, docById, passages, review, versions } from '../../data/library';
import { removeUpload, savedThisSessionOnly } from '../../data/uploads';
import type { Doc, RoleId } from '../../data/types';
import { date, span } from '../../lib/format';
import { t } from '../../lib/i18n';
import { currentRole } from '../../lib/role';
import { go, href } from '../../lib/router';
import { setScope } from '../../lib/scope';
import { StatusCell } from './Documents';

const ROLES: RoleId[] = ['care', 'claims', 'siu', 'knowledge'];
const FAIL = {
  scan: ['d.failed.title', 'd.failed.text'],
  password: ['d.password.title', 'd.password.text'],
  unreadable: ['d.unreadable.title', 'd.unreadable.text'],
  empty: ['d.empty.title', 'd.empty.text']
} as const;
const roleName = (r: RoleId) => (r === 'claims' ? t('roles.claims') : t(`role.${r}` as const));

/** Belgenin kartı (Guru'dan: sorumlu ve gözden geçirme tarihi her zaman görünür) */
export function Detail({ doc, onClose, phone = false }: { doc: Doc; onClose: () => void; phone?: boolean }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const s = liveStatus(doc);
  const r = review(doc);
  const all = versions(doc).filter((v) => canOpen(v, currentRole()));

  // Açılınca başlığa odaklanılır; Esc paneli kapatır
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [doc.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Belge ekleme penceresi açıksa Esc yalnızca onu kapatır
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('dialog[open]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const next = doc.supersededBy ? docById(doc.supersededBy) : undefined;

  return (
    <aside className={`detail${phone ? ' phone' : ''}`} aria-labelledby="detail-title">
      <div className="detail-top">
        {phone ? (
          <a className="back" href={href('documents')}>‹ {t('d.back')}</a>
        ) : (
          <button type="button" className="x" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
            <span className="sr-only">{t('d.close')}</span>
          </button>
        )}
      </div>

      <div className="detail-body">
        <p className="kind">{t(`kind.${doc.kind}` as const)} · {doc.version}</p>
        <h2 id="detail-title" ref={titleRef} tabIndex={-1}>{doc.title}</h2>
        <div className="detail-tags">
          <ClassLabel c={doc.classification} />
          <StatusCell d={doc} />
        </div>
        {doc.sections.length > 0 && s.status === 'ready' && (
          <div className="detail-acts">
            <a className="btn primary detail-open" href={href('documents', doc.id, 'view')}>{t('d.open')}</a>
            <button type="button" className="btn detail-ask" onClick={() => { setScope(doc.id); go('ask'); }}>{t('d.askOnly')}</button>
          </div>
        )}

        {/* Durum mesajları: ne oldu, ne yapılmalı (GOV.UK dili) */}
        {s.status === 'failed' && (
          <div className="msg err">
            <h3>{t(FAIL[doc.failReason ?? 'scan'][0])}</h3>
            <p>{t(FAIL[doc.failReason ?? 'scan'][1], { owner: doc.owner.name })}</p>
          </div>
        )}
        {s.status === 'processing' && (
          <div className="msg">
            <h3>{t('d.processing.title')}</h3>
            <p>{t('d.processing.text')}</p>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.pages} aria-valuenow={s.page} aria-label={t('st.reading', { p: s.page, n: s.pages })}>
              <i style={{ width: `${(s.page / s.pages) * 100}%` }} />
            </div>
            <p className="small">{t('st.reading', { p: s.page, n: s.pages })}</p>
          </div>
        )}
        {r.state === 'overdue' && s.status !== 'failed' && (
          <div className="msg warn">
            <h3>{t('d.overdue.title')}</h3>
            <p>{t('d.overdue.text', { date: date(doc.reviewDue) })}</p>
          </div>
        )}
        {r.state === 'soon' && (
          <div className="msg">
            <h3>{t('d.soon.title', { n: r.days })}</h3>
            <p>{t('d.soon.text', { date: date(doc.reviewDue) })}</p>
          </div>
        )}
        {next && (
          <div className="msg">
            <h3>{t('d.earlier.title')}</h3>
            <p>{t('d.earlier.text', { v: next.version, date: date(doc.stillApplies!) })}</p>
          </div>
        )}

        <section className="detail-sec" aria-labelledby="d-who">
          <h3 id="d-who">{t('d.who')}</h3>
          <ul className="who-list">
            {ROLES.map((role) => {
              const yes = doc.audience.includes(role);
              return (
                <li key={role} className={yes ? 'yes' : 'no'}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {yes ? <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 8h8" strokeLinecap="round" />}
                  </svg>
                  <span>{roleName(role)}</span>
                  <span className="sr-only">: {yes ? t('d.can') : t('d.cannot')}</span>
                </li>
              );
            })}
          </ul>
          {doc.classification === 'strict' && <p className="small">{t('d.who.strict')}</p>}
        </section>

        <section className="detail-sec" aria-labelledby="d-facts">
          <h3 id="d-facts">{t('d.facts')}</h3>
          <dl className="facts">
            <div><dt>{t('d.owner')}</dt><dd>{doc.owner.name}<span>{t(`team.${doc.owner.team}` as const)}</span></dd></div>
            <div><dt>{t('d.inforce')}</dt><dd>{date(doc.inForce)}</dd></div>
            <div><dt>{t('d.reviewed')}</dt><dd>{date(doc.reviewedOn)}</dd></div>
            <div>
              <dt>{t('d.review')}</dt>
              <dd className={r.state === 'overdue' ? 'warn' : undefined}>
                {r.state === 'superseded' ? t('rv.superseded') : date(doc.reviewDue)}
                {r.state === 'overdue' && <span>{span(r.days)}</span>}
              </dd>
            </div>
            <div><dt>{t('d.file')}</dt><dd className="file">{doc.file}<span>{t('lib.pages', { n: doc.pages })}</span></dd></div>
            <div><dt>{t('d.added')}</dt><dd>{date(doc.added)}</dd></div>
            {s.status === 'ready' && <div><dt>{t('d.passages')}</dt><dd>{t('d.passages.n', { n: passages(doc) })}</dd></div>}
          </dl>
        </section>

        {all.length > 1 && (
          <section className="detail-sec" aria-labelledby="d-ver">
            <h3 id="d-ver">{t('d.versions')}</h3>
            <ol className="versions">
              {all.map((v) => (
                <li key={v.id}>
                  {v.id === doc.id ? (
                    <span className="v cur" aria-current="true">{v.version}<em>{t('d.version.this')}</em></span>
                  ) : (
                    <a className="v" href={href('documents', v.id)}>{v.version}</a>
                  )}
                  <span className="vn">{v.supersededBy ? t('d.version.earlier', { date: date(v.stillApplies!) }) : t('d.version.current', { date: date(v.inForce) })}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {doc.uploaded && currentRole() === 'knowledge' && <Remove doc={doc} onRemoved={onClose} />}

        {doc.sections.length > 0 && (
          <section className="detail-sec" aria-labelledby="d-toc">
            <h3 id="d-toc">{t('d.contents')}</h3>
            <ol className="toc">
              {doc.sections.map((sec) => (
                <li key={sec.n}>
                  <a href={href('documents', doc.id, 'view', sec.n)}>
                    <span className="tn">{sec.n}</span>
                    <span className="tt">{sec.title}</span>
                    <span className="tp">{t('d.page', { n: sec.page })}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </aside>
  );
}

/** Bu tarayıcıda eklenen belge kaldırılabilir; önce ne olacağı söylenir ve onay istenir */
function Remove({ doc, onRemoved }: { doc: Doc; onRemoved: () => void }) {
  const [asking, setAsking] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (asking) yesRef.current?.focus();
  }, [asking]);
  return (
    <section className="detail-sec remove">
      <p className="small">{t('d.uploaded')}</p>
      {savedThisSessionOnly() && <p className="small">{t('d.session')}</p>}
      {asking ? (
        <div className="confirm" role="group" aria-labelledby="rm-q">
          <p id="rm-q">{t('d.remove.ask', { title: doc.title })}</p>
          <div className="confirm-acts">
            <button ref={yesRef} type="button" className="btn danger" onClick={() => { removeUpload(doc.id); onRemoved(); }}>{t('d.remove.yes')}</button>
            <button type="button" className="btn" onClick={() => setAsking(false)}>{t('d.remove.no')}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn" onClick={() => setAsking(true)}>{t('d.remove')}</button>
      )}
    </section>
  );
}
