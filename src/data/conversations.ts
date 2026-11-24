import { useSyncExternalStore } from 'react';
import { currentAccount } from '../lib/account';
import { load, save } from '../lib/storage';
import type { AnswerData } from './answer';

// Konuşmalar bu tarayıcıda saklanır; Geçmiş ekranı bunları listeler.
export interface Conversation {
  id: string;
  title: string;
  created: string;
  items: AnswerData[];
  /** Konuşmayı açan hesap; herkes yalnızca kendi geçmişini görür */
  by?: string;
}

let list: Conversation[] = load<Conversation[]>('conversations', []);
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  save('conversations', list);
  listeners.forEach((l) => l());
}

export function useConversations() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );
  return mine();
}

const me = () => currentAccount()?.id ?? 'ciaran';
/** Bütün hesapların konuşmaları (yalnızca Yanıt kalitesi ekranı, aktarılan soruları toplamak için) */
export const allConversations = () => list;
/** Giriş yapan hesabın konuşmaları */
export const mine = () => list.filter((c) => (c.by ?? 'ciaran') === me());

export const conversationById = (id?: string) => (id ? mine().find((c) => c.id === id) : undefined);

/** Yanıtı konuşmaya ekler; konuşma yoksa açar. Konuşmanın kimliğini döner */
export function addAnswer(convId: string | undefined, a: AnswerData): string {
  const c = conversationById(convId);
  if (c) {
    list = list.map((x) => (x.id === c.id ? { ...x, items: [...x.items, a] } : x));
    emit();
    return c.id;
  }
  const id = 'c-' + Date.now().toString(36);
  list = [{ id, title: a.q.length > 80 ? a.q.slice(0, 77).trimEnd() + '…' : a.q, created: a.askedAt, items: [a], by: me() }, ...list];
  emit();
  return id;
}

/** Model yanıtı gelince (ya da yedek moda dönünce) yanıt güncellenir */
export function updateAnswer(convId: string, answerId: string, next: AnswerData) {
  list = list.map((c) => (c.id !== convId ? c : { ...c, items: c.items.map((a) => (a.id === answerId ? { ...next, id: answerId } : a)) }));
  emit();
}

/** "Bilgi yönetimine gönder": yanıta gönderildiği zamanı yazar (Yanıt kalitesi ekranı bunları toplar) */
export function markHandoff(convId: string, answerId: string) {
  const at = new Date().toISOString();
  list = list.map((c) => (c.id !== convId ? c : { ...c, items: c.items.map((a) => (a.id === answerId ? { ...a, handoff: { at } } : a)) }));
  emit();
}
