import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { PEOPLE } from '../../data/people';
import { addUpload, type UploadMeta } from '../../data/uploads';
import { DEMO_TODAY, type Classification, type DocKind } from '../../data/types';
import { ACCEPT, MAX_BYTES, kindOf } from '../../lib/extract';
import { t } from '../../lib/i18n';
import type { Key } from '../../lib/strings';

const KINDS: DocKind[] = ['wording', 'ipid', 'manual', 'guide', 'table', 'procedure', 'callguide', 'list'];
const LEVELS: Classification[] = ['public', 'internal', 'confidential', 'strict'];
const REVIEW = [6, 12, 24] as const;

type Field = 'file' | 'title' | 'version' | 'inForce';
type Errors = Partial<Record<Field, Key>>;

// Örnek dosyalar: biri gerçekten okunur, öteki taranmış olduğu için gerçekten hata verir
const SAMPLES = [
  { key: 'add.sample.text' as const, file: 'Home Emergency Cover 2026.1.pdf', meta: { title: 'Home Emergency Cover', kind: 'wording' as DocKind, version: '2026.1', inForce: '2026-03-01', owner: 0, classification: 'public' as Classification, reviewMonths: 12 } },
  { key: 'add.sample.scan' as const, file: 'Boiler Service Leaflet (scan).pdf', meta: { title: 'Boiler Service Leaflet', kind: 'guide' as DocKind, version: '2025', inForce: '2025-09-01', owner: 5, classification: 'public' as Classification, reviewMonths: 12 } }
];

const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

function checkFile(f: File | null): Key | undefined {
  if (!f) return 'err.file';
  if (!kindOf(f.name)) return 'err.type';
  if (f.size > MAX_BYTES) return 'err.size';
  return undefined;
}

/** Dosya adından ad ve sürüm önerisi: "Claims Manual v4.3.pdf" → "Claims Manual", "4.3" */
function guess(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
  const m = /^(.*?)[\s-]+v?(\d+(?:\.\d+)*)$/i.exec(base);
  return m ? { title: m[1].trim(), version: m[2] } : { title: base, version: '' };
}

