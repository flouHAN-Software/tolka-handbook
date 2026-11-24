import { useSyncExternalStore } from 'react';
import type { Key } from './strings';

// Adres çubuğunda #/documents gibi bir yol tutulur; statik sunucuda yenilemede kaybolmaz.
export const ROUTES = ['ask', 'documents', 'history', 'quality', 'more', 'about'] as const;
export type RouteId = (typeof ROUTES)[number];

export const ROUTE_TITLE: Record<RouteId, Key> = {
  ask: 'nav.ask',
  documents: 'nav.documents',
  history: 'nav.history',
  quality: 'nav.quality',
  more: 'nav.more',
  about: 'nav.about'
};

const DEFAULT: RouteId = 'ask';

interface Snap { route: RouteId; rest: string[] }

function read(): Snap {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const hit = ROUTES.find((r) => r === parts[0]);
  return { route: hit ?? DEFAULT, rest: hit ? parts.slice(1) : [] };
}

let snapshot = read();
const listeners = new Set<() => void>();

window.addEventListener('hashchange', () => {
  snapshot = read();
  listeners.forEach((l) => l());
});

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export const href = (route: RouteId, ...rest: string[]) => '#/' + [route, ...rest].join('/');

export function go(route: RouteId, ...rest: string[]) {
  const next = href(route, ...rest);
  if (location.hash !== next) location.hash = next;
}
