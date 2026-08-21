/**
 * Icônes du back-office.
 *
 * Même règle que `components/icons.tsx` : aucune dépendance, un SVG au trait
 * sur la grille de 24, même épaisseur, `currentColor` partout. Les icônes de la
 * vitrine restent dans leur fichier — celles-ci ne servent qu'à l'administration.
 */

type Props = { className?: string };

const base = "h-[18px] w-[18px]";

function Svg({ className = base, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconGrid({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  );
}

export function IconBox({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M20.5 8.2v7.6a1.6 1.6 0 0 1-.85 1.4l-6.8 3.6a1.7 1.7 0 0 1-1.7 0l-6.8-3.6a1.6 1.6 0 0 1-.85-1.4V8.2" />
      <path d="M3.9 7.4 12 3.2l8.1 4.2-8.1 4.3z" />
      <path d="M12 11.7V20" />
    </Svg>
  );
}

export function IconTagAdmin({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3.6 11.2V5.3a1.7 1.7 0 0 1 1.7-1.7h5.9c.45 0 .88.18 1.2.5l7 7a1.7 1.7 0 0 1 0 2.4l-5.9 5.9a1.7 1.7 0 0 1-2.4 0l-7-7a1.7 1.7 0 0 1-.5-1.2Z" />
      <circle cx="7.9" cy="7.9" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPercent({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M19 5 5 19" />
      <circle cx="7.6" cy="7.6" r="2.6" />
      <circle cx="16.4" cy="16.4" r="2.6" />
    </Svg>
  );
}

export function IconCart({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3 4h2.2l2.3 10.4a1.7 1.7 0 0 0 1.66 1.3h7.9a1.7 1.7 0 0 0 1.66-1.28L20.5 8H6.2" />
      <circle cx="10" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </Svg>
  );
}

export function IconUsers({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="9.6" cy="8.4" r="3.4" />
      <path d="M3.4 19.6a6.3 6.3 0 0 1 12.4 0" />
      <path d="M16.6 5.6a3.2 3.2 0 0 1 0 6" />
      <path d="M18.2 14.4a5.6 5.6 0 0 1 2.5 4.4" />
    </Svg>
  );
}

export function IconSliders({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7h9M17.5 7H20M4 17h3M11.5 17H20M4 12h5.5M14 12H20" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9.4" cy="17" r="2" />
      <circle cx="11.8" cy="12" r="2" />
    </Svg>
  );
}

export function IconGear({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.3 14.3a1.4 1.4 0 0 0 .28 1.55l.05.05a1.7 1.7 0 1 1-2.4 2.4l-.05-.05a1.4 1.4 0 0 0-1.55-.28 1.4 1.4 0 0 0-.85 1.29v.14a1.7 1.7 0 1 1-3.4 0v-.07a1.4 1.4 0 0 0-.92-1.29 1.4 1.4 0 0 0-1.55.28l-.05.05a1.7 1.7 0 1 1-2.4-2.4l.05-.05a1.4 1.4 0 0 0 .28-1.55 1.4 1.4 0 0 0-1.29-.85h-.14a1.7 1.7 0 1 1 0-3.4h.07a1.4 1.4 0 0 0 1.29-.92 1.4 1.4 0 0 0-.28-1.55l-.05-.05a1.7 1.7 0 1 1 2.4-2.4l.05.05a1.4 1.4 0 0 0 1.55.28h.07a1.4 1.4 0 0 0 .85-1.29v-.14a1.7 1.7 0 1 1 3.4 0v.07a1.4 1.4 0 0 0 .85 1.29 1.4 1.4 0 0 0 1.55-.28l.05-.05a1.7 1.7 0 1 1 2.4 2.4l-.05.05a1.4 1.4 0 0 0-.28 1.55v.07a1.4 1.4 0 0 0 1.29.85h.14a1.7 1.7 0 1 1 0 3.4h-.07a1.4 1.4 0 0 0-1.29.85Z" />
    </Svg>
  );
}

export function IconPlus({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconTrash({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4.5 6.5h15" />
      <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.7 1.7 0 0 0 1.7 1.5h5.8a1.7 1.7 0 0 0 1.7-1.5l.9-12.5" />
      <path d="M10.4 10.5v6M13.6 10.5v6" />
    </Svg>
  );
}

export function IconPencil({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M15.4 4.6a2.1 2.1 0 0 1 3 3L8.6 17.4l-4 1 1-4Z" />
      <path d="m13.8 6.2 3 3" />
    </Svg>
  );
}

export function IconCheck({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="m4.8 12.6 4.6 4.6L19.2 7.4" />
    </Svg>
  );
}

export function IconX({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconImage({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.4" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.6 17.6 4.3-4.3a1.7 1.7 0 0 1 2.4 0l5.2 5.2" />
      <path d="m14.8 14.4 1.6-1.6a1.7 1.7 0 0 1 2.4 0l1.6 1.6" />
    </Svg>
  );
}

export function IconRulerAdmin({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3.9 14.4 14.4 3.9a1.7 1.7 0 0 1 2.4 0l3.3 3.3a1.7 1.7 0 0 1 0 2.4L9.6 20.1a1.7 1.7 0 0 1-2.4 0l-3.3-3.3a1.7 1.7 0 0 1 0-2.4Z" />
      <path d="m7.6 10.7 1.8 1.8M10.7 7.6l1.8 1.8M13.8 4.5l1.8 1.8" />
    </Svg>
  );
}

export function IconPalette({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.1 0 1.9-.85 1.9-1.9 0-.5-.2-.95-.5-1.28-.3-.32-.5-.75-.5-1.22 0-1.05.85-1.9 1.9-1.9h1.7a4 4 0 0 0 4-4A8.5 8.5 0 0 0 12 3.5Z" />
      <circle cx="8" cy="9.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9.6" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconScissors({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="6.4" cy="6.4" r="2.4" />
      <circle cx="6.4" cy="17.6" r="2.4" />
      <path d="M8.3 8.1 19 19M19 5 8.3 15.9" />
    </Svg>
  );
}

export function IconEye({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M2.6 12S6.2 5.8 12 5.8 21.4 12 21.4 12 17.8 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  );
}

export function IconMonitor({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="2.2" />
      <path d="M9 20h6M12 16.5V20" />
    </Svg>
  );
}

export function IconPhone({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2.6" />
      <path d="M10.8 5.6h2.4" />
    </Svg>
  );
}

export function IconBell({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M6.2 9.6a5.8 5.8 0 0 1 11.6 0c0 4.1 1.4 5.4 1.4 5.4H4.8s1.4-1.3 1.4-5.4Z" />
      <path d="M10.3 18.5a1.9 1.9 0 0 0 3.4 0" />
    </Svg>
  );
}

export function IconLogout({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M9.4 20.4H6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h3.4" />
      <path d="M15.2 16.4 19.6 12l-4.4-4.4M19.6 12H9.4" />
    </Svg>
  );
}

export function IconStore({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4.2 9.4V19a1.6 1.6 0 0 0 1.6 1.6h12.4A1.6 1.6 0 0 0 19.8 19V9.4" />
      <path d="M3.2 9.4 4.8 4.2a1 1 0 0 1 .96-.7h12.48a1 1 0 0 1 .96.7l1.6 5.2a3 3 0 0 1-5.4 2.2 3 3 0 0 1-4.8 0 3 3 0 0 1-5.4-2.2Z" />
    </Svg>
  );
}

export function IconTruck({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3 6.6h9.4v9.8H3z" />
      <path d="M12.4 10h3.4l3.2 3v3.4h-6.6z" />
      <circle cx="7" cy="18.4" r="1.6" />
      <circle cx="16.6" cy="18.4" r="1.6" />
    </Svg>
  );
}

export function IconRefresh({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20.4 4.6v4.2h-4.2" />
    </Svg>
  );
}

export function IconInfo({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.4v4.8" />
      <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconChevronRight({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Svg>
  );
}

export function IconMenuAdmin({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconSearchAdmin({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  );
}

export function IconArrowRight({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function IconArrowLeft({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </Svg>
  );
}
