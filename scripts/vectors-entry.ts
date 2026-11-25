// export-vectors.mjs için: kurumun belgelerindeki bölümler ve gömme modeline verilen metinleri (uygulamanın kendi koduyla).
import { DOCS } from '../src/data/library';
import { passagesOf } from '../src/lib/search';
import { embedText } from '../src/lib/vectors';

export function items() {
  return DOCS.flatMap((d) => passagesOf(d).map((p) => ({ key: p.key, text: embedText(p) })));
}
