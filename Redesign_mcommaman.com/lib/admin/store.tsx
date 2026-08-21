"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultSettings,
  REFERENCE_DATE,
  seedActivity,
  seedCategories,
  seedCustomers,
  seedHero,
  seedLibrary,
  seedOrders,
  seedProducts,
  seedPromotions,
} from "./seed";
import type {
  ActivityEntry,
  AdminCategory,
  AdminColor,
  AdminProduct,
  AdminPromotion,
  Customer,
  CustomerSegment,
  HeroConfig,
  MediaItem,
  Order,
  OrderStatus,
  ProductLibrary,
  SizeValue,
  StoreSettings,
} from "./types";

/** Une seule clé pour tout le back-office. */
export const ADMIN_STORAGE_KEY = "mcm-admin-v1";

export { REFERENCE_DATE } from "./seed";

interface AdminState {
  products: AdminProduct[];
  orders: Order[];
  customers: Customer[];
  categories: AdminCategory[];
  promotions: AdminPromotion[];
  library: ProductLibrary;
  settings: StoreSettings;
  hero: HeroConfig;
  activity: ActivityEntry[];
}

function construireGraine(): AdminState {
  const products = seedProducts();
  const customers = seedCustomers();
  return {
    products,
    customers,
    orders: seedOrders(products, customers),
    categories: seedCategories(),
    promotions: seedPromotions(),
    library: seedLibrary(),
    settings: defaultSettings,
    hero: seedHero(),
    activity: seedActivity(),
  };
}

/* ------------------------------------------------------------------ */
/* Migration de l'état enregistré                                      */
/* ------------------------------------------------------------------ */

function convertirTexte(brut: string): SizeValue {
  const texte = brut.trim();
  const ans = texte.match(/^(\d+)\s*ans$/i);
  if (ans) return { value: ans[1], age: texte };
  const plage = texte.match(/^(\d+)\s*-\s*(\d+)\s*ans$/i);
  if (plage) return { value: plage[2], age: texte };
  const intervalle = texte.match(/^(\d+)\s*-\s*(\d+)\s*mois$/i);
  if (intervalle) return { value: `${intervalle[2]}M`, age: texte };
  const mois = texte.match(/^(\d+)\s*m(ois)?$/i);
  if (mois) return { value: `${mois[1]}M`, age: texte };
  if (/^taille unique$/i.test(texte)) return { value: "TU", age: "Taille unique" };
  return { value: texte, age: "" };
}

function migrerTaille(brut: SizeValue | string): SizeValue {
  if (typeof brut === "object" && brut !== null) {
    const value = String(brut.value ?? "");
    const age = String(brut.age ?? "");
    return age ? { value, age } : convertirTexte(value);
  }
  return convertirTexte(String(brut));
}

/**
 * Remet un état enregistré au format courant.
 *
 * Le contenu du navigateur peut avoir été écrit par une version antérieure du
 * modèle. Sans ce rattrapage, l'application lit `undefined` et la page tombe.
 * **Toute modification de `AdminState` doit passer par ici.**
 */
function migrer(lu: Partial<AdminState>): Partial<AdminState> {
  const graine = construireGraine();
  const migre: Partial<AdminState> = { ...lu };

  if (lu.categories) {
    migre.categories = lu.categories.map((category, index) => ({
      ...category,
      image: category.image ?? "",
      links: category.links ?? [],
      description: category.description ?? "",
      order: category.order ?? index + 1,
    }));
  }

  if (lu.promotions) {
    migre.promotions = lu.promotions.map((promotion) => ({
      ...promotion,
      startsAt: promotion.startsAt || new Date().toISOString().slice(0, 10),
      durationDays:
        Number.isFinite(promotion.durationDays) && promotion.durationDays > 0
          ? promotion.durationDays
          : 30,
      target: promotion.target ?? "boutique",
      categorySlug: promotion.categorySlug ?? "",
      productId: promotion.productId ?? "",
      orderRule: promotion.orderRule ?? "premiere-commande",
      minAmount: promotion.minAmount ?? 0,
      description: promotion.description ?? "",
    }));
  }

  if (lu.products) {
    migre.products = lu.products.map((product) => ({
      ...product,
      gallery: product.gallery ?? [],
      colors: product.colors ?? [],
      sizes: product.sizes ?? [],
      stock: Number.isFinite(product.stock) ? product.stock : 0,
      status: product.status ?? "brouillon",
    }));
  }

  const bibliotheque = lu.library as Partial<ProductLibrary> | undefined;
  migre.library = {
    sizes: bibliotheque?.sizes
      ? [
          ...new Map(
            bibliotheque.sizes.map(migrerTaille).map((t) => [t.value, t]),
          ).values(),
        ]
      : graine.library.sizes,
    sizeGuide: bibliotheque?.sizeGuide ?? "",
    colors: bibliotheque?.colors ?? graine.library.colors,
    materials: bibliotheque?.materials ?? graine.library.materials,
    media: bibliotheque?.media ?? graine.library.media,
  };

  migre.hero = {
    custom: lu.hero?.custom ?? false,
    slides: lu.hero?.slides?.length ? lu.hero.slides : graine.hero.slides,
  };

  migre.settings = { ...graine.settings, ...lu.settings };

  return migre;
}

