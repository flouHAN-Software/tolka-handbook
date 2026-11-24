import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react';
import { allConversations, useConversations } from '../../data/conversations';
import { docById } from '../../data/library';
import { assign, issues, latest, reopen, resolve, useIssues, type Gap, type Issue } from '../../data/quality';
import { ACCOUNTS } from '../../lib/account';
import { date } from '../../lib/format';
import { getLang, t } from '../../lib/i18n';
import { go, href, useRoute } from '../../lib/router';
import { useMedia } from '../../lib/useMedia';

const GAP_ICON: Record<Gap, JSX.Element> = {
  conflict: <path d="M3 5.5h10M3 10.5h10M6 3l-2 10" strokeLinecap="round" />,
  missing: <><circle cx="8" cy="8" r="5.5" /><path d="M5.5 8h5" strokeLinecap="round" /></>,
  outdated: <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2 1.3" strokeLinecap="round" /></>,
  unread: <><path d="M4 2.5h5.5l2.5 2.5v8.5H4z" strokeLinejoin="round" /><path d="M2.5 13.5l11-11" strokeLinecap="round" /></>,
  unhelpful: <><path d="M3 4.5h10v6H7l-3 2.5v-2.5H3z" strokeLinejoin="round" /><path d="M6.5 7.5h3" strokeLinecap="round" /></>
};

