"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { CategorySlug } from "@/lib/products"
import { heroParDefaut, type HeroConfig } from "@/lib/hero"
import {
  defaultSettings,
  REFERENCE_DATE,
  seedActivity,
  seedCustomers,
  seedCategories,
  seedLibrary,
  seedOrders,
  seedPromotions,
  seedProducts,
  seedTeam,
} from "./seed"
import type {
  ActivityEntry,
  AdminProduct,
  Customer,
  CustomerSegment,
  Order,
  OrderStatus,
  StoreSettings,
  TeamMember,
  TeamRole,
  AdminCategory,
  AdminColor,
  AdminPromotion,
  MediaItem,
  ProductLibrary,
  SizeValue,
} from "./types"

const STORAGE_KEY = "mcm-admin-state-v1"

export { REFERENCE_DATE } from "./seed"

interface AdminState {
  products: AdminProduct[]
  orders: Order[]
  customers: Customer[]
  team: TeamMember[]
  settings: StoreSettings
  activity: ActivityEntry[]
  categories: AdminCategory[]
  promotions: AdminPromotion[]
  library: ProductLibrary
  /** Ce que la vitrine affiche en haut de l'accueil. */
  hero: HeroConfig
}

function buildSeed(): AdminState {
  const products = seedProducts()
  const customers = seedCustomers()
  return {
    products,
    customers,
    orders: seedOrders(products, customers),
    team: seedTeam(),
    settings: defaultSettings,
    activity: seedActivity(),
    categories: seedCategories(),
    promotions: seedPromotions(),
    library: seedLibrary(),
    hero: heroParDefaut,
  }
}

/**
 * Une taille enregistrée avant la séparation taille / âge était une simple
 * chaîne, souvent un âge déguisé en taille (« 4 ans »). On en extrait la
 * valeur portée sur l'étiquette et on garde l'âge en correspondance.
 */
function convertirTexte(brut: string): SizeValue {
  const texte = brut.trim()
  const ans = texte.match(/^(\d+)\s*ans$/i)
  if (ans) return { value: ans[1], age: texte }
  // « 1-2 ans » : la taille correspond à la borne haute, comme sur les étiquettes.
  const plage = texte.match(/^(\d+)\s*-\s*(\d+)\s*ans$/i)
  if (plage) return { value: plage[2], age: texte }
  const intervalle = texte.match(/^(\d+)\s*-\s*(\d+)\s*mois$/i)
  if (intervalle) return { value: `${intervalle[2]}M`, age: texte }
  const mois = texte.match(/^(\d+)\s*mois$/i)
  if (mois) return { value: `${mois[1]}M`, age: texte }
  if (/^taille unique$/i.test(texte)) return { value: "TU", age: "Taille unique" }
  return { value: texte, age: "" }
}

function migrerTaille(brut: SizeValue | string): SizeValue {
  if (typeof brut === "object" && brut !== null) {
    const value = String(brut.value ?? "")
    const age = String(brut.age ?? "")
    // Déjà séparée : on n'y touche pas. Sinon la valeur peut encore être un âge.
    return age ? { value, age } : convertirTexte(value)
  }
  return convertirTexte(String(brut))
}

function migrerTailles(library: Record<string, unknown> | undefined, secours: SizeValue[]): SizeValue[] {
  const grilles = library?.sizeScales as { sizes?: (SizeValue | string)[] }[] | undefined
  const source =
    (library?.sizes as (SizeValue | string)[] | undefined) ??
    (grilles ? grilles.flatMap((grille) => grille.sizes ?? []) : undefined)
  if (!source) return secours

  // Deux grilles pouvaient proposer la même taille : une seule suffit.
  const vues = new Map<string, SizeValue>()
  for (const taille of source) {
    const propre = migrerTaille(taille)
    if (propre.value && !vues.has(propre.value)) vues.set(propre.value, propre)
  }
  return vues.size > 0 ? [...vues.values()] : secours
}

/**
 * Remet un état enregistré au format courant.
 *
 * Le contenu du navigateur peut avoir été écrit par une version antérieure du
 * modèle : une catégorie sans `links`, une promotion sans `durationDays`. Sans
 * ce rattrapage, l'application lit `undefined` et plante à l'affichage.
 */
