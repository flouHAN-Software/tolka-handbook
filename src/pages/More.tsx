import { Icon } from '../components/Icon';
import { PrefControls, Who, openGuide, switchAccount } from '../components/Shell';
import { currentAccount } from '../lib/account';
import { t } from '../lib/i18n';
import { href } from '../lib/router';

/** Telefonda alt sekmelere sığmayanlar: Yanıt kalitesi, hesap, dil, tema, konsept notu */
export function More() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t('more.title')}</h1>
      </header>
      {currentAccount()?.role === 'knowledge' && (
        <nav className="more-list" aria-label={t('more.title')}>
          <a className="more-row" href={href('quality')}>
            <Icon name="quality" />
            {t('nav.quality')}
          </a>
        </nav>
      )}
      <div className="more-block">
        <Who />
        <button type="button" className="btn" onClick={switchAccount}>{t('acct.switch')}</button>
      </div>
      <div className="more-block">
        <PrefControls />
      </div>
      <div className="more-block">
        <button type="button" className="btn" onClick={openGuide}>{t('nav.guide')}</button>
      </div>
      <div className="more-note">
        <p>{t('concept.note')}</p>
        <a href={t('concept.url')} target="_blank" rel="noopener">
          {t('concept.by')}
          <Icon name="external" size={16} />
        </a>
      </div>
    </div>
  );
}
