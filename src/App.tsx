import { useEffect, useRef } from 'react';
import { Shell } from './components/Shell';
import { t } from './lib/i18n';
import { ROUTE_TITLE, useRoute } from './lib/router';
import { Ask } from './pages/ask/Ask';
import { Documents } from './pages/documents/Documents';
import { More } from './pages/More';
import { History } from './pages/History';
import { Quality } from './pages/quality/Quality';
import { Gate } from './pages/Gate';
import { currentRole } from './lib/account';

export default function App() {
  const { route } = useRoute();
  const prev = useRef(route);

  // Sekme başlığı ekranın adıyla başlar. Ekran değişince odak içeriğe taşınır ve sayfa başa döner
  // (ekran okuyucu yeni ekranı duyar); ilk açılışta odak yerinde kalır.
  useEffect(() => {
    document.title = `${t(ROUTE_TITLE[route])} · Tolka Handbook`;
    if (prev.current === route) return;
    prev.current = route;
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [route]);

  let page;
  switch (route) {
    case 'ask':
      page = <Ask />;
      break;
    case 'documents':
      page = <Documents />;
      break;
    case 'history':
      page = <History />;
      break;
    case 'quality':
      page = currentRole() === 'knowledge' ? <Quality /> : <Gate />;
      break;
    case 'more':
      page = <More />;
      break;
  }

  return <Shell>{page}</Shell>;
}
