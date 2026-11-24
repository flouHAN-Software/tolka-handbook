import { useSyncExternalStore } from 'react';

// "Yalnızca bu belgeye sor": Sor ekranındaki arama tek belgeyle sınırlanır (kendi eklediğiniz PDF ya da kütüphaneden bir belge).
// Sekme kapanana kadar geçerlidir; ekranlar arasında gezerken kaybolmaz.
const KEY = 'tolka-scope';

let value: string | null = (() => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
})();
const listeners = new Set<() => void>();

export const scope = () => value;

export function setScope(id: string | null) {
  value = id;
  try {
    if (id) sessionStorage.setItem(KEY, id);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* depolama kapalı: yalnızca bu sayfada geçerli */
  }
  listeners.forEach((l) => l());
}

export function useScope() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => value
  );
}

/** Rehberden "PDF ekle" seçildi: Sor ekranı açılınca ekleme penceresini açar */
export const ADD_KEY = 'tolka-add';
