"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, MapPin, Phone, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/products"
import { ORDER_PIPELINE, STATUS_LABELS, useAdmin } from "@/lib/admin/store"
import type { Order, OrderStatus, PaymentMethod } from "@/lib/admin/types"
import {
  ActionButton,
  EmptyState,
  OrderStatusPill,
  PageHeader,
  Panel,
  SearchField,
  SelectField,
  SideDrawer,
} from "@/components/admin/ui"

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  carte: "Carte bancaire",
  livraison: "Paiement à la livraison",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default function CommandesPage() {
  // useSearchParams impose une frontière Suspense côté App Router.
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement des commandes…</p>}>
      <CommandesContent />
    </Suspense>
  )
}

function CommandesContent() {
  const searchParams = useSearchParams()
  const { orders, customers, setOrderStatus } = useAdmin()

  const [query, setQuery] = useState(searchParams.get("ref") ?? "")
  const [status, setStatus] = useState<OrderStatus | "toutes">("toutes")
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((order) => {
      if (status !== "toutes" && order.status !== status) return false
      if (!q) return true
      const customer = customers.find((c) => c.id === order.customerId)
      return `${order.ref} ${customer?.name ?? ""} ${order.city}`.toLowerCase().includes(q)
    })
  }, [orders, customers, query, status])

  const open = orders.find((o) => o.id === openId) ?? null
  const openCustomer = open ? customers.find((c) => c.id === open.customerId) : null

  const counts = ORDER_PIPELINE.map((s) => ({ status: s, count: orders.filter((o) => o.status === s).length }))
  const toProcess = orders.filter((o) => o.status === "en_attente" || o.status === "payee").length

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    const index = ORDER_PIPELINE.indexOf(current)
    if (index === -1 || index === ORDER_PIPELINE.length - 1) return null
    return ORDER_PIPELINE[index + 1]
  }

  return (
    <>
      <PageHeader
        eyebrow="Logistique"
        title="Commandes"
        description={`${orders.length} commandes au total · ${toProcess} en attente de traitement`}
      />

      {/* File de traitement : un clic sur une étape filtre la liste */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {counts.map((entry) => (
          <button
            key={entry.status}
            type="button"
            onClick={() => setStatus(status === entry.status ? "toutes" : entry.status)}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left transition",
              status === entry.status
                ? "border-primary bg-primary/8"
                : "border-border/70 bg-popover/70 hover:border-primary/40",
            )}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{STATUS_LABELS[entry.status]}</p>
            <p className="mt-1 font-serif text-2xl leading-none">{entry.count}</p>
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SearchField value={query} onChange={setQuery} placeholder="Référence, cliente, ville…" />
        <SelectField
          value={status}
          onChange={setStatus}
          options={[
            { value: "toutes" as const, label: "Tous les statuts" },
            ...ORDER_PIPELINE.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            { value: "annulee" as const, label: STATUS_LABELS.annulee },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune commande" description="Aucune commande ne correspond à cette recherche." />
      ) : (
        <Panel bodyClassName="px-0 py-0">
          {/* Petit écran : une carte par commande. Un tableau de 820 px de
              large ne se consulte pas au doigt. */}
          <ul className="divide-y divide-border/40 lg:hidden">
            {filtered.slice(0, 60).map((order) => {
              const customer = customers.find((c) => c.id === order.customerId)
              const next = nextStatus(order.status)
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(order.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-secondary/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{order.ref}</span>
                        <OrderStatusPill status={order.status} />
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {customer?.name ?? "—"} · {order.city}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatDate(order.createdAt)} · {order.lines.reduce((sum, l) => sum + l.quantity, 0)} pièce(s)
                        · {PAYMENT_LABELS[order.payment]}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-medium">{formatPrice(order.total)}</span>
                      {next && order.status !== "annulee" && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOrderStatus(order.id, next)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              e.stopPropagation()
                              setOrderStatus(order.id, next)
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition active:border-primary"
                        >
                          <Truck className="h-3 w-3" />
                          {STATUS_LABELS[next]}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Référence</th>
                  <th className="px-3 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Articles</th>
                  <th className="px-3 py-3 font-medium">Paiement</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 text-right font-medium">Montant</th>
                  <th className="py-3 pr-6 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((order) => {
                  const customer = customers.find((c) => c.id === order.customerId)
                  const next = nextStatus(order.status)
                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b border-border/40 last:border-0 transition hover:bg-secondary/40"
                      onClick={() => setOpenId(order.id)}
                    >
                      <td className="px-6 py-3">
                        <span className="font-medium">{order.ref}</span>
                        <span className="block text-[11px] text-muted-foreground">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block truncate">{customer?.name ?? "—"}</span>
                        <span className="block text-[11px] text-muted-foreground">{order.city}</span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {order.lines.reduce((sum, l) => sum + l.quantity, 0)} pièce(s)
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{PAYMENT_LABELS[order.payment]}</td>
                      <td className="px-3 py-3">
                        <OrderStatusPill status={order.status} />
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                      <td className="py-3 pr-6 text-right">
                        {next && order.status !== "annulee" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOrderStatus(order.id, next)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary hover:text-primary"
                          >
                            <Truck className="h-3 w-3" />
                            {STATUS_LABELS[next]}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 60 && (
            <p className="border-t border-border/60 px-6 py-3 text-center text-xs text-muted-foreground">
              60 commandes affichées sur {filtered.length} — affinez la recherche pour voir les suivantes.
            </p>
          )}
        </Panel>
      )}

      {/* Fiche commande */}
      <SideDrawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.ref ?? ""}
        subtitle={open ? formatDate(open.createdAt) : undefined}
        footer={
          open && open.status !== "annulee" ? (
            <div className="flex flex-wrap gap-2">
              {nextStatus(open.status) && (
                <ActionButton
                  variant="primary"
                  className="flex-1"
                  onClick={() => setOrderStatus(open.id, nextStatus(open.status) as OrderStatus)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Passer à « {STATUS_LABELS[nextStatus(open.status) as OrderStatus]} »
                </ActionButton>
              )}
              <ActionButton variant="danger" onClick={() => setOrderStatus(open.id, "annulee")}>
                Annuler
              </ActionButton>
            </div>
          ) : null
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <OrderStatusPill status={open.status} />
              <span className="font-serif text-2xl">{formatPrice(open.total)}</span>
            </div>

            {/* Suivi visuel */}
            <ol className="relative space-y-4 border-l border-dashed border-border pl-5">
              {ORDER_PIPELINE.map((step) => {
                const reached = ORDER_PIPELINE.indexOf(open.status) >= ORDER_PIPELINE.indexOf(step)
                return (
                  <li key={step} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border-2",
                        reached ? "border-primary bg-primary" : "border-border bg-background",
                      )}
                    />
                    <p className={cn("text-sm", reached ? "font-medium" : "text-muted-foreground")}>
                      {STATUS_LABELS[step]}
                    </p>
                  </li>
                )
              })}
            </ol>

            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <p className="font-medium">{openCustomer?.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {open.city}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {openCustomer?.phone}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{openCustomer?.email}</p>
              {openCustomer && (
                <Link
                  href={`/admin/clients?q=${encodeURIComponent(openCustomer.name)}`}
                  className="mt-2 inline-block text-xs font-medium text-primary underline underline-offset-4"
                >
                  Voir sa fiche cliente
                </Link>
              )}
            </div>

            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Articles</p>
              <ul className="space-y-2">
                {open.lines.map((line, index) => (
                  <li
                    key={`${line.productId}-${line.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{line.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Taille {line.size} · ×{line.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{formatPrice(line.price * line.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Paiement</span>
                <span>{PAYMENT_LABELS[open.payment]}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(open.total)}</span>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </>
  )
}
