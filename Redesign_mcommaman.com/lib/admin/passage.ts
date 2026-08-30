/**
 * La traduction entre le serveur et le back-office.
 *
 * Le serveur parle `nom`, `prix`, `rayon`, `statut` ; le back-office a été
 * écrit avec `name`, `price`, `category`, `status`. Plutôt que de renommer
 * onze pages, on traduit ici — un seul endroit à relire le jour où l'API bouge.
 */

import type { RayonApi } from "@/lib/api";
import type {
  AdminCategory,
  AdminColor,
  AdminProduct,
  AdminPromotion,
  Customer,
  MediaItem,
  Order,
  SizeValue,
  StoreSettings,
} from "./types";

/* ------------------------------------------------------------------ produits */

export type ProduitGestionApi = {
  id: number;
  slug: string;
  nom: string;
  sku: string;
  prix: number;
  prix_barre: number | null;
  description: string;
  matiere: string;
  rayon: number;
  rayon_nom: string;
  univers: string;
  genre: string;
  age: string;
  statut: "brouillon" | "publie" | "archive";
  photos: { id: number; media: number; url: string; position: number }[];
  variantes: {
    id: number;
    sku: string;
    taille_valeur: string;
    coloris_nom: string;
    stock: number;
  }[];
  stock_total: number;
  manques: string[];
  publiable: boolean;
  cree_le: string;
  modifie_le: string;
};

export function versProduit(brut: ProduitGestionApi): AdminProduct {
  return {
    id: String(brut.id),
    slug: brut.slug,
    name: brut.nom,
    sku: brut.sku,
    price: brut.prix,
    compareAt: brut.prix_barre ?? undefined,
    description: brut.description,
    category: brut.rayon_nom,
    univers: brut.univers as AdminProduct["univers"],
    gender: (brut.genre || undefined) as AdminProduct["gender"],
    age: (brut.age || undefined) as AdminProduct["age"],
    image: brut.photos[0]?.url ?? "",
    gallery: brut.photos.slice(1).map((p) => p.url),
    // Le stock d'une fiche est la somme de ses variantes : c'est la variante
    // qui se vend, la fiche n'en est que le résumé.
    stock: brut.stock_total,
    status: brut.statut,
    sizes: [...new Set(brut.variantes.map((v) => v.taille_valeur))],
    colors: [...new Set(brut.variantes.map((v) => v.coloris_nom).filter(Boolean))],
    createdAt: brut.cree_le,
    updatedAt: brut.modifie_le,
  };
}

/** Ce qu'on renvoie au serveur quand la gérante enregistre une fiche. */
export function depuisProduit(
  produit: AdminProduct,
  rayonsParNom: Map<string, number>,
): Record<string, unknown> {
  return {
    nom: produit.name,
    slug: produit.slug,
    sku: produit.sku,
    prix: produit.price,
    prix_barre: produit.compareAt ?? null,
    description: produit.description,
    matiere: "",
    rayon: rayonsParNom.get(produit.category),
    genre: produit.gender ?? "",
    age: produit.age ?? "",
    statut: produit.status,
  };
}

/** Une photo de fiche, telle que le serveur la décrit. */
export type PhotoProduitApi = {
  id: number;
  produit: number;
  media: number;
  url: string;
  position: number;
};

/* ------------------------------------------------------------------ rayons */

export function versCategorie(brut: RayonApi): AdminCategory {
  return {
    id: String(brut.id),
    slug: brut.slug,
    label: brut.nom,
    description: brut.description,
    image: brut.image_url,
    parentSlugs: brut.parents_slugs ?? [],
    parentNoms: brut.parents_noms ?? [],
    univers: (brut.univers as "enfant" | "maman") ?? "enfant",
    active: true,
    order: brut.ordre ?? 0,
  };
}

/* ------------------------------------------------------------------ commandes */

export type CommandeApi = {
  reference: string;
  creee_le: string;
  statut: Order["status"];
  nom_client: string;
  telephone: string;
  email: string;
  ville: string;
  zone: string;
  sous_total: number;
  frais_livraison: number;
  remise: number;
  total: number;
  moyen_paiement: string;
  cliente: number | null;
  cliente_nom: string;
  lignes: {
    id: number;
    nom_produit: string;
    slug_produit: string;
    libelle_option: string;
    prix_unitaire: number;
    quantite: number;
  }[];
};

export function versCommande(brut: CommandeApi): Order {
  return {
    id: brut.reference,
    ref: brut.reference,
    customerId: brut.cliente ? String(brut.cliente) : "",
    lines: brut.lignes.map((l) => ({
      productId: String(l.id),
      name: l.nom_produit,
      size: l.libelle_option,
      quantity: l.quantite,
      price: l.prix_unitaire,
    })),
    total: brut.total,
    status: brut.statut,
    payment: brut.moyen_paiement as Order["payment"],
    city: brut.ville,
    createdAt: brut.creee_le,
  };
}

/* ------------------------------------------------------------------ clientes */

export type ClienteApi = {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  date_creation: string;
};

