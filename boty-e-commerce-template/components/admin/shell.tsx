"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BadgePercent,
  Bell,
  Boxes,
  ChevronRight,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Tags,
  Search,
  Settings,
  SlidersHorizontal,
  Store,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/lib/admin/store"
import { formatPrice } from "@/lib/products"

export const ADMIN_SESSION_KEY = "mcm-admin-session"

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: Tags },
  { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
  { href: "/admin/commandes", label: "Commandes", icon: Boxes },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/configuration", label: "Configuration", icon: SlidersHorizontal },
  { href: "/admin/reglages", label: "Réglages", icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

/* ------------------------------------------------------------------ */
/* Garde d'accès (démonstration côté navigateur, pas une sécurité)     */
/* ------------------------------------------------------------------ */

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === "/admin/connexion") {
      setChecked(true)
      return
    }
    const session = window.localStorage.getItem(ADMIN_SESSION_KEY)
    if (!session) router.replace("/admin/connexion")
    else setChecked(true)
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
          Ouverture de l&apos;espace d&apos;administration…
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/* ------------------------------------------------------------------ */
/* Palette de commandes                                                */
/* ------------------------------------------------------------------ */

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { products, orders, customers } = useAdmin()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = NAV.filter((item) => !q || item.label.toLowerCase().includes(q)).map((item) => ({
      key: `page-${item.href}`,
      group: "Navigation",
      label: item.label,
      hint: item.href,
      href: item.href,
    }))
    if (!q) return pages

    const productHits = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({ key: `p-${p.id}`, group: "Produits", label: p.name, hint: p.sku, href: `/admin/produits/${p.id}` }))

    const orderHits = orders
      .filter((o) => o.ref.toLowerCase().includes(q))
      .slice(0, 4)
      .map((o) => ({ key: `o-${o.id}`, group: "Commandes", label: o.ref, hint: formatPrice(o.total), href: `/admin/commandes?ref=${o.ref}` }))

    const customerHits = customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({ key: `c-${c.id}`, group: "Clients", label: c.name, hint: c.email, href: `/admin/clients?q=${encodeURIComponent(c.name)}` }))

    return [...pages, ...productHits, ...orderHits, ...customerHits]
  }, [query, products, orders, customers])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl animate-scale-fade-in">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose()
              if (e.key === "Enter" && results[0]) {
                router.push(results[0].href)
                onClose()
              }
            }}
            placeholder="Produit, commande, cliente, page…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">Aucun résultat.</p>}
          {results.map((result, index) => (
            <button
              key={result.key}
              type="button"
              onClick={() => {
                router.push(result.href)
                onClose()
              }}
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition hover:bg-secondary/60"
            >
              <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {index === 0 || results[index - 1].group !== result.group ? result.group : ""}
              </span>
              <span className="flex-1 truncate">{result.label}</span>
              <span className="truncate text-xs text-muted-foreground">{result.hint}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Coquille                                                            */
/* ------------------------------------------------------------------ */

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { products, orders, settings } = useAdmin()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const pendingOrders = orders.filter((o) => o.status === "en_attente" || o.status === "payee").length
  const lowStock = products.filter((p) => p.stock <= settings.lowStockThreshold && p.status === "publie").length
  const badges: Record<string, number> = { "/admin/commandes": pendingOrders, "/admin/produits": lowStock }

  const logout = () => {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    router.replace("/admin/connexion")
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-[#30282a] px-4 py-6 text-[#fffaf5]">
      <Link href="/admin" className="flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ef9d82] font-serif text-lg text-[#30282a]">M</span>
        <span>
          <span className="block font-serif text-base leading-tight">{settings.storeName}</span>
          <span className="block text-[11px] text-white/50">Espace administration</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-white/15 px-1.5 py-0.5 text-[10px]">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          const badge = badges[item.href]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition",
                active ? "bg-[#fffaf5] font-medium text-[#30282a]" : "text-white/60 hover:bg-white/8 hover:text-white",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-[#e0654e]" : "")} />
              <span className="flex-1">{item.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-[#e0654e] text-white" : "bg-white/12 text-white/80",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
        >
          <Store className="h-4 w-4" />
          Voir la boutique
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )

  return (
    // Le fond de la page reprend la teinte du menu : la zone de travail vient
    // s'y poser comme une feuille arrondie, détachée du bord de l'écran.
    <div className="min-h-screen bg-[#30282a]">
      {/* Sidebar fixe (grand écran) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>

      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="relative h-full w-[280px] animate-scale-fade-in">
            {sidebar}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute -right-12 top-5 grid h-9 w-9 place-items-center rounded-full bg-popover text-foreground"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-[#30282a] px-4 text-[#fffaf5] sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav aria-label="Fil d'Ariane" className="hidden items-center gap-1.5 text-sm text-white/45 sm:flex">
            <span>Administration</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-white">
              {NAV.find((item) => isActive(pathname, item.href, item.exact))?.label ?? "Produit"}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Rechercher"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/admin/commandes"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label={`${pendingOrders} commandes à traiter`}
            >
              <Bell className="h-4 w-4" />
              {pendingOrders > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {pendingOrders}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2.5 rounded-full border border-white/15 py-1 pl-1 pr-3.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ef9d82]/25 text-xs font-semibold text-[#ef9d82]">
                OS
              </span>
              <span className="hidden text-xs leading-tight sm:block">
                <span className="block font-medium">Ousseynou Seck</span>
                <span className="block text-white/45">Gestionnaire</span>
              </span>
            </div>
          </div>
        </header>

        {/* La feuille de travail : coins arrondis, marge sur les bords, le fond
            sombre reste visible tout autour. */}
        <main className="mx-2 mb-2 min-h-[calc(100vh-4.5rem)] rounded-[1.75rem] bg-background px-4 py-7 shadow-[0_-24px_60px_-40px_rgba(0,0,0,0.75)] sm:px-6 lg:mb-3 lg:ml-3 lg:mr-3 lg:min-h-[calc(100vh-4.75rem)] lg:rounded-[2.25rem] lg:px-8 lg:py-9">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
