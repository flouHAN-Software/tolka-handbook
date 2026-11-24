import type { ReactNode } from 'react';
import type { Classification } from '../data/types';
import { t } from '../lib/i18n';

/** Gizlilik düzeyi: renkle değil dolguyla artar; en üst düzeyde kilit */
export function ClassLabel({ c }: { c: Classification }) {
  return (
    <span className={`lbl lbl-${c}`}>
      {c === 'strict' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M3 5V3.8a3 3 0 0 1 6 0V5h.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 2 10.5v-5a.5.5 0 0 1 .5-.5zm1.5 0h3V3.8a1.5 1.5 0 0 0-3 0z" />
        </svg>
      )}
      {t(`cls.${c}` as const)}
    </span>
  );
}

const STATUS_ICON = {
  ok: <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />,
  run: <circle cx="8" cy="8" r="5.5" strokeDasharray="3 2.6" />,
  warn: (
    <>
      <path d="M8 2.5l6 11H2z" strokeLinejoin="round" />
      <path d="M8 7v2.5" strokeLinecap="round" />
    </>
  ),
  err: <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
};

/** Durum: simge + renk + yazı birlikte (renk körü biri de ayırt eder) */
export function Status({ kind, children }: { kind: keyof typeof STATUS_ICON; children: ReactNode }) {
  return (
    <span className={`st st-${kind}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {STATUS_ICON[kind]}
      </svg>
      <span>{children}</span>
    </span>
  );
}
