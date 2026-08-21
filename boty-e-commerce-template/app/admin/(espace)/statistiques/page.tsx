"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { categories, formatPrice } from "@/lib/products"
import {
  buildDailySeries,
  computeCategoryBreakdown,
  computeCustomerStats,
  computePeriod,
  computeProductPerformance,
  deltaPercent,
  REFERENCE_DATE,
  useAdmin,
} from "@/lib/admin/store"
import { ColumnChart, DonutChart, RankingBars, TrendChart } from "@/components/admin/charts"
import { PageHeader, Panel } from "@/components/admin/ui"

const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
  { days: 180, label: "6 mois" },
] as const

export default function StatistiquesPage() {
  const { products, orders, customers } = useAdmin()
  const [range, setRange] = useState<number>(30)

  const current = useMemo(() => computePeriod(orders, range), [orders, range])
  const previous = useMemo(() => computePeriod(orders, range, 1), [orders, range])
  const series = useMemo(() => buildDailySeries(orders, range), [orders, range])
  const performance = useMemo(() => computeProductPerformance(products, orders), [products, orders])
  const breakdown = useMemo(() => computeCategoryBreakdown(products, orders), [products, orders])
  const customerStats = useMemo(() => computeCustomerStats(customers, orders), [customers, orders])

  /* Chiffre d'affaires mois par mois, sur les 6 derniers mois. */
  const monthly = useMemo(() => {
    const buckets: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(REFERENCE_DATE)
      d.setUTCDate(1)
      d.setUTCMonth(d.getUTCMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const value = orders
        .filter((o) => o.createdAt.slice(0, 7) === key && o.status !== "annulee" && o.status !== "en_attente")
        .reduce((sum, o) => sum + o.total, 0)
      buckets.push({ label: d.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }), value })
    }
    return buckets
  }, [orders])

  /* Répartition par ville et par moyen de paiement. */
  const byCity = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders) {
      if (order.status === "annulee") continue
      map.set(order.city, (map.get(order.city) ?? 0) + order.total)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [orders])

  const byPayment = useMemo(() => {
    const labels: Record<string, string> = {
      wave: "Wave",
      orange_money: "Orange Money",
      carte: "Carte bancaire",
      livraison: "À la livraison",
    }
    const map = new Map<string, number>()
    for (const order of orders) {
      if (order.status === "annulee") continue
      map.set(labels[order.payment], (map.get(labels[order.payment]) ?? 0) + order.total)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [orders])

  const repeatRate = customerStats.length
    ? customerStats.filter((c) => c.orders > 1).length / customerStats.filter((c) => c.orders > 0).length
    : 0

  const kpis = [
    { label: "Chiffre d'affaires", value: formatPrice(current.revenue), delta: deltaPercent(current.revenue, previous.revenue) },
    { label: "Commandes", value: String(current.orders), delta: deltaPercent(current.orders, previous.orders) },
    { label: "Panier moyen", value: formatPrice(current.averageBasket), delta: deltaPercent(current.averageBasket, previous.averageBasket) },
    { label: "Taux d'annulation", value: `${(current.cancelRate * 100).toFixed(1)} %`, delta: deltaPercent(current.cancelRate, previous.cancelRate) },
    { label: "Clientes actives", value: String(current.customers), delta: deltaPercent(current.customers, previous.customers) },
    { label: "Réachat", value: `${(repeatRate * 100).toFixed(0)} %`, delta: null },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Analyse"
        title="Statistiques"
        description="Comparaison automatique avec la période précédente de même durée."
      >
        <div className="flex rounded-full border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRange(r.days)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                range === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border/70 bg-popover/70 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="font-serif text-2xl leading-none">{kpi.value}</p>
              {kpi.delta !== null && (
                <span className={cn("text-xs font-medium", kpi.delta >= 0 ? "text-[#4f6a49]" : "text-destructive")}>
                  {kpi.delta >= 0 ? "+" : ""}
                  {kpi.delta.toFixed(1)} %
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title={`Évolution — ${RANGES.find((r) => r.days === range)?.label}`} subtitle="Chiffre d'affaires encaissé par jour">
          <TrendChart data={series.map((d) => ({ label: d.label, value: d.revenue }))} formatValue={formatPrice} height={260} />
        </Panel>
        <Panel title="Volume mensuel" subtitle="Six derniers mois">
          <ColumnChart data={monthly} formatValue={formatPrice} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Répartition par catégorie">
          <DonutChart
            centerLabel="Total"
            formatValue={formatPrice}
            data={breakdown.map((b) => ({
              label: categories.find((c) => c.slug === b.category)?.label ?? b.category,
              value: b.revenue,
            }))}
          />
        </Panel>
        <Panel title="Moyens de paiement">
          <DonutChart centerLabel="Encaissé" formatValue={formatPrice} data={byPayment} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Top produits" subtitle="Chiffre d'affaires cumulé">
          <RankingBars
            formatValue={formatPrice}
            data={performance.slice(0, 8).map((p) => ({
              label: p.product.name,
              value: p.revenue,
              hint: `${p.units} pièces`,
            }))}
          />
        </Panel>
        <Panel title="Villes les plus actives" subtitle="Chiffre d'affaires par ville de livraison">
          <RankingBars formatValue={formatPrice} data={byCity} />
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Produits sans vente" subtitle="À retravailler : photo, prix ou mise en avant">
          {performance.filter((p) => p.units === 0).length === 0 ? (
            <p className="text-sm text-muted-foreground">Tous les produits ont trouvé preneur sur la période.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {performance
                .filter((p) => p.units === 0)
                .map((p) => (
                  <li
                    key={p.product.id}
                    className="rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground"
                  >
                    {p.product.name}
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
