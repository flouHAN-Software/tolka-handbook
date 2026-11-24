// Yanıt kalitesi (Intercom Fin'den): Handbook'un yanıtlayamadığı ya da yanıtının işe yaramadığı sorular,
// eksiğin türüne göre gruplanır. Geçmiş kayıtlar kurgusaldır (elle yazıldı); bu tarayıcıda "bilgi yönetimine gönderilen"
// sorular da canlı olarak eklenir. Atama ve çözüldü işaretleri bu tarayıcıda saklanır.
import { useSyncExternalStore } from 'react';
import { load, save } from '../lib/storage';
import type { AnswerData } from './answer';
import { overdueSources } from './answer';
import { docById } from './library';
import type { Person, RoleId } from './types';

export type Gap = 'conflict' | 'missing' | 'outdated' | 'unread' | 'unhelpful';

export interface Asked { q: string; at: string; role: RoleId; by: string; live?: boolean }

export interface Issue {
  id: string;
  gap: Gap;
  /** Konu: kurumun bilgi yönetimi ekibinin yazdığı başlık (veri, İngilizce) */
  title: string;
  /** Ne eksik ya da yanlış: belgeden somut ayrıntı */
  detail: string;
  docs: { id: string; at?: string }[];
  owner: Person;
  asked: Asked[];
  status: 'open' | 'assigned' | 'resolved';
  assignedAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

const SEED: Issue[] = [
  {
    id: 'q-eow-excess', gap: 'conflict', status: 'open',
    title: 'Escape of water excess: €350 or €400?',
    detail: 'The Escape of Water Claims Guide 3.1 (4.1) still says €350. Policy wording 2026.1 (7.3(a)) says €400 for losses from 1 March 2026.',
    docs: [{ id: 'eow-guide', at: '4.1' }, { id: 'home-policy-2026', at: '7.3' }],
    owner: { name: 'Eoin Farrell', team: 'household' },
    asked: [
      { q: 'Is the escape of water excess €350 or €400?', at: '2026-11-19T09:42', role: 'care', by: 'NG' },
      { q: 'Customer read €350 in a letter template. Which excess do I quote?', at: '2026-11-20T14:05', role: 'care', by: 'SK' },
      { q: 'Excess for a burst pipe in April 2026?', at: '2026-11-22T11:18', role: 'claims', by: 'CB' }
    ]
  },
  {
    id: 'q-eow-unoccupied', gap: 'conflict', status: 'open',
    title: 'Unoccupied homes: 30 days or 45?',
    detail: 'The Escape of Water Claims Guide 3.1 (4.3) says 30 days. Policy wording 2026.1 (7.3(c)) says 45 days in a row.',
    docs: [{ id: 'eow-guide', at: '4.3' }, { id: 'home-policy-2026', at: '7.3' }],
    owner: { name: 'Eoin Farrell', team: 'household' },
    asked: [
      { q: 'How long can a house be empty before escape of water isn’t covered?', at: '2026-11-18T10:30', role: 'claims', by: 'RN' },
      { q: 'Holiday home empty since mid-October, pipe burst last week. Covered?', at: '2026-11-21T16:12', role: 'care', by: 'NG' }
    ]
  },
  {
    id: 'q-ebike', gap: 'missing', status: 'open',
    title: 'E-bikes and e-scooters: contents or motor vehicles?',
    detail: 'Definition 2.2 excludes motor vehicles from contents but does not say whether e-bikes or e-scooters count as motor vehicles.',
    docs: [{ id: 'home-policy-2026', at: '2.2' }],
    owner: { name: 'Gráinne Walsh', team: 'underwriting' },
    asked: [
      { q: 'Is an e-bike stolen from a locked shed covered?', at: '2026-11-17T12:44', role: 'care', by: 'NG' },
      { q: 'Electric scooter stolen from the hall. Is it contents?', at: '2026-11-23T09:15', role: 'claims', by: 'CB' }
    ]
  },
  {
    id: 'q-solar', gap: 'missing', status: 'open',
    title: 'Solar panels: buildings, and is hail a storm?',
    detail: 'Neither the policy wording nor the claims manual mentions solar panels or hail.',
    docs: [{ id: 'home-policy-2026', at: '2.1' }],
    owner: { name: 'Gráinne Walsh', team: 'underwriting' },
    asked: [
      { q: 'Are solar panels on the roof part of the buildings?', at: '2026-11-12T15:20', role: 'claims', by: 'CB' },
      { q: 'Hail cracked the solar panels. Is that storm damage?', at: '2026-11-16T10:02', role: 'claims', by: 'RN' }
    ]
  },
  {
    id: 'q-surveyors', gap: 'unread', status: 'open',
    title: 'Surveyor panel: the list couldn’t be read',
    detail: 'Surveyor Panel 2025.pdf was added on 20 Nov 2026 as a scan with no text layer, so it can’t be searched.',
    docs: [{ id: 'surveyor-panel' }],
    owner: { name: 'Ruairí Nolan', team: 'household' },
    asked: [
      { q: 'Which surveyor covers Galway?', at: '2026-11-21T11:40', role: 'claims', by: 'CB' },
      { q: 'Who is on the surveyor panel for subsidence in Cork?', at: '2026-11-22T14:58', role: 'claims', by: 'RN' }
    ]
  },
  {
    id: 'q-authority', gap: 'outdated', status: 'assigned', assignedAt: '2026-11-15T09:10',
    title: 'Delegated authority limits are overdue for review',
    detail: 'The 2025 limits were due for review on 12 Oct 2026. Answers that use them say so.',
    docs: [{ id: 'authority-limits', at: '1.1' }],
    owner: { name: 'Martina Quinn', team: 'leadership' },
    asked: [{ q: 'Has the senior claims handler limit changed this year?', at: '2026-11-14T16:25', role: 'claims', by: 'CB' }]
  },
  {
    id: 'q-kennels', gap: 'missing', status: 'resolved', resolvedAt: '2026-11-10T11:30',
    resolution: 'Clause 11.1 of policy wording 2026.1 now says “for you and your pets”. The Handbook answers this from 11.1.',
    title: 'Pets when the family has to move out',
    detail: 'Alternative accommodation did not mention pets.',
    docs: [{ id: 'home-policy-2026', at: '11.1' }],
    owner: { name: 'Gráinne Walsh', team: 'underwriting' },
    asked: [{ q: 'Will we pay for kennels if the family has to move out?', at: '2026-11-03T13:05', role: 'care', by: 'SK' }]
  }
];

/** Bu tarayıcıda yapılan değişiklikler (atama, çözüldü) */
type Change = Pick<Issue, 'status' | 'assignedAt' | 'resolvedAt' | 'resolution'>;
let changes: Record<string, Change> = load('issues', {});
let version = 0;
const listeners = new Set<() => void>();

export function useIssues() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );
}

