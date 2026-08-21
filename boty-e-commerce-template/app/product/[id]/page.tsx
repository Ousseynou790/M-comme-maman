"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Check, ChevronDown, ChevronLeft, Heart, Minus, Plus, RefreshCw, Ruler, ShoppingBag, Sparkles, Star, Truck, X } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useCart } from "@/components/boty/cart-context"
import { useFavorites } from "@/components/boty/favorites-context"
import { useReviews } from "@/components/boty/reviews-context"
import { ReviewForm, ReviewList, StarRow } from "@/components/boty/review-form"
import { SectionCard } from "@/components/boty/form-kit"
import { categories, formatPrice, getProduct, productImages, products } from "@/lib/products"
import { ProductGallery } from "@/components/boty/product-gallery"
import { useSizeGuide } from "@/components/boty/use-size-guide"

const benefits = [
  { icon: Sparkles, label: "Coton doux" },
  { icon: Heart, label: "Pensé pour les petits" },
  { icon: Truck, label: "Dakar en 24-48h" },
  { icon: RefreshCw, label: "Retours 14 jours" },
]

type AccordionSection = "description" | "matiere" | "entretien" | "livraison"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const product = getProduct(productId)

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes[0] ?? "")
  const [guideOuvert, setGuideOuvert] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors[0] ?? "")
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<AccordionSection | null>("description")
  const [isAdded, setIsAdded] = useState(false)
  const { addItem } = useCart()
  const { isFavorite, toggle: toggleFavorite, hydrated: favoritesReady } = useFavorites()
  const { productReviews, aggregate } = useReviews()
  const isSaved = favoritesReady && Boolean(product) && isFavorite(productId)
  /* Repères de taille et guide, réglés dans l'administration. */
  const aideTailles = useSizeGuide()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (product) {
      setSelectedSize(product.sizes[0])
      setSelectedColor(product.colors[0])
      setQuantity(1)
    }
  }, [productId, product])

  if (!product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto grid max-w-3xl place-items-center px-6 py-28 text-center">
          <h1 className="font-serif text-3xl text-foreground">Cet article n&apos;existe plus</h1>
          <p className="mt-3 text-muted-foreground">
            La fiche a peut-être été retirée du catalogue. Le reste du vestiaire vous attend.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
          >
            Retour à la boutique
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const category = categories.find((c) => c.slug === product.category)
  // La note affichée vient des avis déposés, jamais d'un chiffre écrit dans le catalogue.
  const avis = productReviews(product.id)
  const note = aggregate({ kind: "product", productId: product.id })
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3)

  const accordionItems: { key: AccordionSection; title: string; content: string }[] = [
    { key: "description", title: "Description", content: product.description },
    { key: "matiere", title: "Matière", content: product.matiere },
    { key: "entretien", title: "Entretien", content: product.entretien },
    { key: "livraison", title: "Livraison & retours", content: product.livraison },
  ]

  const handleAddToCart = () => {
    addItem(
      { id: product.id, name: product.name, price: product.price, image: product.image, size: selectedSize },
      quantity,
    )
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/shop"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground boty-transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à la boutique
          </Link>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
            {/* Visuel — reste à l'écran pendant qu'on parcourt la fiche */}
            <div className="lg:sticky lg:top-32">
              <ProductGallery images={productImages(product)} alt={product.name} />

              {discount > 0 && (
                <span className="mt-3 inline-flex rounded-full bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground">
                  -{discount} %
                </span>
              )}

              {/* Repères pratiques, sous l'image plutôt que dans le vide */}
              <dl className="mt-5 grid grid-cols-3 divide-x divide-border/60 rounded-3xl bg-card px-2 py-4 text-center boty-shadow">
                <div className="px-2">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Tailles</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {product.sizes[0]} → {product.sizes[product.sizes.length - 1]}
                  </dd>
                </div>
                <div className="px-2">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Coloris</dt>
                  <dd className="mt-1 text-sm text-foreground">{product.colors.length}</dd>
                </div>
                <div className="px-2">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {note.count > 0 ? "Avis" : "Livraison"}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {note.count > 0 ? `${note.average}/5 · ${note.count}` : "24-48h"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Informations */}
            <div className="flex flex-col">
              <div className="mb-8">
                <Link
                  href={`/shop?categorie=${product.category}`}
                  className="mb-2 block text-sm uppercase tracking-[0.3em] text-primary"
                >
                  {category?.label}
                </Link>
                <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">{product.name}</h1>
                <p className="mb-4 text-lg italic text-muted-foreground">{product.tagline}</p>

                {/* Pas d'étoiles tant qu'aucun avis n'a été collecté : mieux vaut rien qu'une note inventée. */}
                {note.count > 0 && (
                  <a href="#avis" className="mb-4 flex items-center gap-2 boty-transition hover:opacity-80">
                    <StarRow rating={note.average} />
                    <span className="text-sm text-muted-foreground">
                      {note.average}/5 · {note.count} avis
                    </span>
                  </a>
                )}

                <p className="leading-relaxed text-foreground/80">{product.description}</p>
              </div>

              {/* Prix */}
              <div className="mb-8 flex items-baseline gap-3">
                <span className="text-3xl font-medium text-foreground">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Tailles */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Taille</span>
                  {aideTailles.guide && (
                    <button
                      type="button"
                      onClick={() => setGuideOuvert(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 transition hover:text-primary hover:underline"
                    >
                      <Ruler className="h-3.5 w-3.5" /> Guide des tailles
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => {
                    const age = aideTailles.correspondance(size)
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-2xl px-5 py-2.5 text-sm leading-tight boty-transition boty-shadow ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground hover:bg-card/80"
                        }`}
                      >
                        <span className="block font-semibold">{size}</span>
                        {age && (
                          <span
                            className={`mt-0.5 block text-[10px] leading-none ${
                              selectedSize === size ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {age}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Coloris */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <span className="mb-3 block text-sm font-medium text-foreground">Coloris</span>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full px-6 py-3 text-sm boty-transition boty-shadow ${
                          selectedColor === color
                            ? "bg-foreground text-background"
                            : "bg-card text-foreground hover:bg-card/80"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantité */}
              <div className="mb-8">
                <span className="mb-3 block text-sm font-medium text-foreground">Quantité</span>
                <div className="inline-flex items-center gap-4 rounded-full bg-card px-2 py-2 boty-shadow">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground/60 boty-transition hover:text-foreground"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground/60 boty-transition hover:text-foreground"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Ajout au panier */}
              <div className="mb-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-8 py-4 text-sm tracking-wide boty-transition boty-shadow ${
                    isAdded
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      Ajouté au panier
                    </>
                  ) : (
                    "Ajouter au panier"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  aria-pressed={isSaved}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-8 py-4 text-sm tracking-wide boty-transition ${
                    isSaved
                      ? "border-primary/40 bg-primary/8 text-primary"
                      : "border-foreground/20 bg-transparent text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
                  {isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                </button>
              </div>

              {isSaved && (
                <p className="-mt-6 mb-10 text-sm text-muted-foreground">
                  Cet article est dans{" "}
                  <Link href="/favoris" className="text-primary underline underline-offset-4">
                    vos favoris
                  </Link>
                  .
                </p>
              )}

              {/* Réassurance */}
              <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {benefits.map((benefit) => (
                  <div key={benefit.label} className="flex flex-col items-center gap-2 rounded-md p-4 text-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs text-muted-foreground">{benefit.label}</span>
                  </div>
                ))}
              </div>

              {/* Accordéon */}
              <div className="border-t border-border/50">
                {accordionItems.map((item) => (
                  <div key={item.key} className="border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(openAccordion === item.key ? null : item.key)}
                      className="flex w-full items-center justify-between py-5 text-left"
                    >
                      <span className="font-medium text-foreground">{item.title}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground boty-transition ${
                          openAccordion === item.key ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden boty-transition ${
                        openAccordion === item.key ? "max-h-96 pb-5" : "max-h-0"
                      }`}
                    >
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avis clientes */}
          <section id="avis" className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <SectionCard
              title={`Avis sur cet article${note.count > 0 ? ` (${note.count})` : ""}`}
              description={
                note.count > 0
                  ? `Note moyenne de ${note.average} sur 5, calculée sur les avis vérifiés.`
                  : "Seules les clientes ayant reçu cet article peuvent le noter."
              }
            >
              <ReviewList reviews={avis} />
            </SectionCard>

            <SectionCard title="Donner mon avis">
              <ReviewForm target={{ kind: "product", productId: product.id }} titre="Votre note" />
            </SectionCard>
          </section>

          {/* Suggestions */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-8 font-serif text-3xl text-foreground">Dans la même catégorie</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/product/${item.id}`} className="group">
                    <div className="overflow-hidden rounded-3xl bg-card boty-shadow boty-transition group-hover:scale-[1.02]">
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover boty-transition group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="mb-1 font-serif text-xl text-foreground">{item.name}</h3>
                        <p className="mb-3 text-sm text-muted-foreground">{item.tagline}</p>
                        <span className="font-medium text-foreground">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Barre d'achat collante : sur mobile, le bouton d'origine est à deux
          écrans du haut de la fiche. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs text-muted-foreground">{product.name}</span>
            <span className="block text-base font-semibold text-foreground">{formatPrice(product.price)}</span>
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground boty-transition"
          >
            {isAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {isAdded ? "Ajouté" : "Ajouter"}
          </button>
        </div>
      </div>
      {/* Place réservée à la barre, pour ne pas masquer le pied de page. */}
      <div className="h-[72px] lg:hidden" />

      {/* Guide des tailles */}
      {guideOuvert && aideTailles.guide && (
        <div className="fixed inset-0 z-[80] grid place-items-center px-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-foreground/40 backdrop-blur-sm"
            onClick={() => setGuideOuvert(false)}
            aria-label="Fermer le guide des tailles"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] bg-popover p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-serif text-lg">
                <Ruler className="h-4 w-4 text-primary" /> Guide des tailles
              </p>
              <button
                type="button"
                onClick={() => setGuideOuvert(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <Image
                src={aideTailles.guide}
                alt="Guide des tailles"
                fill
                sizes="(max-width: 640px) 90vw, 512px"
                className="object-contain"
                unoptimized={aideTailles.guide.startsWith("data:")}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Les indications sous chaque taille sont de simples repères : fiez-vous aux mesures.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