function migrer(parsed: Partial<AdminState>): Partial<AdminState> {
  const migre: Partial<AdminState> = { ...parsed }

  if (parsed.categories) {
    migre.categories = parsed.categories.map((category, index) => ({
      ...category,
      image: category.image ?? "",
      links: category.links ?? [],
      order: category.order ?? index + 1,
      description: category.description ?? "",
    }))
  }

  if (parsed.promotions) {
    migre.promotions = parsed.promotions.map((promotion) => {
      const ancienneFin = (promotion as { endsAt?: string }).endsAt
      const debut = promotion.startsAt || new Date().toISOString().slice(0, 10)

      // L'ancien modèle stockait une date de fin ; on la convertit en durée.
      let duree = promotion.durationDays
      if (!duree || Number.isNaN(duree)) {
        if (ancienneFin) {
          const jours = Math.round(
            (new Date(`${ancienneFin}T12:00:00`).getTime() - new Date(`${debut}T12:00:00`).getTime()) / 86_400_000,
          )
          duree = Number.isFinite(jours) && jours > 0 ? jours + 1 : 30
        } else {
          duree = 30
        }
      }

      return {
        ...promotion,
        startsAt: debut,
        durationDays: duree,
        target: promotion.target ?? ((promotion as { category?: string }).category === "toutes" || !(promotion as { category?: string }).category ? "boutique" : "categorie"),
        categorySlug: promotion.categorySlug ?? ((promotion as { category?: string }).category ?? ""),
        productId: promotion.productId ?? "",
        orderRule: promotion.orderRule ?? "premiere-commande",
        minAmount: promotion.minAmount ?? 0,
        description: promotion.description ?? "",
      }
    })
  }

  // La bibliothèque est arrivée après coup : un état plus ancien n'en a pas,
  // et un état partiel ne doit pas laisser une liste indéfinie.
  const bibliotheque = seedLibrary()
  const ancienneBibliotheque = parsed.library as unknown as Record<string, unknown> | undefined
  migre.library = {
    sizes: migrerTailles(ancienneBibliotheque, bibliotheque.sizes),
    sizeGuide:
      parsed.library?.sizeGuide ??
      ((ancienneBibliotheque?.sizeScales as { guide?: string }[] | undefined)?.find((g) => g.guide)?.guide || ""),
    colors: parsed.library?.colors ?? bibliotheque.colors,
    materials: parsed.library?.materials ?? bibliotheque.materials,
    media: parsed.library?.media ?? bibliotheque.media,
  }

  // Le bandeau d'accueil est arrivé après coup : on complète ce qui manque.
  migre.hero = {
    ...heroParDefaut,
    ...parsed.hero,
    slide: { ...heroParDefaut.slide, ...parsed.hero?.slide },
  }

  if (parsed.products) {
    migre.products = parsed.products.map((product) => ({
      ...product,
      gallery: product.gallery ?? [],
      age: product.age ?? "2-10",
    }))
  }

  return migre
}

interface AdminContextValue extends AdminState {
  hydrated: boolean
  /* Produits */
  saveProduct: (product: AdminProduct) => void
  createProduct: (product: AdminProduct) => void
  deleteProduct: (id: string) => void
  duplicateProduct: (id: string) => AdminProduct | undefined
  setProductStatus: (id: string, status: AdminProduct["status"]) => void
  setStock: (id: string, stock: number) => void
  /* Commandes */
  setOrderStatus: (id: string, status: OrderStatus) => void
  /* Équipe */
  inviteMember: (member: Omit<TeamMember, "id" | "invitedAt">) => void
  updateMember: (id: string, patch: Partial<TeamMember>) => void
  removeMember: (id: string) => void
  /* Catégories */
  saveCategory: (category: AdminCategory) => void
  deleteCategory: (id: string) => void
  /* Promotions */
  savePromotion: (promotion: AdminPromotion) => void
  deletePromotion: (id: string) => void
  /* Bibliothèque */
  saveSizes: (sizes: SizeValue[]) => void
  setSizeGuide: (src: string) => void
  saveColor: (color: AdminColor) => void
  deleteColor: (id: string) => void
  setMaterials: (materials: string[]) => void
  addMedia: (items: Pick<MediaItem, "src" | "name">[]) => void
  removeMedia: (id: string) => void
  /* Vitrine */
  updateHero: (hero: HeroConfig) => void
  /* Réglages */
  updateSettings: (patch: Partial<StoreSettings>) => void
  /* Divers */
  resetDemoData: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(() => buildSeed())
  const [hydrated, setHydrated] = useState(false)

