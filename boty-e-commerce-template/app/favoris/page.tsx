"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Heart, ShoppingBag, Trash2, X } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useCart } from "@/components/boty/cart-context"
import { useFavorites } from "@/components/boty/favorites-context"
import { categories, formatPrice, getProduct, type Product } from "@/lib/products"

export default function FavorisPage() {
  const { ids, remove, clear, hydrated } = useFavorites()
  const { addItem } = useCart()
  const [confirmClear, setConfirmClear] = useState(false)

  // Un produit retiré du catalogue ne doit pas casser la page.
  const favorites = useMemo(
    () => ids.map((id) => getProduct(id)).filter((p): p is Product => Boolean(p)),
    [ids],
  )

  const total = favorites.reduce((sum, product) => sum + product.price, 0)

  const addAll = () => {
    for (const product of favorites) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: product.sizes[0],
      })
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Titre */}
          <div className="mb-12 text-center">
            <span className="mb-4 block text-sm uppercase tracking-[0.3em] text-primary">Ma sélection</span>
            <h1 className="mb-4 text-balance font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
              Mes favoris
            </h1>
            <p className="mx-auto max-w-md text-lg text-muted-foreground">
              Les pièces mises de côté, gardées dans ce navigateur en attendant le bon moment.
            </p>
          </div>

          {/* Chargement : on attend la relecture du stockage local */}
          {!hydrated && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-card boty-shadow">
                  <div className="aspect-square bg-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-2/3 rounded-full bg-muted" />
                    <div className="h-4 w-1/2 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Liste vide */}
          {hydrated && favorites.length === 0 && (
            <div className="mx-auto max-w-lg rounded-3xl bg-card px-8 py-16 text-center boty-shadow">
              <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-background">
                <Heart className="h-7 w-7 text-primary" />
              </span>
              <h2 className="font-serif text-2xl text-foreground">Aucun favori pour l&apos;instant</h2>
              <p className="mt-3 text-muted-foreground">
                Touchez le cœur sur un article pour le retrouver ici, sans avoir à refaire toute la boutique.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
                >
                  Parcourir la boutique
                </Link>
                <Link
                  href="/shop?categorie=bebes"
                  className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 py-3.5 text-sm text-foreground boty-transition hover:bg-foreground/5"
                >
                  Voir le rayon bébés
                </Link>
              </div>
            </div>
          )}

          {/* Liste */}
          {hydrated && favorites.length > 0 && (
            <>
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-6">
                <p className="text-sm text-muted-foreground">
                  {favorites.length} article{favorites.length > 1 ? "s" : ""} · {formatPrice(total)} au total
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addAll}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Tout ajouter au panier
                  </button>

                  {confirmClear ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          clear()
                          setConfirmClear(false)
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-sm text-destructive boty-transition hover:bg-destructive/10"
                      >
                        <Check className="h-4 w-4" /> Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground boty-transition hover:text-foreground"
                      >
                        <X className="h-4 w-4" /> Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-2.5 text-sm text-muted-foreground boty-transition hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" /> Vider la liste
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((product) => (
                  <FavoriteCard key={product.id} product={product} onRemove={() => remove(product.id)} />
                ))}
              </div>

              {ids.length > favorites.length && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  {ids.length - favorites.length} article(s) enregistré(s) ne figurent plus au catalogue et ne sont pas
                  affichés.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

function FavoriteCard({ product, onRemove }: { product: Product; onRemove: () => void }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const category = categories.find((c) => c.slug === product.category)

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0],
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="group overflow-hidden rounded-3xl bg-card boty-shadow boty-transition hover:scale-[1.01]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/product/${product.id}`}>
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover boty-transition group-hover:scale-105"
          />
        </Link>

        {product.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs tracking-wide text-foreground backdrop-blur-sm">
            {product.badge === "Coup de coeur" ? "Coup de cœur" : product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${product.name} des favoris`}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-primary backdrop-blur-sm boty-transition boty-shadow hover:text-destructive active:scale-90"
        >
          <Heart className="h-4 w-4 fill-primary" />
        </button>
      </div>

      <div className="p-6">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{category?.label}</span>
        <Link href={`/product/${product.id}`}>
          <h2 className="mb-1 mt-2 font-serif text-xl text-foreground boty-transition hover:text-primary">
            {product.name}
          </h2>
        </Link>
        <p className="mb-4 text-sm text-muted-foreground">{product.tagline}</p>

        <div className="mb-5 flex items-center gap-2">
          <span className="text-lg font-medium text-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm boty-transition ${
              added
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Ajouté
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Ajouter — {product.sizes[0]}
              </>
            )}
          </button>
          <Link
            href={`/product/${product.id}`}
            className="inline-flex items-center justify-center rounded-full border border-foreground/15 px-4 py-3 text-sm text-foreground boty-transition hover:bg-foreground/5"
          >
            Voir
          </Link>
        </div>
      </div>
    </div>
  )
}
