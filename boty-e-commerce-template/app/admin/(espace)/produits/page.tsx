"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, LayoutGrid, Minus, Pencil, Plus, Rows3, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { categories, formatPrice, type CategorySlug } from "@/lib/products"
import { computeProductPerformance, useAdmin } from "@/lib/admin/store"
import type { ProductStatus } from "@/lib/admin/types"
import {
  ActionButton,
  EmptyState,
  PageHeader,
  Panel,
  ProductStatusPill,
  SearchField,
  SelectField,
} from "@/components/admin/ui"

type SortKey = "recents" | "prix-desc" | "prix-asc" | "stock" | "ventes"

export default function ProduitsPage() {
  const router = useRouter()
  const { products, orders, settings, setStock, setProductStatus, duplicateProduct, deleteProduct } = useAdmin()

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategorySlug | "toutes">("toutes")
  const [status, setStatus] = useState<ProductStatus | "tous">("tous")
  const [sort, setSort] = useState<SortKey>("recents")
  const [view, setView] = useState<"table" | "grille">("table")

  /* Un tableau de 860 px ne se lit pas sur un téléphone : on ouvre en cartes
     sous 1024 px. Le choix reste libre ensuite. */
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setView("grille")
  }, [])
  const [selection, setSelection] = useState<string[]>([])

  const salesById = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of computeProductPerformance(products, orders)) map.set(entry.product.id, entry.units)
    return map
  }, [products, orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => {
      if (category !== "toutes" && p.category !== category) return false
      if (status !== "tous" && p.status !== status) return false
      if (q && !`${p.name} ${p.sku} ${p.tagline}`.toLowerCase().includes(q)) return false
      return true
    })

    const sorted = [...list]
    switch (sort) {
      case "prix-desc":
        sorted.sort((a, b) => b.price - a.price)
        break
      case "prix-asc":
        sorted.sort((a, b) => a.price - b.price)
        break
      case "stock":
        sorted.sort((a, b) => a.stock - b.stock)
        break
      case "ventes":
        sorted.sort((a, b) => (salesById.get(b.id) ?? 0) - (salesById.get(a.id) ?? 0))
        break
      default:
        sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return sorted
  }, [products, query, category, status, sort, salesById])

  const allSelected = filtered.length > 0 && selection.length === filtered.length
  const toggleAll = () => setSelection(allSelected ? [] : filtered.map((p) => p.id))
  const toggle = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]))

  const totalStockValue = filtered.reduce((sum, p) => sum + p.price * p.stock, 0)

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Produits"
        description={`${products.length} fiches · valeur du stock affiché ${formatPrice(totalStockValue)}`}
      >
        <div className="flex rounded-full border border-border p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn("rounded-full px-3 py-1.5", view === "table" && "bg-secondary")}
            aria-label="Vue tableau"
          >
            <Rows3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("grille")}
            className={cn("rounded-full px-3 py-1.5", view === "grille" && "bg-secondary")}
            aria-label="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
        <Link href="/admin/produits/nouveau">
          <ActionButton variant="primary">
            <Plus className="h-4 w-4" /> Nouveau produit
          </ActionButton>
        </Link>
      </PageHeader>

      {/* Filtres */}
      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <SearchField value={query} onChange={setQuery} placeholder="Nom, référence, accroche…" />
        <SelectField
          value={category}
          onChange={setCategory}
          options={[
            { value: "toutes" as const, label: "Toutes les catégories" },
            ...categories.map((c) => ({ value: c.slug, label: c.label })),
          ]}
        />
        <SelectField
          value={status}
          onChange={setStatus}
          options={[
            { value: "tous" as const, label: "Tous les statuts" },
            { value: "publie" as const, label: "Publiés" },
            { value: "brouillon" as const, label: "Brouillons" },
            { value: "archive" as const, label: "Archivés" },
          ]}
        />
        <SelectField
          value={sort}
          onChange={setSort}
          options={[
            { value: "recents" as const, label: "Modifiés récemment" },
            { value: "ventes" as const, label: "Meilleures ventes" },
            { value: "stock" as const, label: "Stock croissant" },
            { value: "prix-desc" as const, label: "Prix décroissant" },
            { value: "prix-asc" as const, label: "Prix croissant" },
          ]}
        />
      </div>

      {/* Actions groupées */}
      {selection.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 animate-scale-fade-in">
          <span className="text-sm font-medium">
            {selection.length} produit{selection.length > 1 ? "s" : ""} sélectionné{selection.length > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <ActionButton
              variant="soft"
              onClick={() => {
                selection.forEach((id) => setProductStatus(id, "publie"))
                setSelection([])
              }}
            >
              Publier
            </ActionButton>
            <ActionButton
              variant="soft"
              onClick={() => {
                selection.forEach((id) => setProductStatus(id, "archive"))
                setSelection([])
              }}
            >
              Archiver
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setSelection([])}>
              Annuler
            </ActionButton>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun produit ne correspond"
          description="Modifiez les filtres ou créez une nouvelle fiche produit."
          action={
            <Link href="/admin/produits/nouveau">
              <ActionButton variant="primary">
                <Plus className="h-4 w-4" /> Créer un produit
              </ActionButton>
            </Link>
          }
        />
      ) : view === "table" ? (
        <Panel bodyClassName="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="w-10 py-3 pl-6">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-[var(--primary)]"
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Produit</th>
                  <th className="px-3 py-3 font-medium">Catégorie</th>
                  <th className="px-3 py-3 font-medium">Prix</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Ventes</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="py-3 pr-6 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const low = product.stock <= settings.lowStockThreshold
                  return (
                    <tr key={product.id} className="border-b border-border/40 last:border-0 transition hover:bg-secondary/40">
                      <td className="py-3 pl-6">
                        <input
                          type="checkbox"
                          checked={selection.includes(product.id)}
                          onChange={() => toggle(product.id)}
                          className="h-4 w-4 accent-[var(--primary)]"
                          aria-label={`Sélectionner ${product.name}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                            <Image
                              src={product.image}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized={product.image.startsWith("data:")}
                            />
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/admin/produits/${product.id}`}
                              className="block truncate font-medium hover:text-primary"
                            >
                              {product.name}
                            </Link>
                            <span className="block text-[11px] text-muted-foreground">{product.sku}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {categories.find((c) => c.slug === product.category)?.label}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="block text-[11px] text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {/* Ajustement du stock sans quitter la liste */}
                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-input/40 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => setStock(product.id, product.stock - 1)}
                            className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-secondary"
                            aria-label="Retirer une pièce"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={cn("w-8 text-center text-xs font-semibold", low && "text-primary")}>
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStock(product.id, product.stock + 1)}
                            className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-secondary"
                            aria-label="Ajouter une pièce"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{salesById.get(product.id) ?? 0}</td>
                      <td className="px-3 py-3">
                        <ProductStatusPill status={product.status} />
                      </td>
                      <td className="py-3 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/produits/${product.id}`}
                            className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-secondary"
                            aria-label={`Modifier ${product.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = duplicateProduct(product.id)
                              if (copy) router.push(`/admin/produits/${copy.id}`)
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-secondary"
                            aria-label={`Dupliquer ${product.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer « ${product.name} » ?`)) deleteProduct(product.id)
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
                            aria-label={`Supprimer ${product.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/admin/produits/${product.id}`}
              className="group overflow-hidden rounded-[1.75rem] border border-border/70 bg-popover/80 transition hover:-translate-y-1 hover:border-primary/40 boty-shadow"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={product.image}
                  alt=""
                  fill
                  sizes="(max-width:768px) 100vw, 300px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                  unoptimized={product.image.startsWith("data:")}
                />
                <span className="absolute left-3 top-3">
                  <ProductStatusPill status={product.status} />
                </span>
              </div>
              <div className="p-4">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-[11px] text-muted-foreground">{product.sku}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">{formatPrice(product.price)}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      product.stock <= settings.lowStockThreshold
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    stock {product.stock}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
