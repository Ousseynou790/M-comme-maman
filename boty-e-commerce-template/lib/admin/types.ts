import type { CategorySlug, Product } from "@/lib/products"

export type ProductStatus = "publie" | "brouillon" | "archive"

/** Un produit vu depuis le back-office : la fiche boutique + les données de gestion. */
export interface AdminProduct extends Product {
  sku: string
  stock: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type OrderStatus = "en_attente" | "payee" | "preparation" | "expediee" | "livree" | "annulee"

export type PaymentMethod = "wave" | "orange_money" | "carte" | "livraison"

export interface OrderLine {
  productId: string
  name: string
  size: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  ref: string
  customerId: string
  lines: OrderLine[]
  total: number
  status: OrderStatus
  payment: PaymentMethod
  city: string
  createdAt: string
}

export type CustomerSegment = "nouvelle" | "fidele" | "vip" | "endormie"

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  createdAt: string
  marketingOptIn: boolean
}

export type TeamRole = "proprietaire" | "gestionnaire" | "preparateur" | "lecture"

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  active: boolean
  invitedAt: string
}

export interface AdminCategory {
  id: string
  /** Dérivé du libellé, jamais saisi à la main. */
  slug: string
  label: string
  description: string
  /** Visuel du rayon, affiché sur l'accueil. */
  image: string
  /**
   * Rayons apparentés, par slug. La relation est symétrique : « Chaussures »
   * liée à « Filles » apparaît aussi dans les rayons liés de « Filles ».
   * Sert aux rayons transversaux — les chaussures existent pour les filles,
   * les garçons et les bébés à la fois.
   */
  links: string[]
  active: boolean
  order: number
}

export type PromotionType = "pourcentage" | "montant"

/** Sur quoi la remise s'applique. */
export type PromotionTarget = "boutique" | "categorie" | "produit" | "commande"

/** Condition liée à la commande, quand la portée vaut « commande ». */
export type OrderRule = "premiere-commande" | "montant-minimum"

export interface AdminPromotion {
  id: string
  /** Libellé interne, affiché dans la liste des campagnes. */
  name: string
  type: PromotionType
  value: number
  /** Date d'effet ; la fin est calculée à partir de la durée. */
  startsAt: string
  /** Durée en jours, à partir de la date d'effet. */
  durationDays: number
  target: PromotionTarget
  /** Renseigné pour les portées « categorie » et « produit ». */
  categorySlug: string
  /** Renseigné pour la portée « produit ». */
  productId: string
  /** Renseignés pour la portée « commande ». */
  orderRule: OrderRule
  minAmount: number
  active: boolean
  description: string
}

/** Dernier jour inclus de la campagne, au format AAAA-MM-JJ. */
export function promotionEndDate(promotion: Pick<AdminPromotion, "startsAt" | "durationDays">): string {
  const start = new Date(`${promotion.startsAt}T12:00:00`)
  // Une date ou une durée illisible ne doit pas faire tomber la page.
  if (Number.isNaN(start.getTime())) return promotion.startsAt ?? ""
  const jours = Number.isFinite(promotion.durationDays) ? Math.max(1, promotion.durationDays) : 1
  start.setDate(start.getDate() + jours - 1)
  return start.toISOString().slice(0, 10)
}

export interface StoreSettings {
  storeName: string
  tagline: string
  contactEmail: string
  phone: string
  currency: string
  freeShippingThreshold: number
  shippingDakar: number
  shippingRegions: number
  lowStockThreshold: number
  acceptOrders: boolean
  showPromoBanner: boolean
  promoBannerText: string
}

export interface ActivityEntry {
  id: string
  at: string
  author: string
  action: string
  target: string
}

/* ------------------------------------------------------------------ */
/* Bibliothèque : le vocabulaire commun des fiches produit             */
/* ------------------------------------------------------------------ */

/**
 * Une taille : une lettre ou un nombre, et rien d'autre.
 *
 * Elle ne dépend d'aucun rayon ni d'aucun âge. Le repère est une simple aide
 * au choix, facultative : « S » peut convenir vers 2 ans sans que « 2 ans »
 * devienne une taille.
 */
export interface SizeValue {
  /** Ce qui est imprimé sur l'étiquette : S, 4, 24, TU… */
  value: string
  /** Repère indicatif, souvent un âge. Vide la plupart du temps. */
  age: string
}

/** Un coloris du catalogue : son nom commercial et sa pastille. */
export interface AdminColor {
  id: string
  name: string
  /** Couleur CSS de la pastille, au format #rrggbb. */
  hex: string
}

/** Une image de la photothèque, partagée par les fiches et les rayons. */
export interface MediaItem {
  id: string
  /** Chemin public ou image importée (data:). */
  src: string
  name: string
  addedAt: string
}

/** Tout ce qui se configure une fois et se réutilise partout. */
export interface ProductLibrary {
  /** Toutes les tailles de la boutique, dans l'ordre où on les a saisies. */
  sizes: SizeValue[]
  /** Visuel du guide des tailles, choisi dans la photothèque. Facultatif. */
  sizeGuide: string
  colors: AdminColor[]
  /** Matières proposées en saisie rapide sur la fiche produit. */
  materials: string[]
  media: MediaItem[]
}
