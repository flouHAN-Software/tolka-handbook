import { useSyncExternalStore } from 'react';

// Model yazarken gelen metin: yalnızca bellekte tutulur (sayfa yenilenirse yarım metin saklanmaz).
// Yanıt bitince yerini denetlenmiş, kaynak numaraları verilmiş metin alır.
const texts = new Map<string, string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setStream(id: string, text: string) {
  texts.set(id, text);
  emit();
}

export function clearStream(id: string) {
  if (texts.delete(id)) emit();
}

export function useStream(id: string) {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => texts.get(id) ?? ''
  );
}

/** Yazılırken gösterilen metin: kaynak numaraları yanıt bitince eklenir; yarım gelmiş "[2" gibi parçalar gizlenir */
export const streamView = (s: string) =>
  s
    .replace(/\s?\[[^\]\n]*\]/g, '')
    .replace(/\s?\[[^\]\n]*$/, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    // sunucu sonuçta cümle başındaki "Eğer"i atar; yazılırken de aynısı görünsün
    .replace(/(^|[.!?]\s+)Eğer\s+(\p{L})/gu, (_m, a: string, c: string) => a + c.toLocaleUpperCase('tr'));
