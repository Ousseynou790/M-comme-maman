/**
 * Le bandeau d'accueil.
 *
 * La boutique affiche par défaut des modèles livrés avec le site. Dès que la
 * gérante remplit le formulaire des réglages, c'est son contenu qui passe
 * devant — une nouvelle collection, une promotion, une annonce.
 */

export type HeroTemplate = "affiche" | "editorial" | "collection"

export interface HeroSlide {
  eyebrow: string
  title: string
  copy: string
  image: string
  /** Légende posée sur la photo. */
  accent: string
  ctaLabel: string
  ctaHref: string
  secondaryLabel: string
  secondaryHref: string
}

export interface HeroConfig {
  template: HeroTemplate
  /** false : les modèles par défaut défilent. true : le contenu ci-dessous s'affiche. */
  custom: boolean
  slide: HeroSlide
}

export const HERO_MODELES: { value: HeroTemplate; label: string; description: string }[] = [
  {
    value: "affiche",
    label: "Affiche",
    description: "Une photo plein cadre, le titre posé dessus. Le plus vendeur pour une collection.",
  },
  {
    value: "editorial",
    label: "Éditorial",
    description: "Le texte à gauche, la photo à droite. Lisible, calme, classique.",
  },
  {
    value: "collection",
    label: "Lookbook",
    description: "Titre centré et trois photos décalées. À réserver aux belles séries d'images.",
  },
]

/** Les trois annonces livrées avec le site, utilisées tant que rien n'est configuré. */
export const HERO_PAR_DEFAUT: HeroSlide[] = [
  {
    eyebrow: "Nouvelle collection · 2026",
    title: "Des looks qui suivent leurs aventures.",
    copy: "Des pièces joyeuses, faciles à vivre et choisies avec le regard exigeant d'une maman.",
    image: "/images/mcm/real/enf1-net.png",
    accent: "Collection soleil",
    ctaLabel: "Découvrir la collection",
    ctaHref: "/shop",
    secondaryLabel: "Voir les nouveautés",
    secondaryHref: "/shop?categorie=bebes",
  },
  {
    eyebrow: "Les robes de cérémonie",
    title: "Élégante pour les plus beaux moments.",
    copy: "Une robe noire à volants, légère et raffinée, pensée pour faire briller chaque occasion.",
    image: "/images/mcm/real/hero-robe-noire-paysage-v3.png",
    accent: "Robe noire à volants",
    ctaLabel: "Voir les robes",
    ctaHref: "/shop?categorie=filles",
    secondaryLabel: "Toute la boutique",
    secondaryHref: "/shop",
  },
  {
    eyebrow: "Les tenues de fête",
    title: "Du rouge et beaucoup de joie.",
    copy: "Une robe lumineuse au tulle généreux, parfaite pour danser, sourire et créer de beaux souvenirs.",
    image: "/images/mcm/real/hero-robe-rouge-paysage-v3.png",
    accent: "Robe rouge de fête",
    ctaLabel: "Craquer pour une robe",
    ctaHref: "/shop?categorie=filles",
    secondaryLabel: "Voir les accessoires",
    secondaryHref: "/shop?categorie=accessoires",
  },
]

/** Photos suggérées pour le lookbook, quand la gérante n'en a choisi qu'une. */
export const HERO_APPUIS = [
  "/images/mcm/real/Ensembleenfant-192-retouche.png",
  "/images/mcm/real/Ensembleenfant-193-retouche.png",
]

export const heroParDefaut: HeroConfig = {
  template: "affiche",
  custom: false,
  slide: {
    eyebrow: "",
    title: "",
    copy: "",
    image: "",
    accent: "",
    ctaLabel: "Découvrir la collection",
    ctaHref: "/shop",
    secondaryLabel: "",
    secondaryHref: "",
  },
}

/** Une annonce personnalisée n'est retenue que si elle a au moins un titre. */
export function heroUtilisable(config: HeroConfig | null | undefined): boolean {
  return Boolean(config?.custom && config.slide.title.trim().length > 0)
}

/** Ce que la boutique doit afficher : soit l'annonce de la gérante, soit les modèles. */
export function heroSlides(config: HeroConfig | null | undefined): HeroSlide[] {
  if (heroUtilisable(config)) {
    const slide = config!.slide
    return [
      {
        ...slide,
        image: slide.image || HERO_PAR_DEFAUT[0].image,
        ctaLabel: slide.ctaLabel || "Découvrir la collection",
        ctaHref: slide.ctaHref || "/shop",
      },
    ]
  }
  return HERO_PAR_DEFAUT
}
