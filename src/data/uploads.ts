import { useSyncExternalStore } from 'react';
import { extract } from '../lib/extract';
import { load, save } from '../lib/storage';
import { DEMO_TODAY, type Classification, type Doc, type DocKind, type Person, type RoleId } from './types';

// Kullanıcının eklediği belgeler. Dosya tarayıcıda okunur; çıkan metin bu tarayıcıda saklanır (sunucu yok).
export interface UploadMeta {
  title: string;
  kind: DocKind;
  version: string;
  inForce: string;
  owner: Person;
  classification: Classification;
  reviewMonths: number;
}

/** Gizlilik düzeyine göre belgeyi açabilen roller */
export const AUDIENCE: Record<Classification, RoleId[]> = {
  public: ['care', 'claims', 'siu', 'knowledge'],
  internal: ['care', 'claims', 'siu', 'knowledge'],
  confidential: ['claims', 'siu', 'knowledge'],
  strict: ['siu']
};

let list: Doc[] = load<Doc[]>('uploads', []);
const progress = new Map<string, { page: number; pages: number }>();
let sessionOnly = false;
let version = 0;
const listeners = new Set<() => void>();
const finished: ((d: Doc) => void)[] = [];

function emit() {
  version++;
  listeners.forEach((l) => l());
}

function persist() {
  // Depolama doluysa ya da kapalıysa belge yalnızca bu oturumda kalır; ekranda söylenir
  sessionOnly = !save('uploads', list.filter((d) => !progress.has(d.id)));
}

export const uploads = () => list;
export const uploadProgress = (id: string) => progress.get(id);
export const savedThisSessionOnly = () => sessionOnly;

export function useUploads() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );
}

export function onUploadFinished(f: (d: Doc) => void) {
  finished.push(f);
  return () => {
    const i = finished.indexOf(f);
    if (i >= 0) finished.splice(i, 1);
  };
}

function addMonths(iso: string, months: number) {
  const d = new Date(iso + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Belgeyi ekler ve okumaya başlar; liste hemen güncellenir, okuma bitince durum değişir */
export function addUpload(file: File, meta: UploadMeta): Doc {
  const id = 'up-' + Date.now().toString(36);
  const doc: Doc = {
    id,
    title: meta.title,
    kind: meta.kind,
    version: meta.version,
    file: file.name,
    pages: 0,
    inForce: meta.inForce,
    reviewedOn: meta.inForce,
    reviewDue: addMonths(meta.inForce, meta.reviewMonths),
    owner: meta.owner,
    classification: meta.classification,
    audience: AUDIENCE[meta.classification],
    added: DEMO_TODAY,
    status: 'processing',
    uploaded: true,
    sections: []
  };
  list = [doc, ...list];
  progress.set(id, { page: 0, pages: 0 });
  emit();

  extract(file, (page, pages) => {
    progress.set(id, { page, pages });
    emit();
  })
    .then((r) => r, () => ({ pages: 0, sections: [], failReason: 'unreadable' as const }))
    .then((r) => {
      progress.delete(id);
      const done: Doc = { ...doc, pages: r.pages, sections: r.sections, status: r.failReason ? 'failed' : 'ready', failReason: r.failReason };
      list = list.map((d) => (d.id === id ? done : d));
      persist();
      emit();
      finished.forEach((f) => f(done));
    });
  return doc;
}

export function removeUpload(id: string) {
  list = list.filter((d) => d.id !== id);
  progress.delete(id);
  persist();
  emit();
}
