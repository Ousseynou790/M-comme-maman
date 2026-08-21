"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Package, Truck } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { ORDER_STEPS, useOrders } from "@/components/boty/orders-context"
import { OrderStatusBadge } from "@/components/boty/order-status-badge"
import { formatPrice } from "@/lib/products"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function CommandesPage() {
  const { orders, hydrated } = useOrders()

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="mb-4 block text-sm uppercase tracking-[0.3em] text-primary">Suivi</span>
            <h1 className="mb-4 text-balance font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
              Mes commandes
            </h1>
            <p className="mx-auto max-w-md text-lg text-muted-foreground">
              Retrouvez vos commandes et l&apos;avancement de chaque colis.
            </p>
          </div>

          {/* Attente de la relecture du stockage local */}
          {!hydrated && (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl bg-card p-6 boty-shadow">
                  <div className="mb-4 h-5 w-40 rounded-full bg-muted" />
                  <div className="h-16 rounded-2xl bg-muted" />
                </div>
              ))}
            </div>
          )}

          {hydrated && orders.length === 0 && (
            <div className="mx-auto max-w-lg rounded-3xl bg-card px-8 py-16 text-center boty-shadow">
              <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-background">
                <Package className="h-7 w-7 text-primary" />
              </span>
              <h2 className="font-serif text-2xl text-foreground">Aucune commande pour l&apos;instant</h2>
              <p className="mt-3 text-muted-foreground">
                Vos commandes apparaîtront ici avec leur suivi, dès la première validation.
              </p>
              <Link
                href="/shop"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
              >
                Parcourir la boutique
              </Link>
            </div>
          )}

          {hydrated && orders.length > 0 && (
            <div className="space-y-5">
              {orders.map((order) => {
                const stepIndex = ORDER_STEPS.findIndex((s) => s.value === order.status)
                const pieces = order.lines.reduce((sum, l) => sum + l.quantity, 0)

                return (
                  <article key={order.ref} className="rounded-3xl bg-card p-6 boty-shadow sm:p-7">
                    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
                      <div>
                        <h2 className="font-serif text-xl text-foreground">{order.ref}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)} · {pieces} article{pieces > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <OrderStatusBadge status={order.status} />
                        <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
                      </div>
                    </header>

                    {/* Aperçu des articles */}
                    <div className="mb-5 flex flex-wrap gap-2">
                      {order.lines.slice(0, 5).map((line, index) => (
                        <span
                          key={`${line.productId}-${line.size}-${index}`}
                          className="relative h-16 w-16 overflow-hidden rounded-xl bg-muted"
                        >
                          <Image src={line.image || "/placeholder.svg"} alt={line.name} fill sizes="64px" className="object-cover" />
                          {line.quantity > 1 && (
                            <span className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-foreground text-[10px] font-semibold text-background">
                              {line.quantity}
                            </span>
                          )}
                        </span>
                      ))}
                      {order.lines.length > 5 && (
                        <span className="grid h-16 w-16 place-items-center rounded-xl bg-background text-sm text-muted-foreground">
                          +{order.lines.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Avancement compact */}
                    {order.status !== "annulee" && (
                      <div className="mb-5 flex items-center gap-1.5">
                        {ORDER_STEPS.map((step, index) => (
                          <span
                            key={step.value}
                            title={step.label}
                            className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-background"}`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4 shrink-0 text-primary" />
                        {order.delivery.city} · {order.delivery.zone === "dakar" ? "Dakar" : "Régions"}
                      </p>
                      <Link
                        href={`/commandes/${order.ref}`}
                        className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-2.5 text-sm text-foreground boty-transition hover:bg-foreground/5"
                      >
                        Voir le détail
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
