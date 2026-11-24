import { Icon } from '../components/Icon';
import { openGuide } from '../components/Shell';
import { t } from '../lib/i18n';
import type { Key } from '../lib/strings';

// "Bu proje hakkında" (altın kural 5): nasıl kullanılır, bu projede yapılan işler, kullanılan diller ve araçlar,
// bu yapıyla neler yapılabilir, telif ve lisans. Yalnızca projede gerçekten kullanılan beceri ve araçlar yazılır.
const GITHUB = 'https://github.com/flouHAN-Software/tolka-handbook';

const STEPS: Key[] = ['ab.use1', 'ab.use2', 'ab.use3', 'ab.use4', 'ab.use5', 'ab.use6'];

const SKILLS: Key[] = ['ab.sk.ai', 'ab.sk.api', 'ab.sk.search', 'ab.sk.docs', 'ab.sk.access', 'ab.sk.auto', 'ab.sk.a11y', 'ab.sk.lang'];

// Araç adları özel addır; iki dilde aynı yazılır
const TOOLS: [Key, string][] = [
  ['ab.tl.lang', 'TypeScript, JavaScript, HTML, CSS'],
  ['ab.tl.ui', 'React 19, Vite'],
  ['ab.tl.server', 'Cloudflare Workers, Durable Objects (SQLite)'],
  ['ab.tl.ai', 'Gemma 4 · Cloudflare Workers AI'],
  ['ab.tl.docs', 'pdf.js'],
  ['ab.tl.test', 'Playwright, axe-core, ffmpeg'],
  ['ab.tl.type', 'Atkinson Hyperlegible Next, Source Serif 4']
];

const USES: Key[] = ['ab.uses1', 'ab.uses2', 'ab.uses3', 'ab.uses4', 'ab.uses5', 'ab.uses6'];

export function About() {
  return (
    <div className="page about">
      <header className="page-head">
        <p className="ab-kicker">{t('concept.by')}</p>
        <h1>{t('nav.about')}</h1>
        <p>{t('ab.lead')}</p>
      </header>

      <section className="ab-sec" aria-labelledby="ab-use">
        <h2 id="ab-use">{t('ab.use')}</h2>
        <ol className="ab-steps">
          {STEPS.map((k) => <li key={k}>{t(k)}</li>)}
        </ol>
        <button type="button" className="btn" onClick={openGuide}>{t('ab.guide')}</button>
      </section>

      <section className="ab-sec" aria-labelledby="ab-built">
        <h2 id="ab-built">{t('ab.built')}</h2>
        <p className="ab-sub">{t('ab.built.lead')}</p>
        <dl className="ab-skills">
          {SKILLS.map((k) => (
            <div key={k}>
              <dt>{t(k)}</dt>
              <dd>{t(`${k}.d` as Key)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ab-sec" aria-labelledby="ab-tools">
        <h2 id="ab-tools">{t('ab.tools')}</h2>
        <dl className="ab-tools">
          {TOOLS.map(([k, v]) => (
            <div key={k}>
              <dt>{t(k)}</dt>
              <dd lang="en">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ab-sec" aria-labelledby="ab-uses">
        <h2 id="ab-uses">{t('ab.uses')}</h2>
        <ul className="ab-uses">
          {USES.map((k) => <li key={k}>{t(k)}</li>)}
        </ul>
        <a className="btn" href={t('ab.quote.url')} target="_blank" rel="noopener">
          {t('ab.quote')}
          <Icon name="external" size={16} />
        </a>
      </section>

      <section className="ab-sec ab-licence" aria-labelledby="ab-licence">
        <h2 id="ab-licence">{t('ab.licence')}</h2>
        <p className="ab-copy">{t('copy')}</p>
        <p>{t('ab.licence1')}</p>
        <p>{t('concept.note')}</p>
        <ul className="ab-links">
          <li>
            <a href={GITHUB} target="_blank" rel="noopener">{t('ab.source')}<Icon name="external" size={16} /></a>
          </li>
          <li>
            <a href={t('concept.url')} target="_blank" rel="noopener">{t('ab.case')}<Icon name="external" size={16} /></a>
          </li>
        </ul>
      </section>
    </div>
  );
}
