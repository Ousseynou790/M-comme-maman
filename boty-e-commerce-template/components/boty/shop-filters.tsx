"use client"

import type { ReactNode } from "react"
import { Check, X } from "lucide-react"
import { ageGroups, categories, formatPrice, type AgeGroup, type CategorySlug } from "@/lib/products"

/** Tranches de prix proposées, calées sur l'étendue du catalogue. */
export const priceBands = [
  { value: "0-6000", label: "Moins de 6 000 F", min: 0, max: 5999 },
  { value: "6000-10000", label: "6 000 à 10 000 F", min: 6000, max: 10000 },
  { value: "10000+", label: "Plus de 10 000 F", min: 10001, max: Number.POSITIVE_INFINITY },
] as const

export type PriceBand = (typeof priceBands)[number]["value"]

export interface ShopFilters {
  ages: AgeGroup[]
  cats: CategorySlug[]
  sizes: string[]
  bands: PriceBand[]
  promoOnly: boolean
}

export const emptyFilters: ShopFilters = { ages: [], cats: [], sizes: [], bands: [], promoOnly: false }

export function countActive(f: ShopFilters): number {
  return f.ages.length + f.cats.length + f.sizes.length + f.bands.length + (f.promoOnly ? 1 : 0)
}

/* ------------------------------------------------------------------ */

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border/60 pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

/** Case à cocher dessinée, avec le compte d'articles à droite. */
function Ligne({
  checked,
  onToggle,
  label,
  hint,
  count,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  hint?: string
  count?: number
}) {
  const vide = count === 0
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={vide}
      aria-pressed={checked}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left boty-transition ${
        vide ? "cursor-not-allowed opacity-40" : "hover:bg-card"
      }`}
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border boty-transition ${
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="min-w-0 flex-1 text-sm text-foreground">
        {label}
        {hint && <span className="ml-1.5 text-xs text-muted-foreground">{hint}</span>}
      </span>
      {count !== undefined && <span className="shrink-0 text-xs text-muted-foreground">{count}</span>}
    </button>
  )
}

export function FiltersPanel({
  filters,
  onChange,
  sizeOptions,
  counts,
}: {
  filters: ShopFilters
  onChange: (next: ShopFilters) => void
  sizeOptions: string[]
  /** Nombre d'articles par valeur, pour ne pas proposer des filtres qui ne donnent rien. */
  counts: {
    ages: Record<string, number>
    cats: Record<string, number>
    sizes: Record<string, number>
    bands: Record<string, number>
    promo: number
  }
}) {
  const bascule = <K extends "ages" | "cats" | "sizes" | "bands">(cle: K, valeur: ShopFilters[K][number]) => {
    const liste = filters[cle] as string[]
    const suivante = liste.includes(valeur as string)
      ? liste.filter((v) => v !== valeur)
      : [...liste, valeur as string]
    onChange({ ...filters, [cle]: suivante } as ShopFilters)
  }

  const actifs = countActive(filters)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-foreground">Filtrer</h2>
        {actifs > 0 && (
          <button
            type="button"
            onClick={() => onChange(emptyFilters)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 boty-transition hover:text-foreground"
          >
            <X className="h-3 w-3" /> Tout effacer ({actifs})
          </button>
        )}
      </div>

      <Group title="Âge">
        <div className="space-y-0.5">
          {ageGroups.map((a) => (
            <Ligne
              key={a.value}
              checked={filters.ages.includes(a.value)}
              onToggle={() => bascule("ages", a.value)}
              label={a.label}
              hint={a.hint}
              count={counts.ages[a.value] ?? 0}
            />
          ))}
        </div>
      </Group>

      <Group title="Catégorie">
        <div className="space-y-0.5">
          {categories.map((c) => (
            <Ligne
              key={c.slug}
              checked={filters.cats.includes(c.slug)}
              onToggle={() => bascule("cats", c.slug)}
              label={c.label}
              count={counts.cats[c.slug] ?? 0}
            />
          ))}
        </div>
      </Group>

      <Group title="Prix">
        <div className="space-y-0.5">
          {priceBands.map((b) => (
            <Ligne
              key={b.value}
              checked={filters.bands.includes(b.value)}
              onToggle={() => bascule("bands", b.value)}
              label={b.label}
              count={counts.bands[b.value] ?? 0}
            />
          ))}
        </div>
      </Group>

      <Group title="Taille">
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map((t) => {
            const actif = filters.sizes.includes(t)
            const vide = (counts.sizes[t] ?? 0) === 0
            return (
              <button
                key={t}
                type="button"
                disabled={vide}
                onClick={() => bascule("sizes", t)}
                aria-pressed={actif}
                className={`rounded-full border px-3 py-1.5 text-xs boty-transition ${
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : vide
                      ? "cursor-not-allowed border-border/50 text-muted-foreground/40"
                      : "border-border text-foreground hover:border-primary/50"
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Bons plans">
        <Ligne
          checked={filters.promoOnly}
          onToggle={() => onChange({ ...filters, promoOnly: !filters.promoOnly })}
          label="En promotion"
          count={counts.promo}
        />
      </Group>
    </div>
  )
}

/** Applique les filtres à une liste, hors filtre dont on veut compter les options. */
export function matchFilters(
  p: { age: AgeGroup; category: CategorySlug; sizes: string[]; price: number; originalPrice: number | null },
  f: ShopFilters,
  ignorer?: keyof ShopFilters,
): boolean {
  if (ignorer !== "ages" && f.ages.length && !f.ages.includes(p.age)) return false
  if (ignorer !== "cats" && f.cats.length && !f.cats.includes(p.category)) return false
  if (ignorer !== "sizes" && f.sizes.length && !f.sizes.some((t) => p.sizes.includes(t))) return false
  if (ignorer !== "promoOnly" && f.promoOnly && !(p.originalPrice && p.originalPrice > p.price)) return false
  if (ignorer !== "bands" && f.bands.length) {
    const dans = f.bands.some((v) => {
      const b = priceBands.find((x) => x.value === v)
      return b ? p.price >= b.min && p.price <= b.max : false
    })
    if (!dans) return false
  }
  return true
}

export { formatPrice }
