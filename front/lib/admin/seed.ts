import { CATEGORIES, COLORS, HERO_SLIDES, PRODUCTS } from "@/lib/products";
import type {
  ActivityEntry,
  AdminCategory,
  AdminProduct,
  AdminPromotion,
  Customer,
  HeroConfig,
  Order,
  OrderStatus,
  PaymentMethod,
  ProductLibrary,
  ProductStatus,
  StoreSettings,
} from "./types";

/**
 * Les données de démonstration.
 *
 * Tout est engendré à partir d'une graine fixe : deux ouvertures du
 * back-office montrent le même historique, sinon les chiffres du tableau de
 * bord danseraient à chaque rechargement.
 */
export const REFERENCE_DATE = new Date("2026-08-15T10:00:00.000Z");

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgo(days: number, hours = 10): string {
  const d = new Date(REFERENCE_DATE);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

export const slugify = (valeur: string) =>
  valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ------------------------------------------------------------------ */
/* Rayons                                                              */
/* ------------------------------------------------------------------ */

const DESCRIPTIONS: Record<string, string> = {
  ensembles: "Haut et bas assortis, prêts à enfiler le matin",
  "robes-jupes": "Robes de tous les jours et tenues des grands jours",
  "bas-jeans": "Pantalons, jeans et bas confortables",
  "t-shirts-hauts": "Hauts en coton pour bouger toute la journée",
  chaussures: "Des pieds bien chaussés pour grandir",
};

export function seedCategories(): AdminCategory[] {
  return CATEGORIES.map((label, index) => {
    const slug = slugify(label);
    const exemple = PRODUCTS.find((p) => p.category === label);
    return {
      id: `cat-${slug}`,
      slug,
      label,
      description: DESCRIPTIONS[slug] ?? "",
      image: exemple?.image ?? "",
      parentSlugs: [],
      parentNoms: [],
      univers: "enfant" as const,
      active: true,
      order: index + 1,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Produits                                                            */
/* ------------------------------------------------------------------ */

const TAILLES_PAR_AGE: Record<string, string[]> = {
  "2-10": ["2", "4", "6", "8", "10"],
  "11-14": ["12", "14"],
};

export function seedProducts(): AdminProduct[] {
  const rand = mulberry32(20260815);
  return PRODUCTS.map((product, index) => {
    const status: ProductStatus = index === PRODUCTS.length - 1 ? "brouillon" : "publie";
    const stock = product.outOfStock ? 0 : Math.floor(rand() * 40) + 6;
    return {
      ...product,
      stock,
      status,
      gallery: [],
      colors: [pick(rand, COLORS).name],
    materials: [],
    variants: [],
      sizes:
        product.category === "Chaussures"
          ? ["24", "26", "28", "30"]
          : (product.age ? (TAILLES_PAR_AGE[product.age] ?? []) : []),
      createdAt: daysAgo(150 - index * 9),
      updatedAt: daysAgo(Math.floor(rand() * 25)),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

const PRENOMS = [
  "Aïssatou", "Fatou", "Mariama", "Ndèye", "Sokhna", "Awa", "Bineta", "Khady",
  "Coumba", "Adama", "Mame Diarra", "Rokhaya", "Seynabou", "Astou", "Yacine",
  "Oumou", "Dieynaba", "Nafissatou", "Aminata", "Sophie", "Marième", "Penda",
];
const NOMS = [
  "Diop", "Ndiaye", "Fall", "Sow", "Ba", "Sarr", "Gueye", "Faye", "Seck",
  "Mbaye", "Camara", "Diallo", "Sylla", "Thiam", "Cissé", "Diagne", "Kane",
];
const VILLES = [
  "Dakar", "Dakar", "Dakar", "Guédiawaye", "Rufisque", "Thiès", "Mbour",
  "Saint-Louis", "Ziguinchor", "Touba", "Kaolack", "Pikine",
];

function courriel(nom: string): string {
  return `${nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "")}@example.sn`;
}

export function seedCustomers(): Customer[] {
  const rand = mulberry32(4242);
  const vus = new Set<string>();
  const liste: Customer[] = [];

  for (let i = 0; i < 48; i++) {
    let name = `${pick(rand, PRENOMS)} ${pick(rand, NOMS)}`;
    let garde = 0;
    while (vus.has(name) && garde++ < 40) {
      name = `${pick(rand, PRENOMS)} ${pick(rand, NOMS)}`;
    }
    vus.add(name);

    liste.push({
      id: `cli-${String(i + 1).padStart(3, "0")}`,
      name,
      email: courriel(name),
      phone: `+221 7${Math.floor(rand() * 4) + 3} ${String(Math.floor(rand() * 900) + 100)} ${String(Math.floor(rand() * 90) + 10)} ${String(Math.floor(rand() * 90) + 10)}`,
      city: pick(rand, VILLES),
      createdAt: daysAgo(Math.floor(rand() * 300) + 2),
    });
  }
  return liste;
}

/* ------------------------------------------------------------------ */
/* Commandes                                                           */
/* ------------------------------------------------------------------ */

const FLUX: OrderStatus[] = ["en_attente", "payee", "preparation", "expediee", "livree"];
const PAIEMENTS: PaymentMethod[] = ["wave", "orange_money", "carte", "livraison"];

export function seedOrders(catalogue: AdminProduct[], customers: Customer[]): Order[] {
  const rand = mulberry32(987654);
  const orders: Order[] = [];
  const vendables = catalogue.filter((p) => p.status !== "archive");

  // Six mois d'historique, avec une montée en charge récente et un pic le week-end.
  for (let jour = 179; jour >= 0; jour--) {
    const semaine = new Date(REFERENCE_DATE.getTime() - jour * 86_400_000).getUTCDay();
    const weekend = semaine === 0 || semaine === 6 ? 1.6 : 1;
    const croissance = 0.6 + (179 - jour) / 179;
    const nombre = Math.floor(rand() * 3 * weekend * croissance);

    for (let n = 0; n < nombre; n++) {
      const customer = pick(rand, customers);
      const lignes = Array.from({ length: rand() > 0.62 ? 2 : 1 }, () => {
        const product = pick(rand, vendables);
        return {
          productId: product.id,
          name: product.name,
          size: product.sizes.length ? pick(rand, product.sizes) : "TU",
          quantity: rand() > 0.8 ? 2 : 1,
          price: product.price,
        };
      });
      const total = lignes.reduce((somme, l) => somme + l.price * l.quantity, 0);

      // Les commandes récentes sont encore en cours de traitement.
      let status: OrderStatus;
      if (jour > 12) status = rand() > 0.06 ? "livree" : "annulee";
      else if (jour > 6) status = pick<OrderStatus>(rand, ["livree", "expediee", "expediee", "annulee"]);
      else status = FLUX[Math.min(FLUX.length - 1, Math.floor(rand() * (jour + 2)))];

      orders.push({
        id: `ord-${orders.length + 1}`,
        ref: `MCM-${String(10_240 + orders.length)}`,
        customerId: customer.id,
        lines: lignes,
        total,
        status,
        payment: pick(rand, PAIEMENTS),
        city: customer.city,
        createdAt: daysAgo(jour, 8 + Math.floor(rand() * 11)),
      });
    }
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------------------------------------------ */
/* Promotions                                                          */
/* ------------------------------------------------------------------ */

export function seedPromotions(): AdminPromotion[] {
  return [
    {
      id: "promo-rentree",
      name: "Rentrée des classes",
      type: "pourcentage",
      value: 15,
      startsAt: "2026-08-15",
      durationDays: 25,
      target: "boutique",
      categorySlug: "",
      productId: "",
      orderRule: "premiere-commande",
      minAmount: 0,
      active: true,
      description: "Offre de rentrée sur la sélection signalée en boutique.",
    },
    {
      id: "promo-bienvenue",
      name: "Bienvenue — première commande",
      type: "montant",
      value: 2000,
      startsAt: "2026-08-01",
      durationDays: 120,
      target: "commande",
      categorySlug: "",
      productId: "",
      orderRule: "premiere-commande",
      minAmount: 0,
      active: true,
      description: "Remise accordée automatiquement sur la première commande d'une cliente.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Bibliothèque                                                        */
/* ------------------------------------------------------------------ */

export function seedLibrary(): ProductLibrary {
  return {
    sizes: [
      { value: "3M", age: "0-3 mois" },
      { value: "6M", age: "3-6 mois" },
      { value: "9M", age: "6-9 mois" },
      { value: "12M", age: "9-12 mois" },
      { value: "18M", age: "12-18 mois" },
      { value: "2", age: "2 ans" },
      { value: "4", age: "4 ans" },
      { value: "6", age: "6 ans" },
      { value: "8", age: "8 ans" },
      { value: "10", age: "10 ans" },
      { value: "12", age: "12 ans" },
      { value: "14", age: "14 ans" },
      { value: "TU", age: "Taille unique" },
      { value: "S", age: "" },
      { value: "M", age: "" },
      { value: "L", age: "" },
      { value: "24", age: "" },
      { value: "26", age: "" },
      { value: "28", age: "" },
      { value: "30", age: "" },
    ],
    sizeGuide: "",
    colors: COLORS.map((couleur) => ({
      id: `col-${slugify(couleur.name)}`,
      name: couleur.name,
      hex: couleur.hex,
    })).concat([
      { id: "col-rose", name: "Rose", hex: "#e0417f" },
      { id: "col-marine", name: "Marine", hex: "#2f3a56" },
      { id: "col-moutarde", name: "Moutarde", hex: "#f0c24a" },
      { id: "col-sauge", name: "Sauge", hex: "#8ca783" },
    ]),
    materials: [
      "100 % coton",
      "Coton biologique",
      "Jersey de coton",
      "Popeline de coton",
      "Lin lavé",
      "Denim léger",
      "Maille tricot",
    ].map((name) => ({ id: `mat-${slugify(name)}`, name })),
    media: PRODUCTS.map((product, index) => ({
      id: `media-${index + 1}`,
      src: product.image,
      name: product.name,
      addedAt: REFERENCE_DATE.toISOString(),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Boutique et journal                                                 */
/* ------------------------------------------------------------------ */

export const defaultSettings: StoreSettings = {
  storeName: "M comme Maman",
  tagline: "Le monde des mamans",
  contactEmail: "bonjour@mcommaman.com",
  phone: "+221 77 000 00 00",
  currency: "F",
  freeShippingThreshold: 25_000,
  shippingDakar: 2_000,
  shippingRegions: 4_000,
  lowStockThreshold: 6,
  acceptOrders: true,
  showPromoBanner: true,
  promoBannerText: "Livraison offerte à Dakar dès 25 000 F — Retours gratuits sous 14 jours",
};

export function seedHero(): HeroConfig {
  return {
    custom: false,
    slides: HERO_SLIDES.map((slide) => ({ ...slide })),
  };
}

export function seedActivity(): ActivityEntry[] {
  return [
    { id: "act-1", at: daysAgo(0, 9), author: "Awa Ndiaye", action: "a préparé", target: "MCM-10412" },
    { id: "act-2", at: daysAgo(1, 16), author: "Ousseynou Seck", action: "a modifié le prix de", target: "Jean droit en denim" },
    { id: "act-3", at: daysAgo(1, 11), author: "Mame Fatou Diop", action: "a publié", target: "Robe d'été fleurie et bloomer" },
    { id: "act-4", at: daysAgo(3, 14), author: "Awa Ndiaye", action: "a réapprovisionné", target: "Babies vernies à bride" },
    { id: "act-5", at: daysAgo(5, 10), author: "Ousseynou Seck", action: "a créé la campagne", target: "Rentrée des classes" },
  ];
}