  // Lecture différée : le premier rendu doit rester identique côté serveur et client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AdminState>
        setState((current) => ({ ...current, ...migrer(parsed) }))
      }
    } catch {
      /* stockage indisponible ou corrompu : on garde les données de démonstration */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [state, hydrated])

  const log = useCallback((action: string, target: string) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: `act-${Date.now()}`, at: new Date().toISOString(), author: "Vous", action, target },
        ...s.activity,
      ].slice(0, 40),
    }))
  }, [])

  const saveProduct = useCallback<AdminContextValue["saveProduct"]>((product) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === product.id ? { ...product, updatedAt: new Date().toISOString() } : p,
      ),
    }))
    log("a mis à jour", product.name)
  }, [log])

  const createProduct = useCallback<AdminContextValue["createProduct"]>((product) => {
    setState((s) => ({ ...s, products: [product, ...s.products] }))
    log("a créé", product.name)
  }, [log])

  const deleteProduct = useCallback<AdminContextValue["deleteProduct"]>((id) => {
    setState((s) => {
      const target = s.products.find((p) => p.id === id)
      const entry: ActivityEntry | null = target
        ? { id: `act-${Date.now()}`, at: new Date().toISOString(), author: "Vous", action: "a supprimé", target: target.name }
        : null
      return {
        ...s,
        products: s.products.filter((p) => p.id !== id),
        activity: entry ? [entry, ...s.activity].slice(0, 40) : s.activity,
      }
    })
  }, [])

  const duplicateProduct = useCallback<AdminContextValue["duplicateProduct"]>((id) => {
    let copy: AdminProduct | undefined
    setState((s) => {
      const source = s.products.find((p) => p.id === id)
      if (!source) return s
      copy = {
        ...source,
        id: `${source.id}-copie-${Date.now().toString(36)}`,
        name: `${source.name} (copie)`,
        sku: `${source.sku}-C`,
        status: "brouillon",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { ...s, products: [copy, ...s.products] }
    })
    return copy
  }, [])

  const setProductStatus = useCallback<AdminContextValue["setProductStatus"]>((id, status) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
    }))
  }, [])

  const setStock = useCallback<AdminContextValue["setStock"]>((id, stock) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, stock) } : p)),
    }))
  }, [])

  const setOrderStatus = useCallback<AdminContextValue["setOrderStatus"]>((id, status) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }))
  }, [])

  const inviteMember = useCallback<AdminContextValue["inviteMember"]>((member) => {
    setState((s) => ({
      ...s,
      team: [...s.team, { ...member, id: `team-${Date.now().toString(36)}`, invitedAt: new Date().toISOString() }],
    }))
    log("a invité", member.name)
  }, [log])

  const updateMember = useCallback<AdminContextValue["updateMember"]>((id, patch) => {
    setState((s) => ({ ...s, team: s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }, [])

  const removeMember = useCallback<AdminContextValue["removeMember"]>((id) => {
    setState((s) => ({ ...s, team: s.team.filter((m) => m.id !== id) }))
  }, [])

  const saveCategory = useCallback<AdminContextValue["saveCategory"]>((category) => {
    setState((s) => {
      const liste = s.categories.some((item) => item.id === category.id)
        ? s.categories.map((item) => (item.id === category.id ? category : item))
        : [...s.categories, category]

      /* Le lien est symétrique : si « Chaussures » pointe vers « Filles »,
         « Filles » doit pointer vers « Chaussures », sinon les deux rayons
         racontent des choses différentes. */
      const categories = liste.map((item) => {
        if (item.slug === category.slug) return item
        const doitEtreLie = (category.links ?? []).includes(item.slug)
        const estLie = (item.links ?? []).includes(category.slug)
        if (doitEtreLie === estLie) return item
        return {
          ...item,
          links: doitEtreLie
            ? [...(item.links ?? []), category.slug]
            : (item.links ?? []).filter((slug) => slug !== category.slug),
        }
      })

      return { ...s, categories }
    })
    log("a enregistré la catégorie", category.label)
  }, [log])

  const deleteCategory = useCallback<AdminContextValue["deleteCategory"]>((id) => {
    setState((s) => ({ ...s, categories: s.categories.filter((item) => item.id !== id) }))
  }, [])

  const savePromotion = useCallback<AdminContextValue["savePromotion"]>((promotion) => {
    setState((s) => ({
      ...s,
      promotions: s.promotions.some((item) => item.id === promotion.id)
        ? s.promotions.map((item) => (item.id === promotion.id ? promotion : item))
        : [promotion, ...s.promotions],
    }))
    log("a enregistré la promotion", promotion.name)
  }, [log])

  const deletePromotion = useCallback<AdminContextValue["deletePromotion"]>((id) => {
    setState((s) => ({ ...s, promotions: s.promotions.filter((item) => item.id !== id) }))
  }, [])

  /* --- Bibliothèque --- */

  const majBibliotheque = useCallback((patch: Partial<ProductLibrary>) => {
    setState((s) => ({ ...s, library: { ...s.library, ...patch } }))
  }, [])

  const saveSizes = useCallback<AdminContextValue["saveSizes"]>(
    (sizes) => majBibliotheque({ sizes }),
    [majBibliotheque],
  )

  const setSizeGuide = useCallback<AdminContextValue["setSizeGuide"]>(
    (sizeGuide) => majBibliotheque({ sizeGuide }),
    [majBibliotheque],
  )

  const saveColor = useCallback<AdminContextValue["saveColor"]>((color) => {
    setState((s) => ({
      ...s,
      library: {
        ...s.library,
        colors: s.library.colors.some((item) => item.id === color.id)
          ? s.library.colors.map((item) => (item.id === color.id ? color : item))
          : [...s.library.colors, color],
      },
    }))
  }, [])

  const deleteColor = useCallback<AdminContextValue["deleteColor"]>((id) => {
    setState((s) => ({ ...s, library: { ...s.library, colors: s.library.colors.filter((c) => c.id !== id) } }))
  }, [])

  const setMaterials = useCallback<AdminContextValue["setMaterials"]>(
    (materials) => majBibliotheque({ materials }),
    [majBibliotheque],
  )

  const addMedia = useCallback<AdminContextValue["addMedia"]>((items) => {
    setState((s) => {
      // Deux fois la même image n'apporte rien : on ignore les doublons.
      const connus = new Set(s.library.media.map((m) => m.src))
      const nouveaux = items
        .filter((item) => !connus.has(item.src))
        .map((item, index) => ({
          id: `media-${Date.now().toString(36)}-${index}`,
          src: item.src,
          name: item.name,
          addedAt: new Date().toISOString(),
        }))
      if (nouveaux.length === 0) return s
      return { ...s, library: { ...s.library, media: [...nouveaux, ...s.library.media] } }
    })
  }, [])

  const removeMedia = useCallback<AdminContextValue["removeMedia"]>((id) => {
    setState((s) => ({ ...s, library: { ...s.library, media: s.library.media.filter((m) => m.id !== id) } }))
  }, [])

  const updateHero = useCallback<AdminContextValue["updateHero"]>((hero) => {
    setState((s) => ({ ...s, hero }))
    log("a modifié", "le bandeau d'accueil")
  }, [log])

  const updateSettings = useCallback<AdminContextValue["updateSettings"]>((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const resetDemoData = useCallback(() => {
    const fresh = buildSeed()
    setState(fresh)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    } catch {
      /* ignoré */
    }
  }, [])

  const value = useMemo<AdminContextValue>(
    () => ({
      ...state,
      hydrated,
      saveProduct,
      createProduct,
      deleteProduct,
      duplicateProduct,
      setProductStatus,
      setStock,
      setOrderStatus,
      inviteMember,
      updateMember,
      removeMember,
      saveCategory,
      deleteCategory,
      savePromotion,
      deletePromotion,
      saveSizes,
      setSizeGuide,
      saveColor,
      deleteColor,
      setMaterials,
      addMedia,
      removeMedia,
      updateHero,
      updateSettings,
      resetDemoData,
    }),
    [state, hydrated, saveProduct, createProduct, deleteProduct, duplicateProduct, setProductStatus, setStock, setOrderStatus, inviteMember, updateMember, removeMember, saveCategory, deleteCategory, savePromotion, deletePromotion, saveSizes, setSizeGuide, saveColor, deleteColor, setMaterials, addMedia, removeMedia, updateHero, updateSettings, resetDemoData],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin doit être utilisé à l'intérieur de <AdminProvider>")
  return ctx
}

/* ------------------------------------------------------------------ */
/* Statistiques dérivées                                               */
/* ------------------------------------------------------------------ */

export const REVENUE_STATUSES: OrderStatus[] = ["payee", "preparation", "expediee", "livree"]

function isRevenue(order: Order) {
  return REVENUE_STATUSES.includes(order.status)
}

function startOfDay(iso: string) {
  return iso.slice(0, 10)
}

export interface DayPoint {
  date: string
  label: string
  revenue: number
  orders: number
}

export function buildDailySeries(orders: Order[], days: number, now: Date = REFERENCE_DATE): DayPoint[] {
  const buckets = new Map<string, DayPoint>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }),
      revenue: 0,
      orders: 0,
    })
  }
  for (const order of orders) {
    const bucket = buckets.get(startOfDay(order.createdAt))
    if (!bucket) continue
    bucket.orders += 1
    if (isRevenue(order)) bucket.revenue += order.total
  }
  return [...buckets.values()]
}