/* ------------------------------------------------------------------ */
/* Contexte                                                            */
/* ------------------------------------------------------------------ */

interface AdminContextValue extends AdminState {
  hydrated: boolean;
  /* Produits */
  saveProduct: (product: AdminProduct) => void;
  createProduct: (product: AdminProduct) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  setProductStatus: (id: string, status: AdminProduct["status"]) => void;
  setStock: (id: string, stock: number) => void;
  /* Commandes */
  setOrderStatus: (id: string, status: OrderStatus) => void;
  /* Rayons */
  saveCategory: (category: AdminCategory) => void;
  deleteCategory: (id: string) => void;
  /* Promotions */
  savePromotion: (promotion: AdminPromotion) => void;
  deletePromotion: (id: string) => void;
  /* Bibliothèque */
  saveSizes: (sizes: SizeValue[]) => void;
  setSizeGuide: (src: string) => void;
  saveColor: (color: AdminColor) => void;
  deleteColor: (id: string) => void;
  setMaterials: (materials: string[]) => void;
  addMedia: (items: Pick<MediaItem, "src" | "name">[]) => void;
  removeMedia: (id: string) => void;
  /* Vitrine */
  updateHero: (hero: HeroConfig) => void;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  /* Divers */
  resetDemoData: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(() => construireGraine());
  const [hydrated, setHydrated] = useState(false);

