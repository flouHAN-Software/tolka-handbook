import { useId, type ReactNode } from 'react';
import { t, usePrefs } from '../lib/i18n';
import { currentAccount } from '../lib/account';
import { href, useRoute, type RouteId } from '../lib/router';
import { Icon, type IconName } from './Icon';


// Masaüstü ve simge menüdeki sıra; telefonda "Yanıt kalitesi" Daha fazla sayfasına geçer
const NAV: { id: RouteId; icon: IconName }[] = [
  { id: 'ask', icon: 'ask' },
  { id: 'documents', icon: 'documents' },
  { id: 'history', icon: 'history' },
  { id: 'quality', icon: 'quality' }
];
const TABS: { id: RouteId; icon: IconName }[] = [
  { id: 'ask', icon: 'ask' },
  { id: 'documents', icon: 'documents' },
  { id: 'history', icon: 'history' },
  { id: 'more', icon: 'more' }
];

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-t">Tolka</span> <span className="wordmark-p">{t('app.name')}</span>
    </span>
  );
}

/** Dil ve tema seçicileri: menünün altında ve telefonda "Daha fazla" sayfasında aynı bileşen */
export function PrefControls() {
  const { prefs, set } = usePrefs();
  // Menüde ve "Daha fazla" sayfasında aynı anda bulunabilir; kimlikler çakışmasın
  const id = useId();
  return (
    <div className="prefs">
      <div className="pref">
        <span className="pref-k" id={`${id}-lang`}>{t('lang')}</span>
        <div className="seg" role="group" aria-labelledby={`${id}-lang`}>
          <button type="button" lang="en" aria-pressed={prefs.lang === 'en'} onClick={() => set({ lang: 'en' })}>English</button>
          <button type="button" lang="tr" aria-pressed={prefs.lang === 'tr'} onClick={() => set({ lang: 'tr' })}>Türkçe</button>
        </div>
      </div>
      <div className="pref">
        <span className="pref-k" id={`${id}-theme`}>{t('theme')}</span>
        <div className="seg" role="group" aria-labelledby={`${id}-theme`}>
          <button type="button" aria-pressed={prefs.theme === 'light'} onClick={() => set({ theme: 'light' })}>{t('theme.light')}</button>
          <button type="button" aria-pressed={prefs.theme === 'dark'} onClick={() => set({ theme: 'dark' })}>{t('theme.dark')}</button>
        </div>
      </div>
    </div>
  );
}

/** Hesap değiştirme isteği (main.tsx giriş ekranını açar) */
export const switchAccount = () => window.dispatchEvent(new Event('tolka:switch'));
export const openGuide = () => window.dispatchEvent(new Event('tolka:guide'));

export function Who() {
  const a = currentAccount();
  if (!a) return null;
  return (
    <div className="who">
      <span className="avatar" aria-hidden="true">{a.initials}</span>
      <span className="who-txt">
        <span className="sr-only">{t('account')}: </span>
        <b>{a.name}</b>
        <span>{t(`job.${a.role}` as const)} · {t(`jobteam.${a.role}` as const)}</span>
      </span>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { route } = useRoute();
  const { prefs, set } = usePrefs();
  const current = (id: RouteId) => (id === route ? 'page' : undefined);
  // Yanıt kalitesi yalnızca bilgi yönetiminin menüsünde
  const nav = NAV.filter((n) => n.id !== 'quality' || currentAccount()?.role === 'knowledge');

  return (
    <div className="shell">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('skip')}
      </a>

      {/* 768 px ve üstü: sol menü (1280'den dar ekranda yalnızca simgeler) */}
      <nav className="side" aria-label={t('nav.label')}>
        <a className="side-brand" href={href('ask')}>
          <Wordmark />
          <span className="mono-mark" aria-hidden="true">T</span>
        </a>
        <ul className="side-list">
          {nav.map((n) => (
            <li key={n.id}>
              <a href={href(n.id)} aria-current={current(n.id)}>
                <Icon name={n.icon} />
                <span className="side-lbl">{t(`nav.${n.id}` as const)}</span>
                <span className="tip" aria-hidden="true">{t(`nav.${n.id}` as const)}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="side-foot">
          <Who />
          <button type="button" className="linkish switch" onClick={switchAccount}>{t('acct.switch')}</button>
          <button type="button" className="linkish guide-link" onClick={openGuide}>{t('nav.guide')}</button>
          <div className="side-prefs"><PrefControls /></div>
          {/* Simge menüde dil ve tema tek düğmeyle değişir */}
          <div className="rail-prefs">
            <button type="button" className="rail-btn" onClick={switchAccount}>
              <span className="avatar" aria-hidden="true">{currentAccount()?.initials}</span>
              <span className="sr-only">{t('acct.switch')}</span>
              <span className="tip" aria-hidden="true">{t('acct.switch')}</span>
            </button>
            <button type="button" className="rail-btn" onClick={openGuide}>
              <span aria-hidden="true">?</span>
              <span className="sr-only">{t('nav.guide')}</span>
              <span className="tip" aria-hidden="true">{t('nav.guide')}</span>
            </button>
            <button type="button" className="rail-btn" onClick={() => set({ lang: prefs.lang === 'en' ? 'tr' : 'en' })}>
              <span aria-hidden="true">{prefs.lang === 'en' ? 'TR' : 'EN'}</span>
              <span className="sr-only">{t('lang.switch')}</span>
              <span className="tip" aria-hidden="true">{t('lang.switch')}</span>
            </button>
            <button type="button" className="rail-btn" onClick={() => set({ theme: prefs.theme === 'light' ? 'dark' : 'light' })}>
              <Icon name={prefs.theme === 'light' ? 'moon' : 'sun'} />
              <span className="sr-only">{t(prefs.theme === 'light' ? 'theme.toDark' : 'theme.toLight')}</span>
              <span className="tip" aria-hidden="true">{t(prefs.theme === 'light' ? 'theme.toDark' : 'theme.toLight')}</span>
            </button>
          </div>
          <a className="concept" href={t('concept.url')} target="_blank" rel="noopener">
            <span className="concept-long">{t('concept.by')}</span>
            <span className="concept-short" aria-hidden="true">{t('concept')}</span>
            <span className="sr-only concept-sr">{t('concept.by')}</span>
          </a>
        </div>
      </nav>

      {/* 767 px ve altı: üst çubuk + alt sekmeler */}
      <header className="bar">
        <a className="bar-brand" href={href('ask')}><Wordmark /></a>
        <a className="bar-concept" href={t('concept.url')} target="_blank" rel="noopener">
          <span aria-hidden="true">{t('concept')}</span>
          <span className="sr-only">{t('concept.by')}</span>
        </a>
      </header>

      <main id="main" tabIndex={-1}>{children}</main>

      <nav className="tabs" aria-label={t('nav.label')}>
        {TABS.map((n) => (
          <a key={n.id} href={href(n.id)} aria-current={current(n.id) ?? (n.id === 'more' && route === 'quality' ? 'page' : undefined)}>
            <Icon name={n.icon} />
            <span>{t(`nav.${n.id}` as const)}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
