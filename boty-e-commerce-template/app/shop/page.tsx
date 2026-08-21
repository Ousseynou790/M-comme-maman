"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useCart } from "@/components/boty/cart-context"
import { FavoriteButton } from "@/components/boty/favorite-button"
import { HoverGallery } from "@/components/boty/product-gallery"
import { categories, formatPrice, productImages, products, type CategorySlug, type Product } from "@/lib/products"
import {
  countActive,
  emptyFilters,
  FiltersPanel,
  matchFilters,
  priceBands,
  type ShopFilters,
} from "@/components/boty/shop-filters"
import { chercherProduits } from "@/lib/search"

type Filter = CategorySlug | "tous"
type SortKey = "nouveautes" | "prix-asc" | "prix-desc" | "populaires"

const SORTS: { value: SortKey; label: string }[] = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "populaires", label: "Les plus aimés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
]

const badgeStyles: Record<string, string> = {
  Promo: "bg-destructive/10 text-destructive",
  Nouveau: "bg-primary/10 text-primary",
  "Coup de coeur": "bg-accent text-accent-foreground",
}

export default function ShopPage() {
  // useSearchParams impose une frontière Suspense côté App Router : la grille
  // n'est donc pas pré-rendue. Le squelette évite la page blanche sur mobile.
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}

/** Silhouette de la boutique, affichée le temps que la grille arrive. */
function ShopSkeleton() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pb-14 pt-9 lg:pt-12">
        <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
          <div className="mb-8 text-center">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-primary">Le vestiaire</span>
            <h1 className="mb-2 font-serif text-3xl text-foreground md:text-4xl lg:text-5xl">Toute la boutique</h1>
            <p className="mx-auto h-4 w-64 animate-pulse rounded-full bg-card" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[3/4] rounded-[1.25rem] bg-card" />
                <div className="mt-3 h-3.5 w-4/5 rounded-full bg-card" />
                <div className="mt-2 h-3 w-2/5 rounded-full bg-card" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Toutes les tailles du catalogue, des plus petites aux plus grandes :
 * les mois (3M, 6M), puis les tailles enfant (2, 4, 6), puis les pointures
 * (24, 26) et enfin les lettres (TU, S, M, L).
 */
const allSizes = [...new Set(products.flatMap((p) => p.sizes))].sort((a, b) => {
  const rang = (t: string) => {
    if (/^\d+M$/i.test(t)) return 0
    const nombre = parseInt(t, 10)
    if (Number.isFinite(nombre)) return nombre < 20 ? 1 : 2
    return 3
  }
  if (rang(a) !== rang(b)) return rang(a) - rang(b)
  const na = parseInt(a, 10)
  const nb = parseInt(b, 10)
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.localeCompare(b, "fr")
})

function ShopContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requested = searchParams.get("categorie")
  const requete = (searchParams.get("q") ?? "").trim()
  const promoOnly = searchParams.get("promo") === "1"
  const initial: Filter = categories.some((c) => c.slug === requested) ? (requested as CategorySlug) : "tous"

  const [filters, setFilters] = useState<ShopFilters>(() => ({
    ...emptyFilters,
    cats: initial === "tous" ? [] : [initial],
    promoOnly: promoOnly,
  }))
  const [sort, setSort] = useState<SortKey>("nouveautes")
  const [showFilters, setShowFilters] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // La catégorie peut aussi venir du menu de l'en-tête, sans remontage de la page.
  useEffect(() => {
    setFilters((f) => ({ ...f, cats: initial === "tous" ? [] : [initial], promoOnly }))
  }, [initial, promoOnly])

  const filtered = useMemo(() => {
    /* Avec une recherche, la base est la liste classée par pertinence ; les
       filtres de la colonne de gauche viennent la restreindre ensuite. */
    const base = requete ? chercherProduits(requete, products.length).map((r) => r.product) : products
    const sorted = base.filter((p) => matchFilters(p, filters))
    switch (sort) {
      case "prix-asc":
        return [...sorted].sort((a, b) => a.price - b.price)
      case "prix-desc":
        return [...sorted].sort((a, b) => b.price - a.price)
      case "populaires":
        return [...sorted].sort((a, b) => b.reviews - a.reviews)
      default:
        // Une recherche en cours : l'ordre de pertinence est déjà le bon.
        if (requete) return sorted
        return [...sorted].sort(
          (a, b) => Number(b.badge === "Nouveau") - Number(a.badge === "Nouveau"),
        )
    }
  }, [filters, sort, requete])

  /* Compteurs par option : chacun ignore son propre groupe, sinon cocher une
     valeur ramènerait toutes les autres du même groupe à zéro. */
  const counts = useMemo(() => {
    const compte = <T extends string>(
      valeurs: T[],
      groupe: keyof ShopFilters,
      test: (p: Product, v: T) => boolean,
    ) =>
      Object.fromEntries(
        valeurs.map((v) => [v, products.filter((p) => matchFilters(p, filters, groupe) && test(p, v)).length]),
      ) as Record<string, number>

    return {
      ages: compte(["0-1", "2-10", "10-15"], "ages", (p, v) => p.age === v),
      cats: compte(categories.map((c) => c.slug), "cats", (p, v) => p.category === v),
      sizes: compte(allSizes, "sizes", (p, v) => p.sizes.includes(v)),
      bands: compte(priceBands.map((b) => b.value), "bands", (p, v) => {
        const b = priceBands.find((x) => x.value === v)
        return b ? p.price >= b.min && p.price <= b.max : false
      }),
      promo: products.filter(
        (p) => matchFilters(p, filters, "promoOnly") && p.originalPrice && p.originalPrice > p.price,
      ).length,
    }
  }, [filters])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), {
      threshold: 0.1,
    })
    const el = gridRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  // Rejoue l'apparition des cartes à chaque changement de filtre.
  useEffect(() => {
    setIsVisible(false)
    const timer = window.setTimeout(() => setIsVisible(true), 50)
    return () => window.clearTimeout(timer)
  }, [filters, sort])

  const current = filters.cats.length === 1 ? categories.find((c) => c.slug === filters.cats[0]) : undefined

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-14 pt-9 lg:pt-12">
        <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
          {/* Titre */}
          <div className="mb-8 text-center">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-primary">Le vestiaire</span>
            <h1 className="mb-2 text-balance font-serif text-3xl text-foreground md:text-4xl lg:text-5xl">
              {requete ? `« ${requete} »` : promoOnly ? "Bons plans" : current ? current.label : "Toute la boutique"}
            </h1>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              {requete
                ? `${filtered.length} article${filtered.length > 1 ? "s" : ""} correspondent à votre recherche.`
                : promoOnly
                  ? "Les articles à prix réduit du moment, dans la limite des stocks disponibles."
                  : current
                    ? current.description
                    : "Des vêtements enfants et bébés choisis avec amour à Dakar, pour bouger, jouer et recommencer demain."}
            </p>

            {requete && (
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:border-foreground/40"
              >
                <Search className="h-3.5 w-3.5 text-primary" />
                Recherche&nbsp;: {requete}
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
            {/* Colonne de filtres, collante sur grand écran */}
            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <FiltersPanel filters={filters} onChange={setFilters} sizeOptions={allSizes} counts={counts} />
            </aside>

            <div>
              {/* Barre de tri */}
              <div className="mb-6 flex items-center justify-between gap-4 border-b border-border/50 pb-4">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground boty-transition hover:bg-card lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrer
                  {countActive(filters) > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                      {countActive(filters)}
                    </span>
                  )}
                </button>

                <span className="hidden shrink-0 text-sm text-muted-foreground lg:block">
                  {filtered.length} article{filtered.length > 1 ? "s" : ""}
                </span>

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Trier les produits"
                    className="appearance-none rounded-full bg-card py-2 pl-4 pr-9 text-sm text-foreground outline-none boty-shadow"
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Grille */}
              <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} isVisible={isVisible} />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-muted-foreground">Aucun article ne correspond à ces filtres.</p>
                  <button
                    type="button"
                    onClick={() => setFilters(emptyFilters)}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
                  >
                    Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filtres en tiroir, sur mobile */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-foreground/30" onClick={() => setShowFilters(false)} aria-hidden />
              <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="font-serif text-xl text-foreground">Filtrer</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border"
                    aria-label="Fermer les filtres"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FiltersPanel filters={filters} onChange={setFilters} sizeOptions={allSizes} counts={counts} />
                </div>

                <div className="border-t border-border px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground"
                  >
                    Voir les {filtered.length} article{filtered.length > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

function ProductCard({ product, index, isVisible }: { product: Product; index: number; isVisible: boolean }) {
  const { addItem } = useCart()

  return (
    <Link
      href={`/product/${product.id}`}
      className={`group h-full transition-all duration-700 ease-out ${
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-card boty-shadow boty-transition group-hover:-translate-y-1">
        <div className="relative aspect-[3/4] shrink-0 overflow-hidden bg-muted">
          <HoverGallery
            images={productImages(product)}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="absolute inset-0 boty-transition group-hover:scale-105"
          />
          {/* Une remise se lit en pourcentage, pas avec le mot « Promo ». */}
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1.5 font-serif text-sm leading-none text-destructive-foreground shadow-lg">
              −{Math.round((1 - product.price / product.originalPrice) * 100)} %
            </span>
          ) : (
            product.badge && (
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] tracking-wide ${
                  badgeStyles[product.badge] ?? "bg-card text-foreground"
                }`}
              >
                {product.badge === "Coup de coeur" ? "Coup de cœur" : product.badge}
              </span>
            )
          )}
          {/* Le cœur reste visible : c'est un geste qu'on fait aussi au doigt, sans survol */}
          <FavoriteButton
            productId={product.id}
            productName={product.name}
            size="sm"
            className="absolute right-3 top-3"
          />
          <button
            type="button"
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 opacity-0 backdrop-blur-sm boty-transition boty-shadow translate-y-2 group-hover:translate-y-0 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: product.sizes[0],
              })
            }}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingBag className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {/* Deux lignes réservées au nom et une à l'accroche : les cartes gardent la même hauteur
              que le libellé tienne sur une ligne ou deux. */}
          <div className="mb-1 h-[43px] overflow-hidden">
            <h3 className="line-clamp-2 font-serif text-lg leading-tight text-foreground">{product.name}</h3>
          </div>
          <p className="mb-2.5 line-clamp-1 text-xs text-muted-foreground">{product.tagline}</p>
          <div className="mt-auto flex items-center gap-2">
            <span className="text-base font-medium text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {product.sizes[0]} → {product.sizes[product.sizes.length - 1]}
          </p>
        </div>
      </div>
    </Link>
  )
}
