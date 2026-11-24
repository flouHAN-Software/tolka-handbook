import { createContext, Fragment, useContext } from 'react';
import { stem } from '../lib/search';

/** Belgede aranan ifade (görüntüleyicideki "Belgede ara"); bulunan her yer işaretlenir */
export const FindCtx = createContext('');

/** Belge metni: **terim** kalın (tanımlı terim); istenirse sorudaki kelimelerle eşleşenler altı çizili */
export function DocText({ text, matched }: { text: string; matched?: string[] }) {
  const find = useContext(FindCtx);
  const set = matched?.length ? new Set(matched) : null;
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        const def = part.startsWith('**') && part.endsWith('**');
        const body = def ? part.slice(2, -2) : part;
        const inner = find ? found(body, find) : set ? marks(body, set) : body;
        return def ? <b key={i} className="def">{inner}</b> : <Fragment key={i}>{inner}</Fragment>;
      })}
    </>
  );
}

/** Düz hücre metni (tablo) için aynı arama işareti */
export function Found({ text }: { text: string }) {
  const find = useContext(FindCtx);
  return <>{find ? found(text, find) : text}</>;
}

function found(text: string, q: string) {
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${esc})`, 'gi')).map((p, i) =>
    i % 2 === 1 ? <mark key={i} className="find">{p}</mark> : <Fragment key={i}>{p}</Fragment>
  );
}

function marks(text: string, set: Set<string>) {
  return text.split(/([A-Za-z€0-9][A-Za-z€0-9,.-]*[A-Za-z0-9]|[A-Za-z])/g).map((w, i) =>
    i % 2 === 1 && set.has(stem(w.toLowerCase().replace(/[’']/g, ''))) ? <span key={i} className="m">{w}</span> : <Fragment key={i}>{w}</Fragment>
  );
}
