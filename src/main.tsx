import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/source-serif-4/opsz-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/page.css';
import './styles/common.css';
import './styles/documents.css';
import './styles/add.css';
import './styles/ask.css';
import './styles/viewer.css';
import './styles/signin.css';
import './styles/quality.css';
import './styles/guide.css';
import App from './App';
import { PrefsProvider, usePrefs } from './lib/i18n';
import { AccountProvider, useAccount, type AccountId } from './lib/account';
import { SignIn } from './components/SignIn';
import { Guide } from './components/Guide';

// Dil ya da hesap değişince uygulama yeniden kurulur (metinler ve yetkiler yeniden hesaplanır); veri ve adres yerinde kalır.
// Giriş yapılmamışsa ya da "Hesap değiştir" seçildiyse önce giriş ekranı gelir.
function Root() {
  const { prefs } = usePrefs();
  const { account } = useAccount();
  const [switching, setSwitching] = useState<AccountId | null>(null);
  // Rehber: ilk girişte ve menüdeki "Nasıl kullanılır" ile açılır
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    const on = () => setGuide(true);
    window.addEventListener('tolka:guide', on);
    return () => window.removeEventListener('tolka:guide', on);
  }, []);
  const showGuide = guide || !prefs.guideSeen;
  const guideEl = showGuide && <Guide onClose={() => setGuide(false)} />;
  useEffect(() => {
    const on = () => setSwitching(account?.id ?? null);
    window.addEventListener('tolka:switch', on);
    return () => window.removeEventListener('tolka:switch', on);
  }, [account?.id]);
  useEffect(() => setSwitching(null), [account?.id]);
  if (!account || switching) {
    return <>{<SignIn key={prefs.lang} back={switching ?? undefined} onBack={() => setSwitching(null)} />}{guideEl}</>;
  }
  return <><App key={prefs.lang + account.id} />{guideEl}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <AccountProvider>
        <Root />
      </AccountProvider>
    </PrefsProvider>
  </StrictMode>
);
