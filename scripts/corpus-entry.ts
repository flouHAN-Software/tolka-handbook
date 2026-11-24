// Sunucudaki yetki denetimi için kurumun hazır belgeleri: her belgenin kimlere açık olduğu ve modele gönderilen her bölümün metni.
// export-corpus.mjs bunu derleyip çalıştırır; uygulamanın kendi kodu kullanıldığı için tarayıcının gönderdiği metinle birebir aynıdır.
import { DOCS } from '../src/data/library';
import { passagesOf } from '../src/lib/search';
import { toModel } from '../src/lib/ai';

export function corpus() {
  return DOCS.map((d) => ({
    id: d.id,
    audience: d.audience,
    passages: passagesOf(d).map((p) => ({ key: p.key, text: toModel(p).text }))
  }));
}
