"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, MapPin, Phone, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/products"
import { computeCustomerStats, useAdmin } from "@/lib/admin/store"
import type { CustomerSegment } from "@/lib/admin/types"
import {
  EmptyState,
  OrderStatusPill,
  PageHeader,
  Panel,
  SearchField,
  SelectField,
  SideDrawer,
} from "@/components/admin/ui"

const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  nouvelle: "Nouvelle",
  fidele: "Fidèle",
  vip: "VIP",
  endormie: "Endormie",
}

const SEGMENT_STYLES: Record<CustomerSegment, string> = {
  nouvelle: "bg-secondary text-muted-foreground",
  fidele: "bg-accent/15 text-[#4f6a49]",
  vip: "bg-primary/12 text-primary",
  endormie: "bg-[#C79A6B]/15 text-[#8a6a3f]",
}

function formatDate(iso: string | null) {
  if (!iso) return "Jamais"
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement des clientes…</p>}>
      <ClientsContent />
    </Suspense>
  )
}

function ClientsContent() {
  const searchParams = useSearchParams()
  const { customers, orders } = useAdmin()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [segment, setSegment] = useState<CustomerSegment | "tous">("tous")
  const [openId, setOpenId] = useState<string | null>(null)

  const stats = useMemo(() => computeCustomerStats(customers, orders), [customers, orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stats.filter((entry) => {
      if (segment !== "tous" && entry.segment !== segment) return false
      if (!q) return true
      return `${entry.customer.name} ${entry.customer.email} ${entry.customer.city}`.toLowerCase().includes(q)
    })
  }, [stats, query, segment])

  const open = stats.find((s) => s.customer.id === openId) ?? null
  const openOrders = open ? orders.filter((o) => o.customerId === open.customer.id) : []

  const totals = {
    total: customers.length,
    vip: stats.filter((s) => s.segment === "vip").length,
    optIn: customers.filter((c) => c.marketingOptIn).length,
    ltv: stats.length ? Math.round(stats.reduce((sum, s) => sum + s.spent, 0) / stats.length) : 0,
  }

  return (
    <>
      <PageHeader
        eyebrow="Relation client"
        title="Clientes"
        description="Historique d'achat, segments et coordonnées, pour savoir qui relancer."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Clientes inscrites", value: String(totals.total) },
          { label: "Clientes VIP", value: String(totals.vip) },
          { label: "Panier moyen à vie", value: formatPrice(totals.ltv) },
          { label: "Acceptent la newsletter", value: `${totals.optIn} / ${totals.total}` },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/70 bg-popover/70 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-serif text-2xl leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SearchField value={query} onChange={setQuery} placeholder="Nom, e-mail, ville…" />
        <SelectField
          value={segment}
          onChange={setSegment}
          options={[
            { value: "tous" as const, label: "Tous les segments" },
            ...(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map((s) => ({ value: s, label: SEGMENT_LABELS[s] })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune cliente" description="Aucune fiche ne correspond à cette recherche." />
      ) : (
        <Panel bodyClassName="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Ville</th>
                  <th className="px-3 py-3 font-medium">Commandes</th>
                  <th className="px-3 py-3 font-medium">Dernier achat</th>
                  <th className="px-3 py-3 font-medium">Segment</th>
                  <th className="py-3 pr-6 text-right font-medium">Total dépensé</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((entry) => (
                  <tr
                    key={entry.customer.id}
                    onClick={() => setOpenId(entry.customer.id)}
                    className="cursor-pointer border-b border-border/40 last:border-0 transition hover:bg-secondary/40"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                          {entry.customer.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{entry.customer.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {entry.customer.email}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{entry.customer.city}</td>
                    <td className="px-3 py-3">{entry.orders}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(entry.lastOrder)}</td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", SEGMENT_STYLES[entry.segment])}>
                        {SEGMENT_LABELS[entry.segment]}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-right font-medium">{formatPrice(entry.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <SideDrawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.customer.name ?? ""}
        subtitle={open ? `Cliente depuis le ${formatDate(open.customer.createdAt)}` : undefined}
      >
        {open && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total dépensé</p>
                <p className="mt-1 font-serif text-xl">{formatPrice(open.spent)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Commandes</p>
                <p className="mt-1 font-serif text-xl">{open.orders}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {open.customer.email}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {open.customer.phone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {open.customer.city}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {open.customer.marketingOptIn ? "Accepte la newsletter" : "N'accepte pas la newsletter"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Historique ({openOrders.length})
              </p>
              {openOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune commande enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {openOrders.slice(0, 12).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="block font-medium">{order.ref}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <OrderStatusPill status={order.status} />
                        <span className="font-medium">{formatPrice(order.total)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SideDrawer>
    </>
  )
}
