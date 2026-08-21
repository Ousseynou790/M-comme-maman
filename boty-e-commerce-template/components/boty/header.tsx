"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingBag, Search, Heart, Package, User } from "lucide-react"
import { CartDrawer } from "./cart-drawer"
import { SearchOverlay } from "./search-overlay"
import { useCart } from "./cart-context"
import { useFavorites } from "./favorites-context"
import { useAuth } from "./auth-context"
import { categories } from "@/lib/products"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { setIsOpen, itemCount } = useCart()
  const { count: favoriteCount } = useFavorites()
  const { account } = useAuth()

  /* Raccourcis : Ctrl/Cmd+K partout, « / » quand on n'est pas en train d'écrire. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const cible = event.target as HTMLElement | null
      const saisie = cible?.tagName === "INPUT" || cible?.tagName === "TEXTAREA" || cible?.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === "/" && !saisie) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      {/* Bandeau et navigation restent solidaires en haut de l'écran pendant le défilement. */}
      <div className="sticky top-0 z-50">
        {/* Announcement bar */}
        <div className="bg-accent text-accent-foreground text-center text-xs sm:text-sm py-2 px-4 tracking-wide">
          Livraison offerte à Dakar dès 25 000 FCFA — Retours gratuits sous 14 jours
        </div>

      <header className="border-b border-border/70 bg-white shadow-[0_1px_12px_rgba(52,41,43,0.04)]">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* La colonne de droite se dimensionne sur son contenu : figee a 132 px,
                elle debordait sur le menu et venait coller « Accessoires » au champ
                de recherche. */}
          <div className="flex h-16 items-center justify-between gap-4 lg:grid lg:h-[4.75rem] lg:grid-cols-[132px_1fr_auto] lg:gap-x-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden grid h-11 w-11 -ml-2 place-items-center text-foreground/80 hover:text-foreground boty-transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Ouvrir le menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" aria-label="M comme Maman — Accueil" className="relative flex h-12 w-[92px] shrink-0 items-center justify-center lg:h-14 lg:w-[112px] lg:justify-self-start">
              <Image
                src="/images/mcm/logo-m-comme-maman.png"
                alt="M comme Maman"
                width={180}
                height={78}
                priority
                className="max-h-full w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center justify-center gap-6 lg:flex xl:gap-8">
              <Link
                href="/shop"
                className="text-sm font-medium text-foreground/75 hover:text-primary boty-transition"
              >
                Boutique
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?categorie=${c.slug}`}
                  className="text-sm font-medium text-foreground/75 hover:text-primary boty-transition"
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:justify-self-end">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="grid h-11 w-11 place-items-center text-foreground/70 hover:text-primary boty-transition xl:hidden"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden xl:flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4" />
                <span>Rechercher</span>
                <kbd className="rounded border border-border px-1.5 text-[10px] leading-4">/</kbd>
              </button>
              <Link
                href="/favoris"
                className="relative hidden sm:grid h-11 w-11 place-items-center text-foreground/70 hover:text-primary boty-transition"
                aria-label={favoriteCount > 0 ? `Favoris (${favoriteCount})` : "Favoris"}
              >
                <Heart className={`w-5 h-5 ${favoriteCount > 0 ? "fill-primary text-primary" : ""}`} />
                {favoriteCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </Link>
              <Link
                href="/commandes"
                className="hidden sm:grid h-11 w-11 place-items-center text-foreground/70 hover:text-primary boty-transition"
                aria-label="Mes commandes"
              >
                <Package className="w-5 h-5" />
              </Link>
              <Link
                href={account ? "/compte" : "/compte/connexion"}
                className="hidden sm:flex items-center gap-2 p-2 text-foreground/70 hover:text-primary boty-transition"
                aria-label={account ? "Mon compte" : "Se connecter"}
              >
                <User className="w-5 h-5" />
                {account && (
                  <span className="hidden text-sm font-medium xl:block">{account.name.split(" ")[0]}</span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative grid h-11 w-11 place-items-center text-foreground/70 hover:text-primary boty-transition"
                aria-label="Panier"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <CartDrawer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Mobile Navigation */}
          <div
            className={`lg:hidden overflow-hidden boty-transition ${
              isMenuOpen ? "max-h-96 pb-6" : "max-h-0"
            }`}
          >
            <div className="flex flex-col gap-1 pt-2 border-t border-border">
              <Link
                href="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="py-3 text-base font-medium text-foreground hover:text-primary boty-transition"
              >
                Toute la boutique
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?categorie=${c.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="py-3 text-base font-medium text-foreground/80 hover:text-primary boty-transition"
                >
                  {c.label}
                </Link>
              ))}
              <Link
                href="/favoris"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 py-3 text-base font-medium text-foreground/80 hover:text-primary boty-transition"
              >
                <Heart className={`w-4 h-4 ${favoriteCount > 0 ? "fill-primary text-primary" : ""}`} />
                Mes favoris
                {favoriteCount > 0 && <span className="text-sm text-muted-foreground">({favoriteCount})</span>}
              </Link>
              <Link
                href="/commandes"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 py-3 text-base font-medium text-foreground/80 hover:text-primary boty-transition"
              >
                <Package className="w-4 h-4" />
                Mes commandes
              </Link>
              <Link
                href={account ? "/compte" : "/compte/connexion"}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 py-3 text-base font-medium text-foreground/80 hover:text-primary boty-transition"
              >
                <User className="w-4 h-4" />
                {account ? "Mon compte" : "Se connecter"}
              </Link>
            </div>
          </div>
        </nav>
      </header>
      </div>
    </>
  )
}