export function GapLabel({ gap }: { gap: Gap }) {
  return (
    <span className={`gap gap-${gap}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{GAP_ICON[gap]}</svg>
      {t(`gap.${gap}` as const)}
    </span>
  );
}

const who = (by?: string) => ACCOUNTS.find((a) => a.id === by);
const time = (iso: string) => new Date(iso).toLocaleTimeString(getLang() === 'tr' ? 'tr-TR' : 'en-IE', { hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => date(iso.slice(0, 10));
const count = (n: number) => (n === 1 ? t('iq.questions.1') : t('iq.questions', { n }));

/** Yanıtlanamayan sorular, eksiğin türüne göre (Intercom Fin'den): arkasındaki sorular, belge, sorumlu, ne yapılacak */
export function Quality() {
  useIssues();
  useConversations();
  const { rest } = useRoute();
  const phone = useMedia('(max-width: 767px)');
  const [view, setView] = useState<'open' | 'done'>('open');
  const [announce, setAnnounce] = useState('');

  const all = issues(allConversations(), (by) => who(by)?.initials ?? 'CB', (by) => who(by)?.role ?? 'claims');
  const open = all.filter((i) => i.status !== 'resolved');
  const done = all.filter((i) => i.status === 'resolved');
  const shown = (view === 'open' ? open : done).sort((a, b) => b.asked.length - a.asked.length || latest(b).localeCompare(latest(a)));
  const selected = all.find((i) => i.id === rest[0]);

  // En sık eksik türü: açık konulardaki soru sayısına göre
  const byGap = new Map<Gap, number>();
  open.forEach((i) => byGap.set(i.gap, (byGap.get(i.gap) ?? 0) + i.asked.length));
  const top = [...byGap].sort((a, b) => b[1] - a[1])[0]?.[0];
  const questions = open.reduce((n, i) => n + i.asked.length, 0);

  const close = () => go('quality');
  const detail = selected && <IssueDetail key={selected.id} i={selected} onClose={close} phone={phone} onAnnounce={setAnnounce} />;
  if (phone && detail) return <>{detail}<p className="sr-only" role="status" aria-live="polite">{announce}</p></>;

  return (
    <div className={`lib${selected ? ' has-detail' : ''}`}>
      <div className="lib-main">
        <header className="page-head lib-head">
          <h1>{t('quality.title')}</h1>
          <p>{t('quality.lead')}</p>
        </header>
        <p className="iq-sum">
          {open.length ? t('iq.summary', { open: open.length, q: questions, gap: top ? t(`gap.${top}` as const).toLocaleLowerCase(getLang() === 'tr' ? 'tr' : 'en') : '' }) : t('iq.none.open')}
        </p>
        <div className="lib-tools">
          <div className="seg lib-views" role="group" aria-label={t('iq.view')}>
            <button type="button" aria-pressed={view === 'open'} onClick={() => setView('open')}>{t('iq.open')}<span className="n">{open.length}</span></button>
            <button type="button" aria-pressed={view === 'done'} onClick={() => setView('done')}>{t('iq.done')}<span className="n">{done.length}</span></button>
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="empty" role="status"><b>{view === 'open' ? t('iq.none.open') : t('iq.none.done')}</b></div>
        ) : (
          <ul className="iq-list">
            {shown.map((i) => (
              <li key={i.id}>
                <a className={`iq-row${selected?.id === i.id ? ' sel' : ''}`} href={href('quality', i.id)} aria-current={selected?.id === i.id ? 'true' : undefined}>
                  <span className="iq-top">
                    <GapLabel gap={i.gap} />
                    <span className="iq-n">{count(i.asked.length)}</span>
                  </span>
                  <span className="iq-title" lang="en">{i.title}</span>
                  <span className="iq-meta">
                    {t('iq.last', { date: day(latest(i)) })} · {t('iq.owner', { name: i.owner.name })}
                    {i.status === 'assigned' && <> · {t('iq.st.assigned', { name: i.owner.name, date: day(i.assignedAt!) })}</>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="small iq-seed">{t('iq.seed')}</p>
      </div>
      {detail}
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}

function IssueDetail({ i, onClose, phone, onAnnounce }: { i: Issue; onClose: () => void; phone: boolean; onAnnounce: (s: string) => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);
  useEffect(() => title.current?.focus({ preventScroll: true }), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !resolving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, resolving]);
  useEffect(() => { if (resolving) noteRef.current?.focus(); }, [resolving]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) { setErr(true); noteRef.current?.focus(); return; }
    resolve(i, note.trim());
    setResolving(false);
    onAnnounce(t('iq.resolved.say'));
  };

  return (
    <aside className={`detail iq-detail${phone ? ' phone' : ''}`} aria-labelledby="iq-h">
      <div className="detail-top">
        {phone ? (
          <a className="back" href={href('quality')}>‹ {t('quality.title')}</a>
        ) : (
          <button type="button" className="x" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
            <span className="sr-only">{t('d.close')}</span>
          </button>
        )}
      </div>
      <div className="detail-body">
        <GapLabel gap={i.gap} />
        <h2 id="iq-h" ref={title} tabIndex={-1} lang="en">{i.title}</h2>
        <p className="iq-status">
          {i.status === 'open' && t('iq.st.open')}
          {i.status === 'assigned' && t('iq.st.assigned', { name: i.owner.name, date: day(i.assignedAt!) })}
          {i.status === 'resolved' && t('iq.st.resolved', { date: day(i.resolvedAt!) })}
        </p>

        <section className="detail-sec">
          <h3>{t('iq.what')}</h3>
          <p lang="en">{i.detail}</p>
          {i.docs.length > 0 && (
            <ul className="iq-docs">
              {i.docs.map((d) => {
                const doc = docById(d.id);
                return doc ? (
                  <li key={d.id}>
                    <a href={href('documents', doc.id, ...(doc.sections.length ? ['view', ...(d.at ? [d.at] : [])] : []))}>
                      {doc.title} {doc.version}{d.at ? ` · ${t('ans.clause', { n: d.at })}` : ''}
                    </a>
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </section>

        {i.status === 'resolved' && i.resolution && (
          <section className="detail-sec">
            <h3>{t('iq.resolution')}</h3>
            <p lang="en">{i.resolution}</p>
          </section>
        )}

        <section className="detail-sec">
          <h3>{t('iq.asked')} ({i.asked.length})</h3>
          <ul className="iq-asked">
            {i.asked.map((a, k) => (
              <li key={k}>
                <q>{a.q}</q>
                <span className="small">
                  {day(a.at)} {time(a.at)} · {t(`job.${a.role}` as const)} · {a.by}{a.live ? ` · ${t('iq.live')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-sec">
          <h3>{t('iq.actions')}</h3>
          {i.status === 'resolved' ? (
            <button type="button" className="btn" onClick={() => reopen(i)}>{t('iq.reopen')}</button>
          ) : resolving ? (
            <form className={`field${err ? ' has-err' : ''}`} onSubmit={save} noValidate>
              <label className="field-l" htmlFor="iq-note">{t('iq.note')}</label>
              <span className="field-h" id="iq-note-h">{t('iq.note.hint')}</span>
              {err && <p className="field-err" id="iq-note-err">{t('iq.note.err')}</p>}
              <textarea id="iq-note" ref={noteRef} className="input iq-note" rows={3} value={note}
                onChange={(e) => { setNote(e.target.value); if (err) setErr(false); }}
                aria-describedby={err ? 'iq-note-h iq-note-err' : 'iq-note-h'} aria-invalid={err} />
              <div className="confirm-acts">
                <button type="submit" className="btn primary">{t('iq.save')}</button>
                <button type="button" className="btn" onClick={() => { setResolving(false); setErr(false); }}>{t('iq.cancel')}</button>
              </div>
            </form>
          ) : (
            <div className="confirm-acts">
              {i.status === 'open' && (
                <button type="button" className="btn primary" onClick={() => { assign(i); onAnnounce(t('iq.assigned.say', { name: i.owner.name })); }}>
                  {t('iq.assign', { name: i.owner.name })}
                </button>
              )}
              <button type="button" className="btn" onClick={() => setResolving(true)}>{t('iq.resolve')}</button>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
