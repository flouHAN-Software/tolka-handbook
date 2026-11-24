// Kendi ikon setimiz: 20 px ızgara, 1,6 çizgi kalınlığı. Hazır set kullanılmaz.
const PATHS = {
  ask: <path d="M4 4.5h12v8.5H9l-3.5 3v-3H4z" strokeLinejoin="round" />,
  documents: (
    <>
      <path d="M5 3.5h7l3 3v10H5z" strokeLinejoin="round" />
      <path d="M12 3.5v3h3M7.5 10h5M7.5 13h5" strokeLinecap="round" />
    </>
  ),
  history: (
    <>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5V10l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  quality: <path d="M4 16V9M8 16V5M12 16v-4M16 16V7" strokeLinecap="round" />,
  more: (
    <>
      <circle cx="5" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" strokeLinecap="round" />
    </>
  ),
  moon: <path d="M15.5 12.2A6 6 0 0 1 7.8 4.5a6 6 0 1 0 7.7 7.7z" strokeLinejoin="round" />,
  external: <path d="M8 4.5H4.5v11h11V12M11 4.5h4.5V9M15.5 4.5L9 11" strokeLinecap="round" strokeLinejoin="round" />
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
