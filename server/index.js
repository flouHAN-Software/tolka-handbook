// Cloudflare Worker: /api/handbook/… yanıt ucuna gider (handbook.js), geri kalan her şey derlenmiş uygulamadır (dist/).
import { handbook, HandbookMeter } from './handbook.js';

// Durable Object sınıfı ana modülden dışa aktarılmalı (wrangler.jsonc → durable_objects)
export { HandbookMeter };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/handbook/')) return handbook(request, env, url);
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  }
};
