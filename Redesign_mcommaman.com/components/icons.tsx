/**
 * Jeu d'icônes maison.
 *
 * Le projet n'embarque aucune dépendance hors Next / React : pas de lucide, pas
 * de heroicons. Chaque icône est un SVG au trait, dessiné sur la même grille de
 * 24, même épaisseur, même arrondi — elles se ressemblent quand on les aligne.
 * `currentColor` partout : la couleur vient de la classe du parent.
 */

type Props = { className?: string };

const base = "h-5 w-5";

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

export function IconSearch({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  );
}

export function IconBag({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4.5 7.5h15l-1 12.5a1.5 1.5 0 0 1-1.5 1.4H7a1.5 1.5 0 0 1-1.5-1.4Z" />
      <path d="M8.75 10V6.75a3.25 3.25 0 0 1 6.5 0V10" />
    </Svg>
  );
}

export function IconHeart({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 20s-7.5-4.4-7.5-9.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 15.6 12 20 12 20Z" />
    </Svg>
  );
}

/** Cœur plein, pour les séparateurs : un glyphe « ♥ » bascule en emoji sur
    certains systèmes et on perd la couleur. */
export function IconHeartFull({ className = "h-3 w-3" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 20.6S3 15.3 3 9.6A4.6 4.6 0 0 1 12 7.5a4.6 4.6 0 0 1 9 2.1c0 5.7-9 11-9 11Z" />
    </svg>
  );
}

/** Colis, pour l'accès aux commandes depuis la barre du haut. */
export function IconPackage({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M20.5 7.5v9l-8.5 4.5-8.5-4.5v-9L12 3z" />
      <path d="m3.7 7.8 8.3 4.4 8.3-4.4" />
      <path d="M12 12.2V21" />
    </Svg>
  );
}

/** Buste, pour le compte client. */
export function IconUser({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.2a7.6 7.6 0 0 1 14.4 0" />
    </Svg>
  );
}

/** Haut-parleur, son coupé : la barre traverse le cône. */
export function IconMuet({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M11 5.5 6.8 9H4.2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.6L11 18.5z" />
      <path d="m16.5 10 4 4M20.5 10l-4 4" />
    </Svg>
  );
}

/** Haut-parleur, son actif : deux ondes à droite du cône. */
export function IconSon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M11 5.5 6.8 9H4.2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.6L11 18.5z" />
      <path d="M15 9.5a3.6 3.6 0 0 1 0 5M17.8 7.2a7.2 7.2 0 0 1 0 9.6" />
    </Svg>
  );
}

export function IconMenu({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h11" />
    </Svg>
  );
}

export function IconClose({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconArrow({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M5 12h13.5" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </Svg>
  );
}

/** Flèche en diagonale : « ouvrir », par opposition à « avancer ». */
export function IconArrowUp({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M7.5 16.5 16.5 7.5" />
      <path d="M9 7.5h7.5V15" />
    </Svg>
  );
}

export function IconChevron({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <Svg className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  );
}

export function IconClock({ className = "h-4 w-4" }: Props) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

export function IconTag({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3.8 12.6V5.4a1.6 1.6 0 0 1 1.6-1.6h7.2a1.6 1.6 0 0 1 1.14.47l6 6a1.6 1.6 0 0 1 0 2.27l-7.2 7.2a1.6 1.6 0 0 1-2.27 0l-6-6a1.6 1.6 0 0 1-.47-1.14Z" />
      <circle cx="8.2" cy="8.2" r="1.15" />
    </Svg>
  );
}

export function IconReturn({ className = "h-3 w-3" }: Props) {
  return (
    <Svg className={className}>
      <path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5" />
      <path d="m9 10-4 4 4 4" />
    </Svg>
  );
}

/* Les quatre promesses de « Pourquoi M comme Maman ». */

export function IconLeaf({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M11 20.5C6 20.5 4 16.5 4 12.5 4 7 8 4 15 3.6c1.9-.1 3.4-.1 5-.1.3 4.6-.4 8.6-2.4 11.4-2 2.9-4.6 4.3-6.6 4.3Z" />
      <path d="M6.5 20.5c1-4.4 3.4-8 7-10.7" />
    </Svg>
  );
}

export function IconRuler({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="m14.6 3.4 6 6a1.4 1.4 0 0 1 0 2L11.4 20.6a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2L12.6 3.4a1.4 1.4 0 0 1 2 0Z" />
      <path d="m8 9 2 2M11 6l2 2M5 12l2 2" />
    </Svg>
  );
}

export function IconShield({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 3.2 19 6v5.6c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </Svg>
  );
}

export function IconSmile({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.6 14.2a4 4 0 0 0 6.8 0" />
      <path d="M9.4 9.8h.01M14.6 9.8h.01" />
    </Svg>
  );
}

export function IconMail({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2.6" />
      <path d="m3.6 7.2 7.2 5.3a2 2 0 0 0 2.4 0l7.2-5.3" />
    </Svg>
  );
}

/** Guillemets ouvrants, posés en médaillon au-dessus d'un avis. */
export function IconQuote({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
    </Svg>
  );
}

/** WhatsApp : logo plein, pas au trait — il doit rester reconnaissable. */
export function IconWhatsApp({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.19h.01c5.43 0 9.84-4.4 9.84-9.84A9.78 9.78 0 0 0 12.04 2Zm5.74 14a2.44 2.44 0 0 1-1.6 1.13c-.42.08-.96.15-2.8-.59-2.36-.95-3.86-3.3-3.98-3.46-.11-.16-.94-1.25-.94-2.39 0-1.13.6-1.69.81-1.92.21-.23.46-.29.61-.29l.44.01c.14 0 .33-.05.51.39.19.46.65 1.6.71 1.71.06.12.1.25.02.41-.08.16-.12.25-.23.39l-.35.4c-.11.12-.23.24-.1.48.14.23.6.99 1.29 1.6.89.79 1.63 1.03 1.86 1.15.23.12.37.1.5-.06.14-.16.58-.68.74-.91.15-.23.31-.19.52-.12.21.08 1.35.64 1.58.75.23.12.39.17.44.27.06.1.06.57-.13 1.11Z" />
    </svg>
  );
}

/** Gmail : le logo de 2020, avec ses cinq aplats. Seule icône du jeu à porter
    ses propres couleurs — un logo de marque repeint n'est plus le logo. Elle
    ignore donc `currentColor` et veut un fond clair derrière elle. */
export function IconGmail({ className = base }: Props) {
  return (
    <svg viewBox="0 0 256 193" aria-hidden="true" className={className}>
      <path
        fill="#4285f4"
        d="M58.18 192.05V93.14L27.5 65.08 0 49.5v127.05c0 8.55 6.95 15.5 15.52 15.5z"
      />
      <path
        fill="#34a853"
        d="M197.82 192.05h42.66c8.57 0 15.52-6.95 15.52-15.5V49.5l-31.17 17.8-27.01 25.84z"
      />
      <path
        fill="#ea4335"
        d="M58.18 93.14 54 54.5l4.18-37L128 69.87l69.82-52.37 4.67 35-4.67 40.64L128 145.5z"
      />
      <path
        fill="#fbbc04"
        d="M197.82 17.5v75.64L256 49.5V25.16c0-22.58-25.79-35.46-43.83-21.92z"
      />
      <path
        fill="#c5221f"
        d="M0 49.5l26.76 20.07L58.18 93.14V17.5L43.83 3.24C25.76-10.3 0 2.58 0 25.16z"
      />
    </svg>
  );
}
