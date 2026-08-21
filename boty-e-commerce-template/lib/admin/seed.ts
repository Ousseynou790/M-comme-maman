import { categories, products, type CategorySlug } from "@/lib/products"
import type {
  ActivityEntry,
  AdminProduct,
  Customer,
  Order,
  OrderStatus,
  PaymentMethod,
  ProductStatus,
  StoreSettings,
  TeamMember,
  AdminCategory,
  AdminPromotion,
  ProductLibrary,
} from "./types"

/** Rayons transversaux : les chaussures et accessoires existent pour tous les âges. */
const LIENS_PAR_DEFAUT: Record<string, string[]> = {
  chaussures: ["filles", "garcons", "bebes"],
  accessoires: ["filles", "garcons", "bebes"],
  filles: ["chaussures", "accessoires"],
  garcons: ["chaussures", "accessoires"],
  bebes: ["chaussures", "accessoires"],
}

const VISUELS_PAR_DEFAUT: Record<string, string> = {
  filles: "/images/mcm/real/Ensembleenfant-191.jpg",
  garcons: "/images/mcm/real/Ensembleenfant-192.jpg",
  bebes: "/images/mcm/real/Ensembleenfant-193.jpg",
  chaussures: "/images/mcm/real/chass1.png",
  accessoires: "/images/mcm/real/Ensembleenfant-194.jpg",
}

export function seedCategories(): AdminCategory[] {
  return categories.map((category, index) => ({
    id: `cat-${category.slug}`,
    slug: category.slug,
    label: category.label,
    description: category.description,
    image: VISUELS_PAR_DEFAUT[category.slug] ?? "",
    links: LIENS_PAR_DEFAUT[category.slug] ?? [],
    active: true,
    order: index + 1,
  }))
}

export function seedPromotions(): AdminPromotion[] {
  return [
    {
      id: "promo-rentree-2026",
      name: "Rentrée des classes",
      type: "pourcentage",
      value: 15,
      startsAt: "2026-08-15",
      durationDays: 47,
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
      type: "pourcentage",
      value: 10,
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
  ]
}

/**
 * Toutes les données de démonstration sont générées de façon *déterministe* :
 * le rendu serveur et le rendu client doivent produire exactement les mêmes
 * chiffres, sinon React signale une erreur d'hydratation.
 */
export const REFERENCE_DATE = new Date("2026-08-15T10:00:00.000Z")

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function daysAgo(days: number, hours = 10): string {
  const d = new Date(REFERENCE_DATE)
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(hours, 0, 0, 0)
  return d.toISOString()
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]
}

const SKU_PREFIX: Record<CategorySlug, string> = {
  filles: "FIL",
  garcons: "GAR",
  bebes: "BEB",
  chaussures: "CHA",
  accessoires: "ACC",
}

export function seedProducts(): AdminProduct[] {
  const rand = mulberry32(20260815)
  return products.map((product, index) => {
    const stock = Math.floor(rand() * 60) + (product.badge === "Promo" ? 4 : 8)
    const status: ProductStatus = index === products.length - 1 ? "brouillon" : "publie"
    return {
      ...product,
      sku: `${SKU_PREFIX[product.category]}-${String(index + 1).padStart(3, "0")}`,
      stock,
      status,
      createdAt: daysAgo(120 - index * 7),
      updatedAt: daysAgo(Math.floor(rand() * 25)),
    }
  })
}

const FIRST_NAMES = [
  "Aïssatou", "Fatou", "Mariama", "Ndèye", "Sokhna", "Awa", "Bineta", "Khady",
  "Coumba", "Adama", "Mame Diarra", "Rokhaya", "Seynabou", "Astou", "Yacine",
  "Oumou", "Dieynaba", "Nafissatou", "Aminata", "Sophie", "Marième", "Penda",
]
const LAST_NAMES = [
  "Diop", "Ndiaye", "Fall", "Sow", "Ba", "Sarr", "Gueye", "Faye", "Seck",
  "Mbaye", "Camara", "Diallo", "Sylla", "Thiam", "Cissé", "Diagne", "Kane",
]
const CITIES = [
  "Dakar", "Dakar", "Dakar", "Guédiawaye", "Rufisque", "Thiès", "Mbour",
  "Saint-Louis", "Ziguinchor", "Touba", "Kaolack", "Pikine",
]

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "")
}

