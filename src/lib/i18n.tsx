import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { STR, type Key } from './strings';

export type Lang = 'en' | 'tr';
export type Theme = 'light' | 'dark';
export interface Prefs { lang: Lang; theme: Theme; guideSeen: boolean }

// Tercihler demo verisinin anahtarlarından (tolka:) ayrı tutulur; "Demo verisini sıfırla" bunları silmez
const PREFS_KEY = 'tolka-prefs';
const DEFAULTS: Prefs = { lang: 'en', theme: 'light', guideSeen: false };

function readPrefs(): Prefs {
  let p: Partial<Prefs> = {};
  try {
    p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    p = {};
  }
  // ?lang=tr&theme=dark: siteden gelen bağlantı dili ve temayı belirler
  const q = new URLSearchParams(location.search);
  const ql = q.get('lang'), qt = q.get('theme');
  const lang: Lang = ql === 'tr' || ql === 'en' ? ql : p.lang === 'tr' ? 'tr' : DEFAULTS.lang;
  const theme: Theme = qt === 'dark' || qt === 'light' ? qt : p.theme === 'dark' ? 'dark' : DEFAULTS.theme;
  // Adresteki tercih bir kez uygulanır ve adresten silinir; yoksa sayfa yenilenince kullanıcının
  // menüden seçtiği dil ve tema yerine adrestekiler geri gelirdi
  if (ql || qt) {
    q.delete('lang');
    q.delete('theme');
    const rest = q.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  }
  return { lang, theme, guideSeen: p.guideSeen === true };
}

// Açılıştaki tercih bir kez okunur. Şu anki dil modül düzeyinde tutulur; dil değişince uygulama
// yeniden kurulur (bkz. main.tsx)
const initial = readPrefs();
let current: Lang = initial.lang;
export const getLang = () => current;

export function t(key: Key, vars?: Record<string, string | number>) {
  const s: string = STR[key][current === 'en' ? 0 : 1];
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : s;
}

interface Ctx { prefs: Prefs; set: (p: Partial<Prefs>) => void }
const C = createContext<Ctx | null>(null);

const THEME_COLOR: Record<Theme, string> = { light: '#ECEEEA', dark: '#0E0F11' };

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  current = prefs.lang;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.lang = prefs.lang === 'tr' ? 'tr' : 'en-IE';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[prefs.theme]);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* depolama kapalı: tercih yalnızca bu oturumda geçerli */
    }
  }, [prefs]);

  const set = useCallback((p: Partial<Prefs>) => setPrefs((old) => ({ ...old, ...p })), []);
  return <C.Provider value={{ prefs, set }}>{children}</C.Provider>;
}

export function usePrefs() {
  const c = useContext(C);
  if (!c) throw new Error('PrefsProvider eksik');
  return c;
}
