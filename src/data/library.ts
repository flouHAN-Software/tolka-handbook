// Kütüphane: belgeler ve onlardan türetilen durumlar (gözden geçirme, erişim, parça sayısı).
import { authorityLimits, claimsManual, eowGuide, fraudIndicators } from './docs/claims';
import { callGuide, complaints, ipid, surveyorPanel, vulnerable } from './docs/other';
import { policy2024, policy2026 } from './docs/policy';
import { uploads } from './uploads';
import { DEMO_TODAY, type Block, type Doc, type RoleId } from './types';

/** Kurumun hazır belgeleri */
export const DOCS: Doc[] = [
  policy2026, ipid, claimsManual, eowGuide, authorityLimits, fraudIndicators,
  callGuide, complaints, vulnerable, surveyorPanel, policy2024
];

/** Hazır belgeler + bu tarayıcıda eklenenler (en yenisi başta) */
export const allDocs = (): Doc[] => [...uploads(), ...DOCS];

export const docById = (id: string) => allDocs().find((d) => d.id === id);

export const canOpen = (d: Doc, role: RoleId) => d.audience.includes(role);

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

export type Review =
  | { state: 'superseded' }
  | { state: 'overdue'; days: number }
  | { state: 'soon'; days: number }
  | { state: 'ok'; days: number };

/** Gözden geçirme durumu: önceki sürümler gözden geçirilmez; 30 gün içinde dolacaksa "yakında" */
export function review(d: Doc): Review {
  if (d.supersededBy) return { state: 'superseded' };
  const left = days(DEMO_TODAY, d.reviewDue);
  if (left < 0) return { state: 'overdue', days: -left };
  if (left <= 30) return { state: 'soon', days: left };
  return { state: 'ok', days: left };
}

/** Aramada kullanılan parça sayısı: her madde bir parça, tablolar satır satır */
export function passages(d: Doc) {
  let n = 0;
  for (const s of d.sections) for (const c of s.clauses) {
    n += 1;
    for (const b of c.blocks as Block[]) if (b.t === 'table') n += b.rows.length;
  }
  return n;
}

/** Bir belgenin bütün sürümleri, yeniden eskiye */
export function versions(d: Doc): Doc[] {
  const out: Doc[] = [];
  let cur: Doc | undefined = d;
  while (cur?.supersededBy) cur = docById(cur.supersededBy);
  while (cur) {
    out.push(cur);
    cur = cur.supersedes ? docById(cur.supersedes) : undefined;
  }
  return out;
}
