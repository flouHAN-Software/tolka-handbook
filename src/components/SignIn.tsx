import { useEffect, useRef } from 'react';
import { DOCS, canOpen } from '../data/library';
import { ACCOUNTS, useAccount, type AccountId } from '../lib/account';
import { t } from '../lib/i18n';
import { Copyright, PrefControls, Wordmark } from './Shell';

/** "Kim olarak giriş yapıyorsunuz?" Her rolün ne gördüğü açıkça yazar; parola yoktur ve bu söylenir. */
export function SignIn({ back, onBack }: { back?: AccountId; onBack?: () => void }) {
  const { set } = useAccount();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => h1.current?.focus(), []);
  const visible = (role: (typeof ACCOUNTS)[number]['role']) => DOCS.filter((d) => canOpen(d, role) && !d.supersededBy).length;

  return (
    <div className="signin">
      <header className="si-top">
        <Wordmark />
        <a className="si-concept" href={t('concept.url')} target="_blank" rel="noopener">{t('concept.by')}</a>
      </header>
      <main className="si-main" id="main">
        <h1 ref={h1} tabIndex={-1}>{t('si.title')}</h1>
        <p className="si-lead">{t('si.lead')}</p>
        <ul className="si-list">
          {ACCOUNTS.map((a) => (
            <li key={a.id} className="si-row">
              <span className="avatar" aria-hidden="true">{a.initials}</span>
              <div className="si-who">
                <b>{a.name}</b>
                <span className="si-job">{t(`job.${a.role}` as const)} · {t(`jobteam.${a.role}` as const)}</span>
                <p>{t(`si.sees.${a.role}` as const)}</p>
                <span className="small">{t('si.count', { n: visible(a.role) })}</span>
              </div>
              <button type="button" className="btn" onClick={() => set(a.id)}>
                {t('si.as', { name: a.name.split(' ')[0] })}
              </button>
            </li>
          ))}
        </ul>
        {back && onBack && (
          <button type="button" className="linkish si-back" onClick={onBack}>{t('si.back')}</button>
        )}
        <div className="si-note">
          <p>{t('si.note')}</p>
        </div>
        <div className="si-prefs"><PrefControls /></div>
        <Copyright />
      </main>
    </div>
  );
}
