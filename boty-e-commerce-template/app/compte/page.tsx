"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Heart, LogOut, MapPin, Package, Sparkles, UserRound, Wallet } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { AccountNav } from "@/components/boty/account-nav"
import { useAuth } from "@/components/boty/auth-context"
import { useFavorites } from "@/components/boty/favorites-context"
import { useOrders } from "@/components/boty/orders-context"
import { OrderStatusBadge } from "@/components/boty/order-status-badge"
import { formatPrice, getProduct } from "@/lib/products"

export default function ComptePage() {
  const router = useRouter()
  const { account, hydrated, logout } = useAuth()
  const { orders } = useOrders()
  const { ids: favoriteIds, count: favoriteCount } = useFavorites()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (hydrated && !account && !leaving) router.replace("/compte/connexion?suite=/compte")
  }, [hydrated, account, leaving, router])

  if (!hydrated || !account) {
    return <main className="min-h-screen"><Header /><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><div className="animate-pulse space-y-5"><div className="h-64 rounded-[2rem] bg-card" /><div className="grid gap-5 lg:grid-cols-3"><div className="h-64 rounded-[2rem] bg-card lg:col-span-2" /><div className="h-64 rounded-[2rem] bg-card" /></div></div></div><Footer /></main>
  }

  const activeOrders = orders.filter((order) => order.status !== "annulee")
  const spent = activeOrders.reduce((sum, order) => sum + order.total, 0)
  const lastOrder = orders[0]
  const favorites = favoriteIds.map((id) => getProduct(id)).filter(Boolean).slice(0, 4)
  const firstName = account.name.split(" ")[0]
  const initials = account.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
  const greeting = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir"

  const logoutAndLeave = () => { setLeaving(true); logout(); router.replace("/") }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-7 text-background sm:px-9 sm:py-9 lg:px-11">
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.08]" /><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-7">
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground sm:h-16 sm:w-16 sm:text-lg">{initials}</span>
              <div className="min-w-0 flex-1"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-background/55">Votre espace personnel</span><h1 className="truncate font-serif text-3xl font-medium tracking-[-0.025em] sm:text-4xl">{greeting} {firstName}</h1><p className="mt-1 truncate text-sm text-background/60">{account.email}</p></div>
              <button onClick={logoutAndLeave} className="inline-flex items-center gap-2 rounded-full border border-background/20 px-4 py-2.5 text-xs font-medium text-background/75 transition hover:border-background/50 hover:bg-background/10 hover:text-background"><LogOut className="h-4 w-4" /> Se déconnecter</button>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl bg-background/15 sm:grid-cols-3">
              <Link href="/commandes" className="flex items-center gap-4 bg-foreground/70 px-5 py-4 transition hover:bg-background/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-background/10"><Package className="h-4 w-4" /></span><span><strong className="block text-xl font-semibold tracking-tight">{orders.length}</strong><small className="text-xs text-background/55">Commande{orders.length > 1 ? "s" : ""}</small></span></Link>
              <Link href="/favoris" className="flex items-center gap-4 bg-foreground/70 px-5 py-4 transition hover:bg-background/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-background/10"><Heart className="h-4 w-4" /></span><span><strong className="block text-xl font-semibold tracking-tight">{favoriteCount}</strong><small className="text-xs text-background/55">Favori{favoriteCount > 1 ? "s" : ""}</small></span></Link>
              <div className="flex items-center gap-4 bg-foreground/70 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-background/10"><Wallet className="h-4 w-4" /></span><span><strong className="block text-xl font-semibold tracking-tight">{formatPrice(spent)}</strong><small className="text-xs text-background/55">Achats réalisés</small></span></div>
            </div>
          </div>
        </section>
        <div className="mt-5"><AccountNav /></div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
          <div className="space-y-5">
            <section className="rounded-[1.75rem] border border-border/70 bg-popover p-5 boty-shadow sm:p-7">
              <header className="mb-5 flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Suivi</p><h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Dernière commande</h2></div>{orders.length > 0 && <Link href="/commandes" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-primary">Toutes les commandes <ArrowRight className="h-3.5 w-3.5" /></Link>}</header>
              {lastOrder ? <Link href={`/commandes/${lastOrder.ref}`} className="group grid gap-5 rounded-2xl bg-secondary/55 p-4 transition hover:bg-secondary sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5"><div className="flex -space-x-2.5">{lastOrder.lines.slice(0, 3).map((line, index) => <span key={`${line.productId}-${index}`} className="relative h-16 w-14 overflow-hidden rounded-xl border-2 border-popover bg-muted"><Image src={line.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" /></span>)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{lastOrder.ref}</p><OrderStatusBadge status={lastOrder.status} /></div><p className="mt-1 text-xs text-muted-foreground">{new Date(lastOrder.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} · {lastOrder.lines.length} article{lastOrder.lines.length > 1 ? "s" : ""}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><strong className="text-sm font-semibold">{formatPrice(lastOrder.total)}</strong><span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background transition group-hover:translate-x-1"><ArrowRight className="h-4 w-4" /></span></div></Link> : <div className="rounded-2xl border border-dashed border-border p-8 text-center"><p className="text-sm text-muted-foreground">Vous n’avez encore passé aucune commande.</p><Link href="/shop" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Découvrir la boutique</Link></div>}
            </section>

            <section className="rounded-[1.75rem] border border-border/70 bg-popover p-5 boty-shadow sm:p-7">
              <header className="mb-5 flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Sélection</p><h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Mes envies</h2></div>{favoriteCount > 0 && <Link href="/favoris" className="text-xs font-medium text-muted-foreground hover:text-primary">Voir les favoris</Link>}</header>
              {favorites.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{favorites.map((product) => <Link key={product!.id} href={`/product/${product!.id}`} className="group"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"><Image src={product!.image} alt={product!.name} fill sizes="(min-width:640px) 160px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" /></div><p className="mt-2 line-clamp-1 text-xs font-medium">{product!.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(product!.price)}</p></Link>)}</div> : <div className="flex items-center gap-4 rounded-2xl bg-secondary/45 p-5"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><Heart className="h-4 w-4" /></span><p className="text-sm text-muted-foreground">Touchez le cœur sur un article pour le retrouver ici.</p></div>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.75rem] bg-card p-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/12 text-primary"><UserRound className="h-5 w-5" /></span><Link href="/compte/profil" className="grid h-9 w-9 place-items-center rounded-full border border-foreground/15 transition hover:bg-foreground hover:text-background" aria-label="Modifier mon profil"><ArrowRight className="h-4 w-4" /></Link></div><h2 className="mt-5 text-lg font-semibold tracking-tight">Mes informations</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Téléphone</dt><dd className="mt-1 font-medium">{account.phone}</dd></div><div><dt className="text-xs text-muted-foreground">Adresses</dt><dd className="mt-1 flex items-center gap-2 font-medium"><MapPin className="h-3.5 w-3.5 text-primary" /> {account.addresses.length ? `${account.addresses.length} enregistrée${account.addresses.length > 1 ? "s" : ""}` : "Aucune adresse"}</dd></div><div><dt className="text-xs text-muted-foreground">Tailles suivies</dt><dd className="mt-1 font-medium">{account.preferences.sizes.length ? account.preferences.sizes.join(", ") : "À compléter"}</dd></div></dl><Link href="/compte/profil" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-primary"><Sparkles className="h-4 w-4" /> Compléter mon profil</Link></section>
            <section className="rounded-[1.75rem] border border-border/70 bg-popover p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Besoin d’aide ?</p><h2 className="mt-2 text-lg font-semibold tracking-tight">Une question sur votre commande ?</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Notre équipe vous répond du lundi au samedi.</p><a href="tel:+221770000000" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Nous contacter <ArrowRight className="h-4 w-4" /></a></section>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  )
}