export function seedCustomers(): Customer[] {
  const rand = mulberry32(4242)
  const used = new Set<string>()
  const list: Customer[] = []

  for (let i = 0; i < 48; i++) {
    let name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
    let guard = 0
    while (used.has(name) && guard++ < 40) {
      name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
    }
    used.add(name)

    list.push({
      id: `cli-${String(i + 1).padStart(3, "0")}`,
      name,
      email: `${slugifyName(name)}@example.sn`,
      phone: `+221 7${Math.floor(rand() * 4) + 3}${String(Math.floor(rand() * 9_000_000) + 1_000_000)}`,
      city: pick(rand, CITIES),
      createdAt: daysAgo(Math.floor(rand() * 300) + 2),
      marketingOptIn: rand() > 0.35,
    })
  }
  return list
}

const STATUS_FLOW: OrderStatus[] = ["en_attente", "payee", "preparation", "expediee", "livree"]
const PAYMENTS: PaymentMethod[] = ["wave", "orange_money", "carte", "livraison"]

export function seedOrders(catalog: AdminProduct[], customers: Customer[]): Order[] {
  const rand = mulberry32(987654)
  const orders: Order[] = []
  const sellable = catalog.filter((p) => p.status !== "archive")

  // ~180 jours d'historique, avec une montée en charge récente et un pic le week-end.
  for (let day = 179; day >= 0; day--) {
    const weekday = new Date(REFERENCE_DATE.getTime() - day * 86_400_000).getUTCDay()
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.6 : 1
    const growth = 0.6 + (179 - day) / 179
    const count = Math.floor(rand() * 3 * weekendBoost * growth)

    for (let n = 0; n < count; n++) {
      const customer = pick(rand, customers)
      const lineCount = rand() > 0.62 ? 2 : 1
      const lines = Array.from({ length: lineCount }, () => {
        const product = pick(rand, sellable)
        return {
          productId: product.id,
          name: product.name,
          size: pick(rand, product.sizes),
          quantity: rand() > 0.8 ? 2 : 1,
          price: product.price,
        }
      })
      const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

      // Les commandes récentes sont encore en cours de traitement.
      let status: OrderStatus
      if (day > 12) status = rand() > 0.06 ? "livree" : "annulee"
      else if (day > 6) status = pick<OrderStatus>(rand, ["livree", "expediee", "expediee", "annulee"])
      else status = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, Math.floor(rand() * (day + 2)))]

      orders.push({
        id: `ord-${orders.length + 1}`,
        ref: `CMD-${String(10_240 + orders.length)}`,
        customerId: customer.id,
        lines,
        total,
        status,
        payment: pick(rand, PAYMENTS),
        city: customer.city,
        createdAt: daysAgo(day, 8 + Math.floor(rand() * 11)),
      })
    }
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function seedTeam(): TeamMember[] {
  return [
    { id: "team-1", name: "Mame Fatou Diop", email: "fatou@mcommemaman.sn", role: "proprietaire", active: true, invitedAt: daysAgo(320) },
    { id: "team-2", name: "Ousseynou Seck", email: "ousseynou@mcommemaman.sn", role: "gestionnaire", active: true, invitedAt: daysAgo(140) },
    { id: "team-3", name: "Awa Ndiaye", email: "awa@mcommemaman.sn", role: "preparateur", active: true, invitedAt: daysAgo(62) },
    { id: "team-4", name: "Cheikh Fall", email: "cheikh@mcommemaman.sn", role: "lecture", active: false, invitedAt: daysAgo(18) },
  ]
}

export const defaultSettings: StoreSettings = {
  storeName: "M comme Maman",
  tagline: "Le vestiaire joyeux des petits",
  contactEmail: "bonjour@mcommemaman.sn",
  phone: "+221 77 000 00 00",
  currency: "FCFA",
  freeShippingThreshold: 25_000,
  shippingDakar: 2_000,
  shippingRegions: 4_000,
  lowStockThreshold: 12,
  acceptOrders: true,
  showPromoBanner: true,
  promoBannerText: "Livraison offerte à Dakar dès 25 000 FCFA — Retours gratuits sous 14 jours",
}

