import { useEffect, useRef, useState } from 'react';
import { useAccount, type AccountId } from '../lib/account';
import { t, usePrefs } from '../lib/i18n';
import { go } from '../lib/router';
import { resetDemo } from '../lib/storage';
import type { Key } from '../lib/strings';

// Rehber: uygulamanın amacı, hangi ekranın ne işe yaradığı, önce ne denenmeli ve her denemede neye bakılmalı.
// İlk girişte açılır, menüdeki "Nasıl kullanılır" ile yeniden açılır. Klavye kısayolu anlatılmaz (kullanıcı kuralı).
type Try = { key: string; as: AccountId; route: 'ask' | 'documents'; q?: { en: string; tr: string }; loss?: string; doc?: string };

const TRIES: Try[] = [
  { key: 'g.t1', as: 'ciaran', route: 'ask', q: { en: 'What is the escape of water excess?', tr: 'Su kaçağı muafiyeti ne kadar?' } },
  { key: 'g.t2', as: 'ciaran', route: 'ask', q: { en: 'What is the escape of water excess?', tr: 'Su kaçağı muafiyeti ne kadar?' }, loss: '2026-02-20' },
  { key: 'g.t3', as: 'aoife', route: 'ask', q: { en: 'What are the fraud indicators in escape of water claims?', tr: 'Su kaçağı dosyalarında suistimal göstergeleri neler?' } },
  { key: 'g.t4', as: 'niamh', route: 'ask', q: { en: 'Does the policy cover damage caused by a drone?', tr: 'Drone çarpması hasarı teminat kapsamında mı?' } },
  { key: 'g.t5', as: 'ciaran', route: 'documents', doc: 'home-policy-2026' }
];

/** Rehberden başlatılan deneme: Sor ekranı açılınca soruyu kendisi sorar */
export const TRY_KEY = 'tolka-try';

export function Guide({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { prefs, set } = usePrefs();
  const { account, set: setAccount } = useAccount();
  const [resetting, setResetting] = useState(false);
  const tr = prefs.lang === 'tr';

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const close = () => {
    set({ guideSeen: true });
    ref.current?.close();
  };

  const run = (x: Try) => {
    if (x.q) {
      try { sessionStorage.setItem(TRY_KEY, JSON.stringify({ q: tr ? x.q.tr : x.q.en, loss: x.loss })); } catch { /* depolama kapalı */ }
    }
    if (account?.id !== x.as) setAccount(x.as);
    if (x.route === 'ask') go('ask');
    else go('documents', x.doc!, 'view');
    close();
  };

  const screens: [Key, Key][] = [
    ['nav.ask', 'g.s.ask'],
    ['nav.documents', 'g.s.docs'],
    ['nav.history', 'g.s.history'],
    ['nav.quality', 'g.s.quality']
  ];

  return (
    <dialog ref={ref} className="guide" aria-labelledby="g-h" onClose={onClose}>
      <div className="g-scroll">
        <header className="g-head">
          <div>
            <p className="g-kicker">{t('concept.by')}</p>
            <h2 id="g-h">{t('g.title')}</h2>
          </div>
          <div className="seg g-lang" role="group" aria-label={t('lang')}>
            <button type="button" lang="en" aria-pressed={!tr} onClick={() => set({ lang: 'en' })}>EN</button>
            <button type="button" lang="tr" aria-pressed={tr} onClick={() => set({ lang: 'tr' })}>TR</button>
          </div>
        </header>

        <section className="g-sec">
          <p className="g-lead">{t('g.what')}</p>
          <p>{t('g.what2')}</p>
        </section>

        <section className="g-sec" aria-labelledby="g-screens">
          <h3 id="g-screens">{t('g.screens')}</h3>
          <dl className="g-screens">
            {screens.map(([k, v]) => (
              <div key={k}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>
            ))}
          </dl>
        </section>

        <section className="g-sec" aria-labelledby="g-try">
          <h3 id="g-try">{t('g.try')}</h3>
          <ol className="g-tries">
            {TRIES.map((x, i) => (
              <li key={x.key}>
                <span className="g-n" aria-hidden="true">{i + 1}</span>
                <div>
                  <b>{t(`${x.key}` as Key)}</b>
                  <p><span className="g-look">{t('g.look')}</span> {t(`${x.key}.look` as Key)}</p>
                  <button type="button" className="btn" onClick={() => run(x)}>{t(`${x.key}.go` as Key)}</button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="g-sec" aria-labelledby="g-how">
          <h3 id="g-how">{t('g.how')}</h3>
          <p>{t('g.how1')}</p>
          <p>{t('g.how2')}</p>
          <p>{t('g.about')}</p>
          <button type="button" className="btn" onClick={() => { if (!account) setAccount('ciaran'); go('about'); close(); }}>{t('nav.about')}</button>
        </section>

        <footer className="g-foot">
          <button type="button" className="btn primary" onClick={() => { if (!account) setAccount('ciaran'); go('ask'); close(); }}>{t('g.start')}</button>
          {resetting ? (
            <span className="g-reset">
              <span>{t('g.reset.ask')}</span>
              <button type="button" className="btn danger" onClick={() => { resetDemo(); location.reload(); }}>{t('g.reset.yes')}</button>
              <button type="button" className="btn" onClick={() => setResetting(false)}>{t('d.remove.no')}</button>
            </span>
          ) : (
            <button type="button" className="linkish" onClick={() => setResetting(true)}>{t('g.reset')}</button>
          )}
        </footer>
      </div>
      <button type="button" className="g-x" onClick={close}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
        <span className="sr-only">{t('d.close')}</span>
      </button>
    </dialog>
  );
}