function setChange(id: string, c: Change | null) {
  const next = { ...changes };
  if (c) next[id] = c;
  else delete next[id];
  changes = next;
  save('issues', changes);
  version++;
  listeners.forEach((l) => l());
}

export const assign = (i: Issue) => setChange(i.id, { status: 'assigned', assignedAt: new Date().toISOString() });
export const resolve = (i: Issue, note: string) => setChange(i.id, { status: 'resolved', resolvedAt: new Date().toISOString(), resolution: note });
export const reopen = (i: Issue) => setChange(i.id, { status: 'open' });

const KNOWLEDGE: Person = { name: 'Declan Moran', team: 'knowledge' };

/** Canlı soruların hangi gruba düştüğü: yanıt yoksa "belgelerde yok", kaynak gecikmişse "gecikmiş", yoksa "işe yaramadı" */
function liveGap(a: AnswerData): Gap {
  if (a.kind === 'none') return 'missing';
  if (overdueSources(a).length) return 'outdated';
  return 'unhelpful';
}

/** Bütün konular: kurgusal geçmiş + bu tarayıcıda bilgi yönetimine gönderilen sorular */
export function issues(convs: { by?: string; items: AnswerData[] }[], initials: (by?: string) => string, roleOf: (by?: string) => RoleId): Issue[] {
  const out = SEED.map((s) => ({ ...s, ...(changes[s.id] ?? {}) }));
  const live = new Map<Gap, Asked[]>();
  const liveDocs = new Map<Gap, Set<string>>();
  for (const c of convs) {
    for (const a of c.items) {
      if (!a.handoff) continue;
      const g = liveGap(a);
      live.set(g, [...(live.get(g) ?? []), { q: a.q, at: a.handoff.at, role: roleOf(c.by), by: initials(c.by), live: true }]);
      const ds = liveDocs.get(g) ?? new Set<string>();
      (g === 'outdated' ? overdueSources(a).map((d) => d.id) : a.cites.map((x) => x.docId)).forEach((id) => ds.add(id));
      liveDocs.set(g, ds);
    }
  }
  for (const [g, asked] of live) {
    const id = `live-${g}`;
    const docs = [...(liveDocs.get(g) ?? [])].filter((d) => docById(d)).map((d) => ({ id: d }));
    const owner = docs.length && g === 'outdated' ? docById(docs[0].id)!.owner : KNOWLEDGE;
    out.unshift({
      id, gap: g, status: changes[id]?.status ?? 'open',
      assignedAt: changes[id]?.assignedAt, resolvedAt: changes[id]?.resolvedAt, resolution: changes[id]?.resolution,
      title: LIVE_TITLE[g], detail: LIVE_DETAIL[g], docs, owner,
      asked: asked.sort((x, y) => y.at.localeCompare(x.at))
    });
  }
  return out;
}

const LIVE_TITLE: Record<Gap, string> = {
  missing: 'Sent from the Handbook: not in the documents',
  unhelpful: 'Sent from the Handbook: the answer didn’t help',
  outdated: 'Sent from the Handbook: answered from a document overdue for review',
  conflict: 'Sent from the Handbook: documents disagree',
  unread: 'Sent from the Handbook: document couldn’t be read'
};
const LIVE_DETAIL: Record<Gap, string> = {
  missing: 'Staff asked these questions this week and the documents they can open didn’t cover them.',
  unhelpful: 'The Handbook found passages, but staff said they didn’t answer the question.',
  outdated: 'The answers relied on a document whose review date has passed.',
  conflict: 'The answers drew on documents that say different things.',
  unread: 'The answers needed a document that couldn’t be read.'
};

export const latest = (i: Issue) => i.asked.reduce((m, a) => (a.at > m ? a.at : m), '');