  // Lecture différée : le premier rendu doit rester identique serveur et client.
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      if (brut) {
        const lu = JSON.parse(brut) as Partial<AdminState>;
        setState((courant) => ({ ...courant, ...migrer(lu) }));
      }
    } catch {
      /* stockage indisponible ou corrompu : on garde la démonstration */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [state, hydrated]);

  const journal = useCallback((action: string, target: string) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: `act-${Date.now()}`, at: new Date().toISOString(), author: "Vous", action, target },
        ...s.activity,
      ].slice(0, 40),
    }));
  }, []);

  /* --- Produits --- */

  const saveProduct = useCallback<AdminContextValue["saveProduct"]>(
    (product) => {
      setState((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === product.id ? { ...product, updatedAt: new Date().toISOString() } : p,
        ),
      }));
      journal("a mis à jour", product.name);
    },
    [journal],
  );

  const createProduct = useCallback<AdminContextValue["createProduct"]>(
    (product) => {
      setState((s) => ({ ...s, products: [product, ...s.products] }));
      journal("a créé", product.name);
    },
    [journal],
  );

  const deleteProduct = useCallback<AdminContextValue["deleteProduct"]>((id) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  }, []);

  const duplicateProduct = useCallback<AdminContextValue["duplicateProduct"]>((id) => {
    setState((s) => {
      const source = s.products.find((p) => p.id === id);
      if (!source) return s;
      const suffixe = Date.now().toString(36);
      const copie: AdminProduct = {
        ...source,
        id: `${source.id}-copie-${suffixe}`,
        slug: `${source.slug}-copie-${suffixe}`,
        name: `${source.name} (copie)`,
        sku: `${source.sku}-C`,
        status: "brouillon",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...s, products: [copie, ...s.products] };
    });
  }, []);

  const setProductStatus = useCallback<AdminContextValue["setProductStatus"]>((id, status) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }, []);

  const setStock = useCallback<AdminContextValue["setStock"]>((id, stock) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, stock) } : p)),
    }));
  }, []);

  /* --- Commandes --- */

  const setOrderStatus = useCallback<AdminContextValue["setOrderStatus"]>((id, status) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
  }, []);

  /* --- Rayons --- */

  const saveCategory = useCallback<AdminContextValue["saveCategory"]>(
    (category) => {
      setState((s) => {
        const liste = s.categories.some((item) => item.id === category.id)
          ? s.categories.map((item) => (item.id === category.id ? category : item))
          : [...s.categories, category];

        /* Le lien est symétrique : si « Chaussures » pointe vers « Robes »,
           « Robes » doit pointer vers « Chaussures », sinon les deux rayons
           racontent des choses différentes. */
        const categories = liste.map((item) => {
          if (item.slug === category.slug) return item;
          const doitEtreLie = (category.links ?? []).includes(item.slug);
          const estLie = (item.links ?? []).includes(category.slug);
          if (doitEtreLie === estLie) return item;
          return {
            ...item,
            links: doitEtreLie
              ? [...(item.links ?? []), category.slug]
              : (item.links ?? []).filter((slug) => slug !== category.slug),
          };
        });

        return { ...s, categories };
      });
      journal("a enregistré le rayon", category.label);
    },
    [journal],
  );

  const deleteCategory = useCallback<AdminContextValue["deleteCategory"]>((id) => {
    setState((s) => ({ ...s, categories: s.categories.filter((item) => item.id !== id) }));
  }, []);

  /* --- Promotions --- */

  const savePromotion = useCallback<AdminContextValue["savePromotion"]>(
    (promotion) => {
      setState((s) => ({
        ...s,
        promotions: s.promotions.some((item) => item.id === promotion.id)
          ? s.promotions.map((item) => (item.id === promotion.id ? promotion : item))
          : [promotion, ...s.promotions],
      }));
      journal("a enregistré la campagne", promotion.name);
    },
    [journal],
  );

  const deletePromotion = useCallback<AdminContextValue["deletePromotion"]>((id) => {
    setState((s) => ({ ...s, promotions: s.promotions.filter((item) => item.id !== id) }));
  }, []);

  /* --- Bibliothèque --- */

  const majBibliotheque = useCallback((patch: Partial<ProductLibrary>) => {
    setState((s) => ({ ...s, library: { ...s.library, ...patch } }));
  }, []);

  const saveSizes = useCallback<AdminContextValue["saveSizes"]>(
    (sizes) => majBibliotheque({ sizes }),
    [majBibliotheque],
  );

  const setSizeGuide = useCallback<AdminContextValue["setSizeGuide"]>(
    (sizeGuide) => majBibliotheque({ sizeGuide }),
    [majBibliotheque],
  );

  const saveColor = useCallback<AdminContextValue["saveColor"]>((color) => {
    setState((s) => ({
      ...s,
      library: {
        ...s.library,
        colors: s.library.colors.some((item) => item.id === color.id)
          ? s.library.colors.map((item) => (item.id === color.id ? color : item))
          : [...s.library.colors, color],
      },
    }));
  }, []);

  const deleteColor = useCallback<AdminContextValue["deleteColor"]>((id) => {
    setState((s) => ({
      ...s,
      library: { ...s.library, colors: s.library.colors.filter((c) => c.id !== id) },
    }));
  }, []);

  const setMaterials = useCallback<AdminContextValue["setMaterials"]>(
    (materials) => majBibliotheque({ materials }),
    [majBibliotheque],
  );

  const addMedia = useCallback<AdminContextValue["addMedia"]>((items) => {
    setState((s) => {
      // Deux fois la même image n'apporte rien.
      const connus = new Set(s.library.media.map((m) => m.src));
      const nouveaux = items
        .filter((item) => !connus.has(item.src))
        .map((item, index) => ({
          id: `media-${Date.now().toString(36)}-${index}`,
          src: item.src,
          name: item.name,
          addedAt: new Date().toISOString(),
        }));
      if (nouveaux.length === 0) return s;
      return { ...s, library: { ...s.library, media: [...nouveaux, ...s.library.media] } };
    });
  }, []);

  const removeMedia = useCallback<AdminContextValue["removeMedia"]>((id) => {
    setState((s) => ({
      ...s,
      library: { ...s.library, media: s.library.media.filter((m) => m.id !== id) },
    }));
  }, []);

  /* --- Vitrine --- */

  const updateHero = useCallback<AdminContextValue["updateHero"]>(
    (hero) => {
      setState((s) => ({ ...s, hero }));
      journal("a modifié", "le bandeau d'accueil");
    },
    [journal],
  );

  const updateSettings = useCallback<AdminContextValue["updateSettings"]>((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetDemoData = useCallback(() => {
    const neuf = construireGraine();
    setState(neuf);
    try {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(neuf));
    } catch {
      /* ignoré */
    }
  }, []);

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
    [
      state, hydrated, saveProduct, createProduct, deleteProduct, duplicateProduct,
      setProductStatus, setStock, setOrderStatus, saveCategory, deleteCategory,
      savePromotion, deletePromotion, saveSizes, setSizeGuide, saveColor, deleteColor,
      setMaterials, addMedia, removeMedia, updateHero, updateSettings, resetDemoData,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin doit être utilisé à l'intérieur de <AdminProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Statistiques dérivées                                               */
/* ------------------------------------------------------------------ */

export const STATUTS_ENCAISSES: OrderStatus[] = ["payee", "preparation", "expediee", "livree"];

function encaisse(order: Order) {
  return STATUTS_ENCAISSES.includes(order.status);
}

export interface PeriodStats {
  revenue: number;
  orders: number;
  averageBasket: number;
  customers: number;
  cancelRate: number;
}

export function computePeriod(
  orders: Order[],
  days: number,
  offset = 0,
  now: Date = REFERENCE_DATE,
): PeriodStats {
  const fin = new Date(now);
  fin.setUTCDate(fin.getUTCDate() - offset * days);
  const debut = new Date(fin);
  debut.setUTCDate(debut.getUTCDate() - days);

  const fenetre = orders.filter((o) => {
    const at = new Date(o.createdAt);
    return at > debut && at <= fin;
  });

  const payees = fenetre.filter(encaisse);
  const revenue = payees.reduce((somme, o) => somme + o.total, 0);
  const annulees = fenetre.filter((o) => o.status === "annulee").length;

  return {
    revenue,
    orders: fenetre.length,
    averageBasket: payees.length ? Math.round(revenue / payees.length) : 0,
    customers: new Set(fenetre.map((o) => o.customerId)).size,
    cancelRate: fenetre.length ? annulees / fenetre.length : 0,
  };
}

export function deltaPercent(courant: number, precedent: number): number | null {
  if (!precedent) return null;
  return ((courant - precedent) / precedent) * 100;
}

export interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export function buildDailySeries(
  orders: Order[],
  days: number,
  now: Date = REFERENCE_DATE,
): DayPoint[] {
  const paniers = new Map<string, DayPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const cle = d.toISOString().slice(0, 10);
    paniers.set(cle, {
      date: cle,
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }),
      revenue: 0,
      orders: 0,
    });
  }
  for (const order of orders) {
    const panier = paniers.get(order.createdAt.slice(0, 10));
    if (!panier) continue;
    panier.orders += 1;
    if (encaisse(order)) panier.revenue += order.total;
  }
  return [...paniers.values()];
}

