import { useSyncExternalStore } from 'react';
import { load, save } from '../lib/storage';
import { DOCS } from './library';
import { uploadProgress } from './uploads';
import type { Doc } from './types';

// Demoda "işleniyor" durumundaki belge gerçekten ilerler: her iki saniyede bir sayfa okunur,
// son sayfadan sonra belge hazır olur. Bitenler kaydedilir; sayfa yenilenince yeniden işlenmez.
const STEP_MS = 2000;

const done = new Set<string>(load<string[]>('processed', []));
const page = new Map<string, number>();
for (const d of DOCS) if (d.status === 'processing' && !done.has(d.id)) page.set(d.id, d.readingPage ?? 1);

let version = 0;
const listeners = new Set<() => void>();
const finished: ((d: Doc) => void)[] = [];

function emit() {
  version++;
  listeners.forEach((l) => l());
}

if (page.size) {
  const timer = setInterval(() => {
    for (const [id, p] of page) {
      const d = DOCS.find((x) => x.id === id)!;
      if (p >= d.pages) {
        page.delete(id);
        done.add(id);
        save('processed', [...done]);
        finished.forEach((f) => f(d));
      } else page.set(id, p + 1);
    }
    emit();
    if (!page.size) clearInterval(timer);
  }, STEP_MS);
}

export type Live = { status: 'ready' } | { status: 'failed' } | { status: 'processing'; page: number; pages: number };

export function liveStatus(d: Doc): Live {
  const up = uploadProgress(d.id);
  if (up) return { status: 'processing', page: up.page, pages: up.pages };
  if (d.status === 'failed') return { status: 'failed' };
  const p = page.get(d.id);
  if (p !== undefined) return { status: 'processing', page: p, pages: d.pages };
  return { status: 'ready' };
}

/** Bileşen, işleme ilerledikçe yeniden çizilir */
export function useProcessing() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );
}

/** Bir belge hazır olduğunda haber verir (ekran okuyucu duyurusu için) */
export function onFinished(f: (d: Doc) => void) {
  finished.push(f);
  return () => {
    const i = finished.indexOf(f);
    if (i >= 0) finished.splice(i, 1);
  };
}