export function seedActivity(): ActivityEntry[] {
  return [
    { id: "act-1", at: daysAgo(0, 9), author: "Awa Ndiaye", action: "a préparé", target: "CMD-10412" },
    { id: "act-2", at: daysAgo(1, 16), author: "Ousseynou Seck", action: "a modifié le prix de", target: "Sweat à capuche Cool Kid" },
    { id: "act-3", at: daysAgo(1, 11), author: "Mame Fatou Diop", action: "a publié", target: "Sac à dos enfant" },
    { id: "act-4", at: daysAgo(3, 14), author: "Ousseynou Seck", action: "a réapprovisionné", target: "Baskets enfant Zoom" },
    { id: "act-5", at: daysAgo(4, 10), author: "Mame Fatou Diop", action: "a invité", target: "Cheikh Fall" },
  ]
}

/* ------------------------------------------------------------------ */
/* Bibliothèque                                                        */
/* ------------------------------------------------------------------ */

/** Images livrées avec le site, point de départ de la photothèque. */
const PHOTOTHEQUE_INITIALE: [string, string][] = [
  ["/images/mcm/real/Ensemble_enfant-4-retouche.png", "Ensemble enfant 4 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-11-retouche.png", "Ensemble enfant 11 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-26-net-retouche.png", "Ensemble enfant 26 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-30-retouche.png", "Ensemble enfant 30 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-52-retouche.png", "Ensemble enfant 52 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-57-retouche.png", "Ensemble enfant 57 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-67-retouche.png", "Ensemble enfant 67 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-121-net-retouche.png", "Ensemble enfant 121 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-138-retouche.png", "Ensemble enfant 138 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-187-retouche.png", "Ensemble enfant 187 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-15-retouche.png", "Ensemble enfant 15 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-19-retouche.png", "Ensemble enfant 19 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-192-retouche.png", "Ensemble enfant 192 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-193-retouche.png", "Ensemble enfant 193 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-194-retouche.png", "Ensemble enfant 194 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-2.jpg", "Ensemble enfant 2"],
  ["/images/mcm/real/chass1.png", "Chaussures"],
  ["/images/mcm/real/p7eexgrv.png", "Tenue garçon"],
  ["/images/mcm/real/Ensembleenfant-191.jpg", "Ensemble enfant 191"],
  ["/images/mcm/real/Ensembleenfant-192.jpg", "Ensemble enfant 192"],
  ["/images/mcm/real/Ensembleenfant-193.jpg", "Ensemble enfant 193"],
  ["/images/mcm/real/Ensembleenfant-194.jpg", "Ensemble enfant 194"],
  ["/images/mcm/real/Ensemble_enfant-168-net-retouche.png", "Ensemble enfant 168 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-153-net-retouche.png", "Ensemble enfant 153 · retouchée"],
  ["/images/mcm/real/Ensembleenfant-190-net-retouche.png", "Ensemble enfant 190 · retouchée"],
  ["/images/mcm/real/Ensemble_enfant-50.jpg", "Ensemble enfant 50"],
  ["/images/mcm/real/Ensembleenfant-195.jpg", "Ensemble enfant 195"],
  ["/images/mcm/real/Ensembleenfant-196.jpg", "Ensemble enfant 196"],
  ["/images/mcm/real/short-fille-blanc-lisse.png", "Short fille blanc"],
]

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
      { value: "32", age: "" },
      { value: "34", age: "" },
    ],
    sizeGuide: "",
    colors: [
      { id: "col-corail", name: "Corail", hex: "#e0654e" },
      { id: "col-creme", name: "Crème", hex: "#f3e7da" },
      { id: "col-ecru", name: "Écru", hex: "#ede3d4" },
      { id: "col-sauge", name: "Sauge", hex: "#8ca783" },
      { id: "col-moutarde", name: "Moutarde", hex: "#d8a13c" },
      { id: "col-marine", name: "Marine", hex: "#2f3a56" },
      { id: "col-nuit", name: "Bleu nuit", hex: "#232b44" },
      { id: "col-rose", name: "Rose poudré", hex: "#edc0c4" },
      { id: "col-lilas", name: "Lilas", hex: "#c9bee4" },
      { id: "col-denim", name: "Denim clair", hex: "#93aec9" },
    ],
    materials: [
      "100 % coton",
      "Coton biologique",
      "Jersey de coton",
      "Lin lavé",
      "Denim léger",
      "Maille tricot",
      "Wax",
    ],
    media: PHOTOTHEQUE_INITIALE.map(([src, name], index) => ({
      id: `media-${index + 1}`,
      src,
      name,
      addedAt: REFERENCE_DATE.toISOString(),
    })),
  }
}