export function AddDocument({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string, title: string, visible: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<DocKind>('guide');
  const [version, setVersion] = useState('');
  const [inForce, setInForce] = useState(DEMO_TODAY);
  const [owner, setOwner] = useState(7);
  const [level, setLevel] = useState<Classification>('internal');
  const [review, setReview] = useState(12);
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const reset = () => {
    setFile(null); setTitle(''); setKind('guide'); setVersion(''); setInForce(DEMO_TODAY);
    setOwner(7); setLevel('internal'); setReview(12); setErrors({}); setShowSummary(false);
  };

  const pick = (f: File | null) => {
    setFile(f);
    const e = checkFile(f);
    setErrors((old) => ({ ...old, file: f ? e : old.file }));
    if (f && !e) {
      const g = guess(f.name);
      if (!title.trim()) setTitle(g.title);
      if (!version.trim() && g.version) setVersion(g.version);
    }
  };

  const takeSample = async (i: number) => {
    const s = SAMPLES[i];
    const blob = await (await fetch(`./samples/${encodeURIComponent(s.file)}`)).blob();
    setFile(new File([blob], s.file, { type: 'application/pdf' }));
    setTitle(s.meta.title); setKind(s.meta.kind); setVersion(s.meta.version); setInForce(s.meta.inForce);
    setOwner(s.meta.owner); setLevel(s.meta.classification); setReview(s.meta.reviewMonths);
    setErrors({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    const fe = checkFile(file);
    if (fe) errs.file = fe;
    if (!title.trim()) errs.title = 'err.title';
    if (!version.trim()) errs.version = 'err.version';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inForce)) errs.inForce = 'err.inforce';
    setErrors(errs);
    if (Object.keys(errs).length) {
      // GOV.UK: hatalar formun başında özetlenir, odak özete gider; girilen değerler silinmez
      setShowSummary(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const meta: UploadMeta = { title: title.trim(), kind, version: version.trim(), inForce, owner: PEOPLE[owner], classification: level, reviewMonths: review };
    const doc = addUpload(file!, meta);
    reset();
    onAdded(doc.id, doc.title, level !== 'strict');
  };

  const focusField = (f: Field) => document.getElementById(f === 'file' ? 'add-file' : `add-${f}`)?.focus();
  const errText = (f: Field) =>
    errors[f] && (
      <p className="field-err" id={`add-${f}-err`}>
        <span className="sr-only">{t('add.errors')}: </span>
        {t(errors[f]!)}
      </p>
    );
  const described = (f: Field, hint?: string) => [hint, errors[f] ? `add-${f}-err` : ''].filter(Boolean).join(' ') || undefined;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files[0] ?? null);
  };

  return (
    <dialog ref={ref} className="add" aria-labelledby="add-h" onClose={() => { reset(); onClose(); }}>
      <form className="add-form" onSubmit={submit} noValidate>
        <header className="add-head">
          <h2 id="add-h">{t('add.title')}</h2>
          <button type="button" className="x" onClick={() => ref.current?.close()}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
            <span className="sr-only">{t('add.cancel')}</span>
          </button>
        </header>
        <div className="add-body">
          <p className="add-lead">{t('add.lead')}</p>

          {showSummary && Object.keys(errors).length > 0 && (
            <div className="err-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="add-err-h">
              <h3 id="add-err-h">{t('add.errors')}</h3>
              <ul>
                {(Object.keys(errors) as Field[]).filter((f) => errors[f]).map((f) => (
                  <li key={f}><a href={`#add-${f}`} onClick={(e) => { e.preventDefault(); focusField(f); }}>{t(errors[f]!)}</a></li>
                ))}
              </ul>
            </div>
          )}

          {/* Dosya */}
          <div className={`field${errors.file ? ' has-err' : ''}`}>
            <span className="field-l" id="add-file-l">{t('add.file')}</span>
            <span className="field-h" id="add-file-h">{t('add.file.hint')}</span>
            {errText('file')}
            <input id="add-file" className="file-input" type="file" accept={ACCEPT}
              aria-labelledby="add-file-l add-file-c" aria-describedby={described('file', 'add-file-h')}
              onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            <label htmlFor="add-file" className={`drop${drag ? ' over' : ''}${file ? ' has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
              {file ? (
                <>
                  <span className="drop-name">{file.name}</span>
                  <span className="drop-sub">{size(file.size)}</span>
                  <span className="drop-act" id="add-file-c">{t('add.file.change')}</span>
                </>
              ) : (
                <>
                  <span className="drop-act" id="add-file-c">{t('add.file.choose')}</span>
                  <span className="drop-sub">{t('add.file.drop')}</span>
                </>
              )}
            </label>
            <div className="samples">
              <span>{t('add.sample')}</span>
              {SAMPLES.map((s, i) => (
                <button key={s.file} type="button" className="linkish" onClick={() => takeSample(i)}>{t(s.key)}</button>
              ))}
            </div>
          </div>

          <div className={`field${errors.title ? ' has-err' : ''}`}>
            <label className="field-l" htmlFor="add-title">{t('add.f.title')}</label>
            {errText('title')}
            <input id="add-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-describedby={described('title')} aria-invalid={!!errors.title} autoComplete="off" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-l" htmlFor="add-kind">{t('add.f.kind')}</label>
              <select id="add-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as DocKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{t(`kind.${k}` as const)}</option>)}
              </select>
            </div>
            <div className={`field${errors.version ? ' has-err' : ''}`}>
              <label className="field-l" htmlFor="add-version">{t('add.f.version')}</label>
              <span className="field-h" id="add-version-h">{t('add.f.version.hint')}</span>
              {errText('version')}
              <input id="add-version" className="input" value={version} onChange={(e) => setVersion(e.target.value)} aria-describedby={described('version', 'add-version-h')} aria-invalid={!!errors.version} autoComplete="off" />
            </div>
          </div>

          <div className="field-row">
            <div className={`field${errors.inForce ? ' has-err' : ''}`}>
              <label className="field-l" htmlFor="add-inForce">{t('add.f.inforce')}</label>
              {errText('inForce')}
              <input id="add-inForce" className="input" type="date" value={inForce} onChange={(e) => setInForce(e.target.value)} aria-describedby={described('inForce')} aria-invalid={!!errors.inForce} />
            </div>
            <div className="field">
              <label className="field-l" htmlFor="add-review">{t('add.f.review')}</label>
              <select id="add-review" className="input" value={review} onChange={(e) => setReview(Number(e.target.value))}>
                {REVIEW.map((m) => <option key={m} value={m}>{t(`add.rev.${m}` as const)}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field-l" htmlFor="add-owner">{t('add.f.owner')}</label>
            <span className="field-h" id="add-owner-h">{t('add.f.owner.hint')}</span>
            <select id="add-owner" className="input" value={owner} onChange={(e) => setOwner(Number(e.target.value))} aria-describedby="add-owner-h">
              {PEOPLE.map((p, i) => <option key={p.name} value={i}>{p.name} · {t(`team.${p.team}` as const)}</option>)}
            </select>
          </div>

          <fieldset className="field radios">
            <legend className="field-l">{t('add.f.access')}</legend>
            {LEVELS.map((l) => (
              <label key={l} className={`radio${level === l ? ' on' : ''}`}>
                <input type="radio" name="add-level" value={l} checked={level === l} onChange={() => setLevel(l)} />
                <span className="radio-t">{t(`cls.${l}` as const)}</span>
                <span className="radio-h">{t(`add.acc.${l}` as const)}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <footer className="add-foot">
          <button type="submit" className="btn primary">{t('add.submit')}</button>
          <button type="button" className="btn" onClick={() => ref.current?.close()}>{t('add.cancel')}</button>
        </footer>
      </form>
    </dialog>
  );
}
