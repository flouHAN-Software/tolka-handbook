import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Block, Doc } from '../data/types';
import type { Loc } from '../lib/search';
import { DocText, FindCtx, Found } from './Text';

/** Belge görüntüleyici: belge kendi antetiyle, kâğıt üzerinde; kaynak gösterilen yer fosforlu kalemle çizilir
 *  (NotebookLM'den: alıntıya tıklayınca belge o yere kayar). */
export function DocView({ doc, hl, n, find = '', focus }: { doc: Doc; hl?: Loc; n?: number; find?: string; focus?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // İşaretli yer görünür alana kayar; yalnızca belgenin kendi kaydırma alanı hareket eder
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.hit');
    const box = ref.current?.closest<HTMLElement>('.doc-scroll');
    if (!el || !box) return;
    const r = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const dy = r.top - b.top - b.height / 4;
    // Yakın yere yumuşak, uzak yere doğrudan kaydırılır (uzun belgede yumuşak kaydırma bir saniyeyi aşıyor)
    const smooth = Math.abs(dy) < b.height * 1.5 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top: box.scrollTop + dy, behavior: smooth ? 'smooth' : 'auto' });
  }, [doc.id, hl?.clause, hl?.block, hl?.item, hl?.row]);

  // Bağlantıyla gelinen madde ya da bölüm (#/documents/<id>/view/7.3) görünür alana kayar
  useLayoutEffect(() => {
    if (!focus) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-at="${CSS.escape(focus)}"]`);
    const box = ref.current?.closest<HTMLElement>('.doc-scroll');
    if (!el || !box) return;
    box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 24 });
  }, [doc.id, focus]);

  const isHit = (clause: string, block: number, item?: number, row?: number) =>
    !!hl && hl.clause === clause && hl.block === block && hl.item === item && hl.row === row;
  const mark = (on: boolean, node: ReactNode) =>
    on ? <mark key={`${hl?.clause}-${hl?.block}-${hl?.item}-${hl?.row}`} className="hl">{node}</mark> : node;

  return (
    <FindCtx.Provider value={find}>
    <article className="pg" ref={ref} lang="en">
      <div className="lh">
        <span className="lh-t">Tolka</span>
        <span>{doc.title} · {doc.version}</span>
      </div>
      {doc.sections.map((s) => (
        <section key={s.n} className={`pg-sec${focus === s.n ? ' focus' : ''}`} aria-labelledby={`sec-${s.n}`} data-at={s.n}>
          <h3 id={`sec-${s.n}`}><span className="n">{s.n}</span><span><Found text={s.title} /></span></h3>
          {s.clauses.map((c) => (
            <div key={c.n} className={`cl${focus === c.n ? ' focus' : ''}`} data-at={c.n}>
              <span className="n">{c.n}</span>
              <div className="cl-body">
                {c.heading && <h4><Found text={c.heading} /></h4>}
                {c.blocks.map((b: Block, bi) => {
                  if (b.t === 'p' || b.t === 'note') {
                    const on = isHit(c.n, bi);
                    return <p key={bi} className={on ? 'hit' : undefined} data-n={on ? n : undefined}>{mark(on, <DocText text={b.text} />)}</p>;
                  }
                  if (b.t === 'list')
                    return (
                      <ol key={bi} className="items">
                        {b.items.map((it, ii) => {
                          const on = isHit(c.n, bi, ii);
                          return (
                            <li key={ii} className={on ? 'hit' : undefined} data-n={on ? n : undefined}>
                              {it.n ? <span className="n">{it.n}</span> : <span className="n" aria-hidden="true">–</span>}
                              <span>{mark(on, <DocText text={it.text} />)}</span>
                            </li>
                          );
                        })}
                      </ol>
                    );
                  return (
                    <div key={bi} className="tbl" tabIndex={0} role="region" aria-label={c.heading ?? s.title}>
                      <table>
                        <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
                        <tbody>
                          {b.rows.map((r, ri) => {
                            const on = isHit(c.n, bi, undefined, ri);
                            return (
                              <tr key={ri} className={on ? 'hit row' : undefined} data-n={on ? n : undefined}>
                                {r.map((cell, ci) => (ci === 0 ? <th key={ci} scope="row">{mark(on, <Found text={cell} />)}</th> : <td key={ci}>{mark(on, <Found text={cell || '–'} />)}</td>))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
      <div className="pg-foot">
        <span>{doc.file}</span>
        <span>{doc.pages ? `${doc.pages} pages` : ''}</span>
      </div>
    </article>
    </FindCtx.Provider>
  );
}
