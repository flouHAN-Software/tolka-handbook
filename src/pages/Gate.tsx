import { currentRole } from '../lib/account';
import { t } from '../lib/i18n';
import { href } from '../lib/router';

/** Rolün açamadığı ekran: neden göremediği ve ne yapabileceği (GOV.UK: yetki yokluğu hata mesajıyla değil, açıklamayla) */
export function Gate() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t('gate.title')}</h1>
        <p>{t('gate.text', { role: t(`job.${currentRole()}` as const) })}</p>
      </header>
      <p className="gate-back"><a href={href('ask')}>{t('nav.ask')}</a></p>
    </div>
  );
}