export interface PeriodStats {
  revenue: number
  orders: number
  averageBasket: number
  customers: number
  cancelRate: number
}

export function computePeriod(orders: Order[], days: number, offset = 0, now: Date = REFERENCE_DATE): PeriodStats {
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - offset * days)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - days)

  const window = orders.filter((o) => {
    const at = new Date(o.createdAt)
    return at > start && at <= end
  })

  const paid = window.filter(isRevenue)
  const revenue = paid.reduce((sum, o) => sum + o.total, 0)
  const cancelled = window.filter((o) => o.status === "annulee").length

  return {
    revenue,
    orders: window.length,
    averageBasket: paid.length ? Math.round(revenue / paid.length) : 0,
    customers: new Set(window.map((o) => o.customerId)).size,
    cancelRate: window.length ? cancelled / window.length : 0,
  }
}

export function deltaPercent(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

export interface ProductPerformance {
  product: AdminProduct
  units: number
  revenue: number
}

export function computeProductPerformance(products: AdminProduct[], orders: Order[]): ProductPerformance[] {
  const byId = new Map<string, { units: number; revenue: number }>()
  for (const order of orders) {
    if (!isRevenue(order)) continue
    for (const line of order.lines) {
      const entry = byId.get(line.productId) ?? { units: 0, revenue: 0 }
      entry.units += line.quantity
      entry.revenue += line.quantity * line.price
      byId.set(line.productId, entry)
    }
  }
  return products
    .map((product) => ({ product, ...(byId.get(product.id) ?? { units: 0, revenue: 0 }) }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function computeCategoryBreakdown(
  products: AdminProduct[],
  orders: Order[],
): { category: CategorySlug; revenue: number; units: number }[] {
  const index = new Map(products.map((p) => [p.id, p.category]))
  const totals = new Map<CategorySlug, { revenue: number; units: number }>()
  for (const order of orders) {
    if (!isRevenue(order)) continue
    for (const line of order.lines) {
      const category = index.get(line.productId)
      if (!category) continue
      const entry = totals.get(category) ?? { revenue: 0, units: 0 }
      entry.revenue += line.quantity * line.price
      entry.units += line.quantity
      totals.set(category, entry)
    }
  }
  return [...totals.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
}

export interface CustomerStats {
  customer: Customer
  orders: number
  spent: number
  lastOrder: string | null
  segment: CustomerSegment
}

export function computeCustomerStats(customers: Customer[], orders: Order[], now: Date = REFERENCE_DATE): CustomerStats[] {
  const byCustomer = new Map<string, { orders: number; spent: number; last: string | null }>()
  for (const order of orders) {
    const entry = byCustomer.get(order.customerId) ?? { orders: 0, spent: 0, last: null }
    entry.orders += 1
    if (isRevenue(order)) entry.spent += order.total
    if (!entry.last || order.createdAt > entry.last) entry.last = order.createdAt
    byCustomer.set(order.customerId, entry)
  }

  return customers
    .map((customer) => {
      const entry = byCustomer.get(customer.id) ?? { orders: 0, spent: 0, last: null }
      const daysSince = entry.last
        ? Math.floor((now.getTime() - new Date(entry.last).getTime()) / 86_400_000)
        : Number.POSITIVE_INFINITY

      let segment: CustomerSegment = "nouvelle"
      if (entry.spent >= 120_000) segment = "vip"
      else if (entry.orders >= 3) segment = "fidele"
      if (daysSince > 90) segment = "endormie"

      return { customer, orders: entry.orders, spent: entry.spent, lastOrder: entry.last, segment }
    })
    .sort((a, b) => b.spent - a.spent)
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  proprietaire: "Propriétaire",
  gestionnaire: "Gestionnaire",
  preparateur: "Préparateur",
  lecture: "Lecture seule",
}

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  proprietaire: "Accès total, y compris la facturation et l'équipe.",
  gestionnaire: "Catalogue, commandes, clients et statistiques.",
  preparateur: "Voit et fait avancer les commandes uniquement.",
  lecture: "Consultation des tableaux de bord, aucune modification.",
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  payee: "Payée",
  preparation: "Préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
}

export const ORDER_PIPELINE: OrderStatus[] = ["en_attente", "payee", "preparation", "expediee", "livree"]
