import { useEffect, useRef, useState } from 'react';
import { ClassLabel, Status } from '../../components/Labels';
import { liveStatus, onFinished, useProcessing } from '../../data/processing';
import { allDocs, canOpen, docById, passages, review } from '../../data/library';
import { onUploadFinished, useUploads } from '../../data/uploads';
import type { Doc } from '../../data/types';
import { date } from '../../lib/format';
import { t } from '../../lib/i18n';
import { currentRole } from '../../lib/role';
import { go, href, useRoute } from '../../lib/router';
import { useMedia } from '../../lib/useMedia';
import { AddDocument } from './AddDocument';
import { Detail } from './Detail';
import { Viewer } from '../viewer/Viewer';

type View = 'all' | 'attention' | 'earlier';

/** İlgilenilmesi gereken: okunamayan, işlenen ya da gözden geçirme tarihi geçen belge */
function needsAttention(d: Doc) {
  const s = liveStatus(d).status;
  return s !== 'ready' || review(d).state === 'overdue';
}

export function Documents() {
  useProcessing();
  useUploads();
  const { rest } = useRoute();
  const phone = useMedia('(max-width: 767px)');
  const role = currentRole();
  const [view, setView] = useState<View>('all');
  const [q, setQ] = useState('');
  const [announce, setAnnounce] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [adding, setAdding] = useState(false);

  // Rol açamadığı belgeyi kütüphanede de görmez
  const mine = allDocs().filter((d) => canOpen(d, role));
  const selected = rest[0] ? docById(rest[0]) : undefined;
  const open = selected && canOpen(selected, role) ? selected : undefined;

  useEffect(() => onFinished((d) => setAnnounce(t('st.done', { title: d.title }))), []);
  useEffect(
    () =>
      onUploadFinished((d) =>
        setAnnounce(d.status === 'ready' ? t('add.ready', { title: d.title, n: passages(d) }) : t('add.failed', { title: d.title }))
      ),
    []
  );

  const added = (id: string, title: string, visible: boolean) => {
    setAdding(false);
    setAnnounce(t(visible ? 'add.added' : 'add.added.hidden', { title }));
    if (visible) {
      setView('all');
      setQ('');
      go('documents', id);
    } else addRef.current?.focus();
  };
  const dialog = (
    <>
      <AddDocument open={adding} onClose={() => { setAdding(false); addRef.current?.focus(); }} onAdded={added} />
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
    </>
  );

  const counts = {
    all: mine.length,
    attention: mine.filter(needsAttention).length,
    earlier: mine.filter((d) => d.supersededBy).length
  };
  const inView = mine.filter((d) => (view === 'attention' ? needsAttention(d) : view === 'earlier' ? !!d.supersededBy : true));
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? inView.filter((d) =>
        [d.title, d.owner.name, t(`team.${d.owner.team}` as const), t(`kind.${d.kind}` as const), d.file].some((s) => s.toLowerCase().includes(needle))
      )
    : inView;

  const close = () => go('documents');

  // Rolün açamadığı (ya da olmayan) belgeye bağlantıyla gelindi: belgenin adı ve varlığı belli edilmez
  if (rest[0] && !open) {
    return (
      <div className="page denied" role="region" aria-labelledby="denied-h">
        <header className="page-head">
          <h1 id="denied-h">{t('denied.title')}</h1>
          <p>{t('denied.text', { role: t(`job.${role}` as const) })}</p>
        </header>
        <p className="gate-back"><a href={href('documents')}>{t('denied.back')}</a></p>
      </div>
    );
  }

  // Belgenin tamamı (görüntüleyici)
  if (open && rest[1] === 'view') return <><Viewer doc={open} focus={rest[2]} />{dialog}</>;

  // Telefonda ayrıntı tam ekran açılır; liste gizlenir
  if (phone && open) return <><Detail doc={open} onClose={close} phone />{dialog}</>;

  return (
    <div className={`lib${open ? ' has-detail' : ''}`}>
      <div className="lib-main">
        <header className="lib-top">
          <div className="page-head lib-head">
            <h1>{t('documents.title')}</h1>
            <p>{t('documents.lead')}</p>
          </div>
          {/* Demoda herkes belge ekleyebilir (gerçek kurulumda bilgi yönetimi); pencerede bu söylenir */}
          {<button ref={addRef} type="button" className="btn primary lib-add" onClick={() => setAdding(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 3v10M3 8h10" strokeLinecap="round" /></svg>
            {t('add.open')}
          </button>}
        </header>

        <div className="lib-tools">
          <div className="seg lib-views" role="group" aria-label={t('lib.tabs')}>
            {(['all', 'attention', 'earlier'] as View[]).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {t(`lib.${v}` as const)}
                <span className="n">{counts[v]}</span>
              </button>
            ))}
          </div>
          <div className="lib-filter">
            <label className="sr-only" htmlFor="lib-q">{t('lib.filter')}</label>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" />
              <path d="M12.5 12.5l4 4" strokeLinecap="round" />
            </svg>
            <input id="lib-q" ref={filterRef} type="search" value={q} placeholder={t('lib.filter.ph')} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
        </div>
        <p className="lib-role">{t('lib.yourRole')}</p>

        {rows.length === 0 ? (
          <div className="empty" role="status">
            {needle ? (
              <>
                <b>{t('lib.none.filter', { q: q.trim() })}</b>
                <p>{t('lib.none.filter.hint')}</p>
                <button type="button" className="btn" onClick={() => { setQ(''); filterRef.current?.focus(); }}>{t('lib.clear')}</button>
              </>
            ) : (
              <>
                <b>{t('lib.none.attention')}</b>
                <p>{t('lib.none.attention.hint')}</p>
              </>
            )}
          </div>
        ) : (
          <table className="lib-table">
            <thead>
              <tr>
                <th scope="col">{t('lib.col.doc')}</th>
                <th scope="col" className="c-owner">{t('lib.col.owner')}</th>
                <th scope="col" className="c-inforce">{t('lib.col.inforce')}</th>
                <th scope="col" className="c-review">{t('lib.col.review')}</th>
                <th scope="col" className="c-access">{t('lib.col.access')}</th>
                <th scope="col" className="c-status">{t('lib.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <Row key={d.id} d={d} selected={open?.id === d.id} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <Detail doc={open} onClose={close} />}
      {dialog}
    </div>
  );
}

function Row({ d, selected }: { d: Doc; selected: boolean }) {
  const r = review(d);
  return (
    <tr className={selected ? 'sel' : undefined} onClick={() => go('documents', d.id)}>
      <td className="c-doc">
        <a href={`#/documents/${d.id}`} aria-current={selected ? 'true' : undefined} onClick={(e) => e.stopPropagation()}>
          {d.title}
        </a>
        <span className="meta">
          {d.supersededBy
            ? t('lib.earlierNote', { date: date(d.stillApplies!) })
            : `${t(`kind.${d.kind}` as const)} · ${d.version} · ${t('lib.pages', { n: d.pages })}`}
        </span>
        {/* Dar tabloda gizlenen sütunların özeti */}
        <span className="compact">
          <ClassLabel c={d.classification} />
          <StatusCell d={d} />
        </span>
      </td>
      <td className="c-owner">
        <span className="who-n">{d.owner.name}</span>
        <span className="meta">{t(`team.${d.owner.team}` as const)}</span>
      </td>
      <td className="c-inforce">{date(d.inForce)}</td>
      <td className="c-review"><ReviewCell d={d} r={r} /></td>
      <td className="c-access"><ClassLabel c={d.classification} /></td>
      <td className="c-status"><StatusCell d={d} /></td>
    </tr>
  );
}

function ReviewCell({ d, r }: { d: Doc; r: ReturnType<typeof review> }) {
  if (r.state === 'superseded') return <span className="meta">–</span>;
  if (r.state === 'overdue') return <Status kind="warn">{t('rv.overdue', { date: date(d.reviewDue) })}</Status>;
  if (r.state === 'soon') return <span className="soon">{t('rv.soon', { date: date(d.reviewDue) })}</span>;
  return <>{date(d.reviewDue)}</>;
}

export function StatusCell({ d }: { d: Doc }) {
  const s = liveStatus(d);
  if (s.status === 'failed') return <Status kind="err">{t('st.failed')}</Status>;
  if (s.status === 'processing') return <Status kind="run">{t('st.reading', { p: s.page, n: s.pages })}</Status>;
  if (review(d).state === 'overdue') return <Status kind="warn">{t('st.overdue')}</Status>;
  return <Status kind="ok">{t('st.ready')}</Status>;
}