export interface ProductPerformance {
  product: AdminProduct;
  units: number;
  revenue: number;
}

export function computeProductPerformance(
  products: AdminProduct[],
  orders: Order[],
): ProductPerformance[] {
  const parId = new Map<string, { units: number; revenue: number }>();
  for (const order of orders) {
    if (!encaisse(order)) continue;
    for (const ligne of order.lines) {
      const entree = parId.get(ligne.productId) ?? { units: 0, revenue: 0 };
      entree.units += ligne.quantity;
      entree.revenue += ligne.quantity * ligne.price;
      parId.set(ligne.productId, entree);
    }
  }
  return products
    .map((product) => ({ product, ...(parId.get(product.id) ?? { units: 0, revenue: 0 }) }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface CustomerStats {
  customer: Customer;
  orders: number;
  spent: number;
  lastOrder: string | null;
  segment: CustomerSegment;
}

export function computeCustomerStats(
  customers: Customer[],
  orders: Order[],
  now: Date = REFERENCE_DATE,
): CustomerStats[] {
  const parCliente = new Map<string, { orders: number; spent: number; last: string | null }>();
  for (const order of orders) {
    const entree = parCliente.get(order.customerId) ?? { orders: 0, spent: 0, last: null };
    entree.orders += 1;
    if (encaisse(order)) entree.spent += order.total;
    if (!entree.last || order.createdAt > entree.last) entree.last = order.createdAt;
    parCliente.set(order.customerId, entree);
  }

  return customers
    .map((customer) => {
      const entree = parCliente.get(customer.id) ?? { orders: 0, spent: 0, last: null };
      const jours = entree.last
        ? Math.floor((now.getTime() - new Date(entree.last).getTime()) / 86_400_000)
        : Number.POSITIVE_INFINITY;

      let segment: CustomerSegment = "nouvelle";
      if (entree.spent >= 120_000) segment = "vip";
      else if (entree.orders >= 3) segment = "fidele";
      if (jours > 90) segment = "endormie";

      return { customer, orders: entree.orders, spent: entree.spent, lastOrder: entree.last, segment };
    })
    .sort((a, b) => b.spent - a.spent);
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  payee: "Payée",
  preparation: "À préparer",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

/** Teintes des pastilles de statut, alignées sur la maquette. */
export const STATUS_TONES: Record<OrderStatus, { bg: string; fg: string }> = {
  en_attente: { bg: "#fdf3dc", fg: "#8a6a12" },
  payee: { bg: "#eaf6ef", fg: "#2e7d52" },
  preparation: { bg: "#fdf3dc", fg: "#8a6a12" },
  expediee: { bg: "#eef3fd", fg: "#33538f" },
  livree: { bg: "#f4f1f2", fg: "#5d5157" },
  annulee: { bg: "#fbeaf1", fg: "#b3306a" },
};

export const ORDER_PIPELINE: OrderStatus[] = [
  "en_attente",
  "payee",
  "preparation",
  "expediee",
  "livree",
];

export const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  carte: "Carte bancaire",
  livraison: "À la livraison",
};

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  nouvelle: "Nouvelle",
  fidele: "Fidèle",
  vip: "VIP",
  endormie: "Endormie",
};
