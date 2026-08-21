import type { Age, Gender, Product } from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export type ProductStatus = "publie" | "brouillon" | "archive";

/**
 * Un produit vu du back-office : la fiche boutique plus ce qui ne se montre
 * jamais à la cliente — stock, statut, dates.
 *
 * `Product` reste la source : le jour où le catalogue passe en base, seule la
 * provenance change, la forme non.
 */
export interface AdminProduct extends Product {
  stock: number;
  status: ProductStatus;
  /** Vues supplémentaires : dos, détail, porté. */
  gallery: string[];
  /** Noms de coloris, tenus dans la bibliothèque. */
  colors: string[];
  /** Valeurs de taille, tenues dans la bibliothèque. */
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Commandes                                                           */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  | "en_attente"
  | "payee"
  | "preparation"
  | "expediee"
  | "livree"
  | "annulee";

export type PaymentMethod = "wave" | "orange_money" | "carte" | "livraison";

export interface OrderLine {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  ref: string;
  customerId: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  payment: PaymentMethod;
  city: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export type CustomerSegment = "nouvelle" | "fidele" | "vip" | "endormie";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  marketingOptIn: boolean;
}

/* ------------------------------------------------------------------ */
/* Rayons                                                              */
/* ------------------------------------------------------------------ */

export interface AdminCategory {
  id: string;
  /** Dérivé du libellé, jamais saisi à la main. */
  slug: string;
  label: string;
  description: string;
  /** Visuel du rayon, affiché en boutique. */
  image: string;
  /**
   * Rayons apparentés, par slug. La relation est symétrique : « Chaussures »
   * liée à « Robes & jupes » apparaît aussi dans les rayons liés de celle-ci.
   */
  links: string[];
  active: boolean;
  order: number;
}

/* ------------------------------------------------------------------ */
/* Promotions                                                          */
/* ------------------------------------------------------------------ */

export type PromotionType = "pourcentage" | "montant";

/** Sur quoi la remise s'applique. */
export type PromotionTarget = "boutique" | "categorie" | "produit" | "commande";

/** Condition liée à la commande, quand la portée vaut « commande ». */
export type OrderRule = "premiere-commande" | "montant-minimum";

export interface AdminPromotion {
  id: string;
  /** Libellé interne, affiché dans la liste des campagnes. */
  name: string;
  type: PromotionType;
  value: number;
  /** Date d'effet ; la fin se calcule à partir de la durée. */
  startsAt: string;
  /** Durée en jours, à partir de la date d'effet. */
  durationDays: number;
  target: PromotionTarget;
  /** Renseigné pour les portées « categorie » et « produit ». */
  categorySlug: string;
  /** Renseigné pour la portée « produit ». */
  productId: string;
  /** Renseignés pour la portée « commande ». */
  orderRule: OrderRule;
  minAmount: number;
  active: boolean;
  description: string;
}

/** Dernier jour inclus de la campagne, au format AAAA-MM-JJ. */
export function promotionEndDate(
  promotion: Pick<AdminPromotion, "startsAt" | "durationDays">,
): string {
  const start = new Date(`${promotion.startsAt}T12:00:00`);
  // Une date ou une durée illisible ne doit pas faire tomber la page.
  if (Number.isNaN(start.getTime())) return promotion.startsAt ?? "";
  const jours = Number.isFinite(promotion.durationDays)
    ? Math.max(1, promotion.durationDays)
    : 1;
  start.setDate(start.getDate() + jours - 1);
  return start.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Bibliothèque : le vocabulaire commun des fiches                     */
/* ------------------------------------------------------------------ */

/**
 * Une taille : une lettre ou un nombre, et rien d'autre.
 *
 * Elle ne dépend d'aucun rayon ni d'aucun âge. Le repère est une aide au
 * choix, facultative : « S » peut convenir vers 2 ans sans que « 2 ans »
 * devienne une taille.
 */
export interface SizeValue {
  /** Ce qui figure sur l'étiquette : S, 4, 24, TU… */
  value: string;
  /** Repère indicatif, souvent un âge. Vide la plupart du temps. */
  age: string;
}

/** Un coloris du catalogue : son nom commercial et sa pastille. */
export interface AdminColor {
  id: string;
  name: string;
  /** Couleur CSS de la pastille, au format #rrggbb. */
  hex: string;
}

/** Une image de la photothèque, partagée par les fiches et les rayons. */
export interface MediaItem {
  id: string;
  /** Adresse publique, distante, ou image importée (data:). */
  src: string;
  name: string;
  addedAt: string;
}

/** Tout ce qui se règle une fois et se réutilise partout. */
export interface ProductLibrary {
  sizes: SizeValue[];
  /** Visuel du guide des tailles. Facultatif. */
  sizeGuide: string;
  colors: AdminColor[];
  /** Matières proposées en saisie rapide sur la fiche produit. */
  materials: string[];
  media: MediaItem[];
}

/* ------------------------------------------------------------------ */
/* Boutique et journal                                                 */
/* ------------------------------------------------------------------ */

export interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  phone: string;
  currency: string;
  freeShippingThreshold: number;
  shippingDakar: number;
  shippingRegions: number;
  lowStockThreshold: number;
  acceptOrders: boolean;
  showPromoBanner: boolean;
  promoBannerText: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  author: string;
  action: string;
  target: string;
}

/* ------------------------------------------------------------------ */
/* Bandeau d'accueil                                                   */
/* ------------------------------------------------------------------ */

/**
 * Une photo du bandeau d'accueil.
 *
 * Le cadrage en arche impose un sujet centré : `pos` rattrape le cadrage
 * quand le corps n'est pas au milieu. `piece` est l'article proposé sous la
 * photo — la pièce portée n'est jamais exactement celle-là.
 */
export interface HeroSlideConfig {
  src: string;
  alt: string;
  pos: string;
  tag: string;
  piece: string;
}

export interface HeroConfig {
  /** false : les trois photos livrées avec le site restent en place. */
  custom: boolean;
  slides: HeroSlideConfig[];
}

/** Filtres d'âge et de genre, repris du catalogue pour les formulaires. */
export const AGES: { value: Age; label: string }[] = [
  { value: "0-1", label: "0 à 1 an" },
  { value: "2-10", label: "2 à 10 ans" },
  { value: "10-15", label: "10 à 15 ans" },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "fille", label: "Fille" },
  { value: "garcon", label: "Garçon" },
  { value: "mixte", label: "Mixte" },
];
