export type CategorySlug =
  | "filles"
  | "garcons"
  | "bebes"
  | "chaussures"
  | "accessoires"

/** Tranches d'âge de la boutique, reprises du catalogue. */
export type AgeGroup = "0-1" | "2-10" | "10-15"

export const ageGroups: { value: AgeGroup; label: string; hint: string }[] = [
  { value: "0-1", label: "0 à 1 an", hint: "Bébés" },
  { value: "2-10", label: "2 à 10 ans", hint: "Enfants" },
  { value: "10-15", label: "10 à 15 ans", hint: "Grands" },
]

export interface Category {
  slug: CategorySlug
  label: string
  description: string
}

export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  price: number
  originalPrice: number | null
  image: string
  /** Vues supplémentaires du même article : dos, détail, porté. Vide si la boutique n'en a pas encore. */
  gallery: string[]
  category: CategorySlug
  age: AgeGroup
  badge: "Nouveau" | "Promo" | "Coup de coeur" | null
  sizes: string[]
  colors: string[]
  rating: number
  /** 0 tant qu'aucun avis n'a été collecté : l'affichage se masque de lui-même. */
  reviews: number
  matiere: string
  entretien: string
  livraison: string
}

export const categories: Category[] = [
  { slug: "filles", label: "Filles", description: "Robes, ensembles et hauts pour les petites" },
  { slug: "garcons", label: "Garçons", description: "Ensembles, jeans et pyjamas confortables" },
  { slug: "bebes", label: "Bébés", description: "Douceur et coton de 0 à 12 mois" },
  { slug: "chaussures", label: "Chaussures", description: "Des pieds bien chaussés pour grandir" },
  { slug: "accessoires", label: "Accessoires", description: "Bonnets, sacs et petits plus" },
]

const LIVRAISON =
  "Livraison à Dakar sous 24-48h. Livraison partout au Sénégal sous 2 à 5 jours. Retour gratuit sous 14 jours si l'article n'a pas été porté."

const ENTRETIEN_COTON = "Lavage en machine à 30°C, à l'envers. Séchage à l'air libre recommandé."

/* Tailles proposées selon la tranche d'âge de la pièce. */
/* Une taille est ce qui figure sur l'étiquette : une lettre ou un nombre.
   La correspondance en âge est tenue à part, dans les grilles de la
   configuration, et s'affiche sous la taille pour aider au choix. */
const TAILLES_BEBE = ["3M", "6M", "9M", "12M"]
const TAILLES_ENFANT = ["2", "4", "6", "8", "10"]
const TAILLES_GRAND = ["10", "12", "14"]

/**
 * Catalogue M comme Maman.
 * Noms, prix, descriptions et photos proviennent de la boutique ; les visuels sont
 * enregistrés dans /public/images/mcm/real.
 */