export function versCliente(brut: ClienteApi): Customer {
  return {
    id: String(brut.id),
    name: brut.nom,
    email: brut.email,
    phone: brut.telephone,
    city: brut.ville,
    createdAt: brut.date_creation,
  };
}

/* ------------------------------------------------------------------ campagnes */

export type CampagneApi = {
  id: number;
  libelle: string;
  code: string | null;
  type: "pourcentage" | "montant";
  valeur: number;
  date_effet: string;
  duree_jours: number;
  portee: string;
  rayon: number | null;
  produit: number | null;
  condition: string;
  montant_minimum: number;
  active: boolean;
  note: string;
};

const PORTEES: Record<string, AdminPromotion["target"]> = {
  boutique: "boutique",
  rayon: "categorie",
  produit: "produit",
  commande: "commande",
};

export function versPromotion(brut: CampagneApi): AdminPromotion {
  return {
    id: String(brut.id),
    name: brut.libelle,
    type: brut.type,
    value: brut.valeur,
    startsAt: brut.date_effet,
    durationDays: brut.duree_jours,
    target: PORTEES[brut.portee] ?? "boutique",
    categorySlug: "",
    productId: brut.produit ? String(brut.produit) : "",
    orderRule: brut.condition === "montant_minimum" ? "montant-minimum" : "premiere-commande",
    minAmount: brut.montant_minimum,
    active: brut.active,
    description: brut.note,
  };
}

export function depuisPromotion(promotion: AdminPromotion): Record<string, unknown> {
  const portees: Record<string, string> = {
    boutique: "boutique",
    categorie: "rayon",
    produit: "produit",
    commande: "commande",
  };
  return {
    libelle: promotion.name,
    type: promotion.type,
    valeur: promotion.value,
    date_effet: promotion.startsAt,
    duree_jours: promotion.durationDays,
    portee: portees[promotion.target] ?? "boutique",
    produit: promotion.productId ? Number(promotion.productId) : null,
    condition:
      promotion.orderRule === "montant-minimum" ? "montant_minimum" : "premiere",
    montant_minimum: promotion.minAmount,
    active: promotion.active,
    note: promotion.description,
  };
}

/* ------------------------------------------------------------------ divers */

export type MediaApi = { id: number; url: string; nom: string; ajoute_le: string };

export const versMedia = (brut: MediaApi): MediaItem => ({
  id: String(brut.id),
  src: brut.url,
  name: brut.nom,
  addedAt: brut.ajoute_le,
});

export type TailleApi = { id: number; valeur: string; repere: string; ordre: number };

export const versTaille = (brut: TailleApi): SizeValue => ({
  value: brut.valeur,
  age: brut.repere,
});

export type ColorisApi = { id: number; nom: string; hexa: string };

export const versColoris = (brut: ColorisApi): AdminColor => ({
  id: String(brut.id),
  name: brut.nom,
  hex: brut.hexa,
});

export type ReglagesApi = {
  nom_boutique: string;
  signature: string;
  email_contact: string;
  telephone: string;
  devise: string;
  franco_dakar: number;
  frais_dakar: number;
  frais_regions: number;
  seuil_stock_bas: number;
  accepte_commandes: boolean;
  affiche_bandeau_promo: boolean;
  texte_bandeau_promo: string;
};

export function versReglages(brut: ReglagesApi): StoreSettings {
  return {
    storeName: brut.nom_boutique,
    tagline: brut.signature,
    contactEmail: brut.email_contact,
    phone: brut.telephone,
    currency: brut.devise,
    freeShippingThreshold: brut.franco_dakar,
    shippingDakar: brut.frais_dakar,
    shippingRegions: brut.frais_regions,
    lowStockThreshold: brut.seuil_stock_bas,
    acceptOrders: brut.accepte_commandes,
    showPromoBanner: brut.affiche_bandeau_promo,
    promoBannerText: brut.texte_bandeau_promo,
  };
}

export function depuisReglages(patch: Partial<StoreSettings>): Record<string, unknown> {
  const corps: Record<string, unknown> = {};
  if (patch.storeName !== undefined) corps.nom_boutique = patch.storeName;
  if (patch.tagline !== undefined) corps.signature = patch.tagline;
  if (patch.contactEmail !== undefined) corps.email_contact = patch.contactEmail;
  if (patch.phone !== undefined) corps.telephone = patch.phone;
  if (patch.currency !== undefined) corps.devise = patch.currency;
  if (patch.freeShippingThreshold !== undefined) corps.franco_dakar = patch.freeShippingThreshold;
  if (patch.shippingDakar !== undefined) corps.frais_dakar = patch.shippingDakar;
  if (patch.shippingRegions !== undefined) corps.frais_regions = patch.shippingRegions;
  if (patch.lowStockThreshold !== undefined) corps.seuil_stock_bas = patch.lowStockThreshold;
  if (patch.acceptOrders !== undefined) corps.accepte_commandes = patch.acceptOrders;
  if (patch.showPromoBanner !== undefined) corps.affiche_bandeau_promo = patch.showPromoBanner;
  if (patch.promoBannerText !== undefined) corps.texte_bandeau_promo = patch.promoBannerText;
  return corps;
}
