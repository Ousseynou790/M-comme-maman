"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react"
import { useCart } from "./cart-context"
import { FavoriteButton } from "./favorite-button"
import { HoverGallery } from "./product-gallery"
import { products, categories, formatPrice, productImages, type CategorySlug } from "@/lib/products"

const badgeStyles: Record<string, string> = {
  Promo: "bg-destructive/10 text-destructive",
  Nouveau: "bg-accent/15 text-accent",
  "Coup de coeur": "bg-primary/10 text-primary",
}

/** Vitesse du défilement automatique, en pixels par seconde. */
const AUTOPLAY_SPEED = 100
/** Pause après un clic sur les flèches, le temps que le scroll manuel se termine. */
const MANUAL_PAUSE = 1200

export function ProductGrid() {
  const [selected, setSelected] = useState<CategorySlug | "tous">("tous")
  const [isVisible, setIsVisible] = useState(false)
  const [inView, setInView] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const resumeTimer = useRef<number | null>(null)
  const { addItem } = useCart()

  const filtered = selected === "tous" ? products : products.filter((p) => p.category === selected)
  const sliderRef = useRef<HTMLDivElement>(null)
  const slide = (direction: number) => {
    sliderRef.current?.scrollBy({ left: direction * Math.min(sliderRef.current.clientWidth * 0.82, 760), behavior: "smooth" })
    pauseThenResume()
  }

  /** Met en pause, puis reprend une fois le défilement manuel terminé. */
  function pauseThenResume() {
    setIsPaused(true)
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => setIsPaused(false), MANUAL_PAUSE)
  }

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 },
    )
    const el = gridRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  // Retour au début quand on change de catégorie
  useEffect(() => {
    if (sliderRef.current) sliderRef.current.scrollLeft = 0
  }, [selected])

  // Défilement automatique continu (pause au survol, hors écran ou si l'utilisateur préfère moins d'animations)
  useEffect(() => {
    const el = sliderRef.current
    if (!el || isPaused || !inView) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, 0.1)
      last = now
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll > 0) {
        const next = el.scrollLeft + AUTOPLAY_SPEED * elapsed
        el.scrollLeft = next >= maxScroll - 1 ? 0 : next
      }
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [isPaused, inView, selected])

  return (
    <section className="overflow-hidden bg-background py-10 lg:py-14">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-primary">
            Le petit vestiaire
          </span>
          <h2 className="max-w-2xl text-balance font-serif text-3xl font-medium leading-[1.02] sm:text-4xl lg:text-5xl">
            Ils vont adorer les porter.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Des essentiels pleins de caractère, sélectionnés pour bouger, jouer et recommencer demain.
          </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => slide(-1)} aria-label="Produits précédents" className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground transition hover:bg-card"><ArrowLeft className="h-4 w-4" /></button>
            <button onClick={() => slide(1)} aria-label="Produits suivants" className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background transition hover:scale-105"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelected("tous")} className={`rounded-full px-4 py-2 text-xs font-medium transition ${selected === "tous" ? "bg-primary text-primary-foreground" : "bg-card text-foreground/70 hover:text-foreground boty-shadow"}`}>Tout voir</button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelected(c.slug)}
              className={`rounded-full px-4 py-2 text-xs font-medium boty-transition ${
                selected === c.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground/70 hover:text-foreground boty-shadow"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div
          ref={(node) => { gridRef.current = node; sliderRef.current = node }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          /* On ne reprend pas au lever du doigt : l'inertie du défilement
             continue, et le défilement automatique se battrait avec elle. */
          onTouchEnd={pauseThenResume}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-4 sm:gap-6"
        >
          {filtered.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className={`group flex w-[72vw] max-w-[280px] shrink-0 snap-start transition-all duration-500 ease-out sm:w-[36vw] lg:w-[21vw] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] bg-card text-foreground boty-shadow transition duration-500 group-hover:-translate-y-1.5">
                <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted">
                  <HoverGallery
                    images={productImages(product)}
                    alt={product.name}
                    sizes="(min-width: 1024px) 21vw, (min-width: 640px) 36vw, 72vw"
                    className="absolute inset-0 transition duration-700 group-hover:scale-105"
                  />
                  {/* Une remise se lit en pourcentage, pas avec le mot « Promo ». */}
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1.5 font-serif text-sm leading-none text-destructive-foreground shadow-lg">
                      −{Math.round((1 - product.price / product.originalPrice) * 100)} %
                    </span>
                  ) : (
                    product.badge && (
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-medium ${
                          badgeStyles[product.badge] ?? "bg-card text-foreground"
                        }`}
                      >
                        {product.badge}
                      </span>
                    )
                  )}
                  <FavoriteButton
                    productId={product.id}
                    productName={product.name}
                    size="sm"
                    className="absolute right-3 top-3"
                  />
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 boty-transition boty-shadow"
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
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingBag className="w-4 h-4 text-foreground" />
                  </button>
                </div>
                <div className="flex min-h-[132px] flex-1 flex-col p-3.5">
                  <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] font-serif text-base font-medium leading-tight text-foreground">
                    {product.name}
                  </h3>
                  <p className="mb-2 line-clamp-1 text-[11px] text-muted-foreground">{product.tagline}</p>
                  <div className="mt-auto flex min-h-5 flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-foreground/20 px-10 py-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background sm:text-base"
          >
            Voir tous les produits
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