export const products: Product[] = [
  {
    id: "robe-chasuble-rose-plumetis",
    name: "Robe chasuble rose à volant plumetis",
    tagline: "La robe des grands jours",
    description:
      "Chasuble en satin rose, rosette froncée à l'épaule, bas de jupe en plumetis duveteux. Doublure coton, fermeture pression au dos.",
    price: 12000,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-4-retouche.png",
    gallery: [],
    category: "bebes",
    age: "0-1",
    badge: "Coup de coeur",
    sizes: TAILLES_BEBE,
    colors: ["Rose poudré"],
    rating: 0,
    reviews: 0,
    matiere: "Satin doublé coton, plumetis sur le bas de jupe.",
    entretien: "Lavage à la main à l'eau tiède. Repassage à basse température.",
    livraison: LIVRAISON,
  },
  {
    id: "babies-vernies-bride",
    name: "Babies vernies à bride",
    tagline: "Le petit soulier qui fait la tenue",
    description:
      "Vernis rose, nœud plat sur le dessus, bride réglable par pression. Semelle souple antidérapante, pointures 20 à 30.",
    price: 3000,
    originalPrice: null,
    image: "/images/mcm/real/chass1.png",
    gallery: [],
    category: "chaussures",
    age: "2-10",
    badge: null,
    sizes: ["20", "22", "24", "26", "28", "30"],
    colors: ["Rose verni"],
    rating: 0,
    reviews: 0,
    matiere: "Dessus verni, doublure textile, semelle souple antidérapante.",
    entretien: "Nettoyer avec un chiffon humide. Ne pas passer en machine.",
    livraison: LIVRAISON,
  },
  {
    id: "ensemble-pyjama-illustration",
    name: "Ensemble pyjama à illustration",
    tagline: "De beaux rêves garantis",
    description:
      "Haut écru à manches longues, col rouge côtelé et illustration imprimée sur la poitrine. Bas assorti à taille élastique. Jersey de coton.",
    price: 12000,
    originalPrice: 14000,
    image: "/images/mcm/real/Ensemble_enfant-138-retouche.png",
    gallery: [
      // JEU D'ESSAI : ces vues montrent d'autres articles du stock, pas d'autres
      // angles de celui-ci. A remplacer par de vraies prises avant mise en ligne.
      "/images/mcm/real/Ensembleenfant-193-retouche.png",
      "/images/mcm/real/Ensembleenfant-194-retouche.png",
    ],
    category: "filles",
    age: "2-10",
    badge: "Promo",
    sizes: TAILLES_ENFANT,
    colors: ["Écru", "Rouge"],
    rating: 0,
    reviews: 0,
    matiere: "Jersey de coton, col et poignets côtelés.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "ensemble-chemise-bermuda-safari",
    name: "Ensemble chemise et bermuda safari",
    tagline: "Prêt pour l'aventure",
    description:
      "Popeline de coton beige, chemise à manches courtes et deux poches poitrine, bermuda assorti à taille ajustable.",
    price: 9000,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-30-retouche.png",
    gallery: [],
    category: "garcons",
    age: "10-15",
    badge: null,
    sizes: TAILLES_GRAND,
    colors: ["Beige"],
    rating: 0,
    reviews: 0,
    matiere: "Popeline de coton, taille ajustable par bouton intérieur.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "tshirt-raglan-rose-gris",
    name: "T-shirt raglan rose et gris",
    tagline: "Le basique de tous les jours",
    description: "Jersey de coton rose, manches raglan grises, col rond marine côtelé. Coupe droite.",
    price: 5000,
    originalPrice: 6500,
    image: "/images/mcm/real/Ensemble_enfant-52-retouche.png",
    gallery: [],
    category: "filles",
    age: "2-10",
    badge: "Promo",
    sizes: TAILLES_ENFANT,
    colors: ["Rose", "Gris"],
    rating: 0,
    reviews: 0,
    matiere: "Jersey de coton, col côtelé.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "ensemble-pyjama-rouge-vichy",
    name: "Ensemble pyjama rouge et vichy",
    tagline: "Douillet du soir au matin",
    description: "Haut rouge uni à manches longues, pantalon vichy rouge et blanc. Taille élastiquée, coton doux.",
    price: 8500,
    originalPrice: null,
    image: "/images/mcm/real/Ensembleenfant-19-retouche.png",
    gallery: [],
    category: "filles",
    age: "2-10",
    badge: null,
    sizes: TAILLES_ENFANT,
    colors: ["Rouge", "Vichy"],
    rating: 0,
    reviews: 0,
    matiere: "Coton doux, taille entièrement élastiquée.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "ensemble-pyjama-ecru-motif",
    name: "Ensemble pyjama écru à motif",
    tagline: "Un cocon pour la nuit",
    description:
      "Haut écru à manches longues avec motif appliqué, bas vert imprimé assorti. Coton doux, poignets côtelés.",
    price: 7500,
    originalPrice: null,
    image: "/images/mcm/real/Ensembleenfant-15-retouche.png",
    gallery: [],
    category: "garcons",
    age: "2-10",
    badge: null,
    sizes: TAILLES_ENFANT,
    colors: ["Écru", "Vert"],
    rating: 0,
    reviews: 0,
    matiere: "Coton doux, poignets et chevilles côtelés.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "robe-fete-ecrue-plumetis",
    name: "Robe de fête écrue à jupe plumetis",
    tagline: "Pour les grandes occasions",
    description:
      "Robe sans manches en satin écru, jupe en plumetis, fermeture éclair invisible au dos. Doublure intégrale.",
    price: 11000,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-11-retouche.png",
    gallery: [
      // JEU D'ESSAI : ces vues montrent d'autres articles du stock, pas d'autres
      // angles de celui-ci. A remplacer par de vraies prises avant mise en ligne.
      "/images/mcm/real/Ensemble_enfant-2.jpg",
      "/images/mcm/real/Ensemble_enfant-26-net-retouche.png",
    ],
    category: "filles",
    age: "2-10",
    badge: "Coup de coeur",
    sizes: TAILLES_ENFANT,
    colors: ["Écru"],
    rating: 0,
    reviews: 0,
    matiere: "Satin doublé, jupe en plumetis.",
    entretien: "Lavage à la main à l'eau tiède. Repassage à basse température.",
    livraison: LIVRAISON,
  },
  {
    id: "ensemble-pyjama-avions",
    name: "Ensemble pyjama imprimé avions",
    tagline: "Décollage vers le dodo",
    description: "Haut écru imprimé avions, bas bleu uni assorti. Poignets et chevilles côtelés, coton respirant.",
    price: 9500,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-57-retouche.png",
    gallery: [],
    category: "garcons",
    age: "2-10",
    badge: "Nouveau",
    sizes: TAILLES_ENFANT,
    colors: ["Écru", "Bleu"],
    rating: 0,
    reviews: 0,
    matiere: "Coton respirant, poignets et chevilles côtelés.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "jean-droit-denim",
    name: "Jean droit en denim",
    tagline: "Le jean qui suit partout",
    description: "Denim bleu moyen, coupe droite cinq poches, taille réglable par bouton intérieur.",
    price: 13000,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-67-retouche.png",
    gallery: [
      // JEU D'ESSAI : ces vues montrent d'autres articles du stock, pas d'autres
      // angles de celui-ci. A remplacer par de vraies prises avant mise en ligne.
      "/images/mcm/real/Ensembleenfant-192-retouche.png",
      "/images/mcm/real/Ensemble_enfant-121-net-retouche.png",
    ],
    category: "garcons",
    age: "10-15",
    badge: null,
    sizes: TAILLES_GRAND,
    colors: ["Denim bleu"],
    rating: 0,
    reviews: 0,
    matiere: "Denim de coton, taille réglable par bouton intérieur.",
    entretien: "Lavage à l'envers à 30°C. Séchage à l'air libre.",
    livraison: LIVRAISON,
  },
  {
    id: "pantalon-rose-elastique",
    name: "Pantalon rose à taille élastiquée",
    tagline: "Confortable du matin au soir",
    description: "Coton stretch rose, taille entièrement élastiquée, coupe droite légèrement fuselée.",
    price: 7000,
    originalPrice: null,
    image: "/images/mcm/real/Ensemble_enfant-187-retouche.png",
    gallery: [],
    category: "filles",
    age: "2-10",
    badge: null,
    sizes: TAILLES_ENFANT,
    colors: ["Rose"],
    rating: 0,
    reviews: 0,
    matiere: "Coton stretch, taille entièrement élastiquée.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
  {
    id: "robe-ete-fleurie-bloomer",
    name: "Robe d'été fleurie et bloomer",
    tagline: "Les beaux jours en fleurs",
    description: "Robe à bretelles croisées imprimée fleurs, bloomer assorti. Coton léger, doublure jersey.",
    price: 6000,
    originalPrice: null,
    image: "/images/mcm/real/p7eexgrv.png",
    gallery: [],
    category: "bebes",
    age: "0-1",
    badge: "Nouveau",
    sizes: TAILLES_BEBE,
    colors: ["Blanc fleuri"],
    rating: 0,
    reviews: 0,
    matiere: "Coton léger, doublure jersey.",
    entretien: ENTRETIEN_COTON,
    livraison: LIVRAISON,
  },
]

/** Toutes les vues d'un article, la principale en tête. */
export function productImages(p: Product): string[] {
  return [p.image, ...p.gallery].filter(Boolean)
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(slug: CategorySlug): Product[] {
  return products.filter((p) => p.category === slug)
}

export function getProductsByAge(age: AgeGroup): Product[] {
  return products.filter((p) => p.age === age)
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} FCFA`
}
