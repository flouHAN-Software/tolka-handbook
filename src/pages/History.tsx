import { useRef, useState } from 'react';
import { useConversations } from '../data/conversations';
import { date } from '../lib/format';
import { getLang, t } from '../lib/i18n';
import { href } from '../lib/router';

const time = (iso: string) => new Date(iso).toLocaleTimeString(getLang() === 'tr' ? 'tr-TR' : 'en-IE', { hour: '2-digit', minute: '2-digit' });

/** Giriş yapan kişinin konuşmaları, yeniden eskiye. Her konuşma kaldığı yerden açılır. */
export function History() {
  const list = useConversations();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const needle = q.trim().toLocaleLowerCase();
  const rows = [...list]
    .sort((a, b) => b.created.localeCompare(a.created))
    .filter((c) => !needle || c.items.some((a) => a.q.toLocaleLowerCase().includes(needle)));

  return (
    <div className="page history">
      <header className="page-head">
        <h1>{t('history.title')}</h1>
        <p>{t('history.lead')}</p>
      </header>

      {list.length === 0 ? (
        <div className="empty" role="status">
          <b>{t('hist.none')}</b>
          <p>{t('hist.none.hint')}</p>
          <a className="btn" href={href('ask')}>{t('nav.ask')}</a>
        </div>
      ) : (
        <>
          <div className="lib-filter hist-filter">
            <label className="sr-only" htmlFor="hist-q">{t('hist.filter')}</label>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" /><path d="M12.5 12.5l4 4" strokeLinecap="round" /></svg>
            <input id="hist-q" ref={input} type="search" value={q} placeholder={t('hist.filter')} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
          {rows.length === 0 ? (
            <div className="empty" role="status">
              <b>{t('hist.nomatch', { q: q.trim() })}</b>
              <button type="button" className="btn" onClick={() => { setQ(''); input.current?.focus(); }}>{t('lib.clear')}</button>
            </div>
          ) : (
            <ol className="hist-list">
              {rows.map((c) => {
                const sent = c.items.filter((a) => a.handoff).length;
                const none = c.items.filter((a) => a.kind === 'none').length;
                const ai = c.items.some((a) => a.ai);
                return (
                  <li key={c.id}>
                    <a className="hist-row" href={href('ask', c.id)}>
                      <span className="hist-when">{date(c.created.slice(0, 10))} · {time(c.created)}</span>
                      <span className="hist-title">{c.title}</span>
                      <span className="hist-meta">
                        {c.items.length === 1 ? t('hist.q.1') : t('hist.q', { n: c.items.length })}
                        {' · '}
                        {ai ? t('hist.ai') : t('hist.search')}
                        {none > 0 && <> · {t('hist.none.n', { n: none })}</>}
                        {sent > 0 && <> · {t('hist.sent', { n: sent })}</>}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
