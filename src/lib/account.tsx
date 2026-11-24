import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { RoleId } from '../data/types';

// Deneme hesapları: parola yok, yetki tarayıcıda uygulanır (gerçek kurulumda kurumun kendi girişi ve sunucuda denetim).
export type AccountId = 'niamh' | 'ciaran' | 'aoife' | 'declan';
export interface Account { id: AccountId; name: string; initials: string; role: RoleId }

export const ACCOUNTS: Account[] = [
  { id: 'niamh', name: 'Niamh Gallagher', initials: 'NG', role: 'care' },
  { id: 'ciaran', name: 'Ciarán Byrne', initials: 'CB', role: 'claims' },
  { id: 'aoife', name: 'Aoife Doherty', initials: 'AD', role: 'siu' },
  { id: 'declan', name: 'Declan Moran', initials: 'DM', role: 'knowledge' }
];

// Hesap, demo verisinin anahtarlarından (tolka:) ayrı tutulur; "Demo verisini sıfırla" çıkış yaptırmaz
const KEY = 'tolka-account';

function read(): Account | null {
  // ?as=care: vaka sayfasından gelen bağlantı belirli bir rolle açar; bir kez uygulanır ve adresten silinir
  const q = new URLSearchParams(location.search);
  const as = q.get('as');
  if (as) {
    q.delete('as');
    const rest = q.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    const hit = ACCOUNTS.find((a) => a.role === as || a.id === as);
    if (hit) {
      try { localStorage.setItem(KEY, hit.id); } catch { /* depolama kapalı */ }
      return hit;
    }
  }
  // İlk ziyaret: giriş ekranı yerine doğrudan Sor ekranı açılır; varsayılan rol hasar uzmanı (Ciarán).
  // Öbür roller menüdeki "Hesap değiştir" ile seçilir.
  try {
    const id = localStorage.getItem(KEY);
    const hit = ACCOUNTS.find((a) => a.id === id);
    if (hit) return hit;
    localStorage.setItem(KEY, 'ciaran');
  } catch {
    /* depolama kapalı: hesap yalnızca bu sekmede geçerli */
  }
  return ACCOUNTS[1];
}

let current: Account | null = read();
export const currentAccount = () => current;
/** Aramada, yanıtta ve listelerde kullanılan rol (giriş yoksa hasar uzmanı varsayılır) */
export const currentRole = (): RoleId => current?.role ?? 'claims';

interface Ctx { account: Account | null; set: (id: AccountId | null) => void }
const C = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(current);
  const set = useCallback((id: AccountId | null) => {
    const next = id ? ACCOUNTS.find((a) => a.id === id) ?? null : null;
    current = next;
    try {
      if (next) localStorage.setItem(KEY, next.id);
      else localStorage.removeItem(KEY);
    } catch {
      /* depolama kapalı: hesap yalnızca bu sekmede geçerli */
    }
    setAccount(next);
  }, []);
  return <C.Provider value={{ account, set }}>{children}</C.Provider>;
}

export function useAccount() {
  const c = useContext(C);
  if (!c) throw new Error('AccountProvider eksik');
  return c;
}
