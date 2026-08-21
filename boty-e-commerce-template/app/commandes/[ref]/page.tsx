"use client"

import { Suspense, use, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, ChevronLeft, MapPin, Package, Phone, RotateCcw } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useCart } from "@/components/boty/cart-context"
import { useOrders, type ShopOrder } from "@/components/boty/orders-context"
import { OrderStatusBadge } from "@/components/boty/order-status-badge"
import { OrderJourney } from "@/components/boty/order-journey"
import { formatPrice } from "@/lib/products"
import { PAYMENT_METHODS } from "@/lib/shipping"

const DEMO_ORDER: ShopOrder = {
  ref: "MCM-DEMO-2026",
  createdAt: "2026-08-18T10:30:00.000Z",
  status: "expediee",
  lines: [
    {
      productId: "robe-chasuble-rose-plumetis",
      name: "Robe chasuble rose à volant plumetis",
      image: "/images/mcm/real/Ensemble_enfant-4-retouche.png",
      size: "6-9 mois",
      price: 12000,
      quantity: 1,
    },
    {
      productId: "ensemble-chemise-bermuda-safari",
      name: "Ensemble chemise et bermuda safari",
      image: "/images/mcm/real/Ensemble_enfant-30-retouche.png",
      size: "5 ans",
      price: 9000,
      quantity: 1,
    },
  ],
  subtotal: 21000,
  shipping: 2000,
  total: 23000,
  customer: {
    name: "Aminata Ndiaye",
    phone: "77 000 00 00",
    email: "aminata@example.sn",
  },
  delivery: {
    zone: "dakar",
    city: "Sacré-Cœur, Dakar",
    address: "Adresse de démonstration",
    notes: "Appeler avant le passage du livreur.",
  },
  payment: "wave",
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function CommandeDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params)
  return (
    <Suspense fallback={null}>
      <CommandeDetailContent orderRef={decodeURIComponent(ref)} />
    </Suspense>
  )
}

function CommandeDetailContent({ orderRef }: { orderRef: string }) {
  const searchParams = useSearchParams()
  const justPlaced = searchParams.get("nouvelle") === "1"
  const { getOrder, cancelOrder, hydrated } = useOrders()
  const { addItem } = useCart()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reordered, setReordered] = useState(false)

  const order = orderRef === DEMO_ORDER.ref ? DEMO_ORDER : getOrder(orderRef)

  if (!hydrated) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-full bg-card" />
            <div className="h-40 rounded-3xl bg-card" />
            <div className="h-64 rounded-3xl bg-card" />
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-card">
            <Package className="h-7 w-7 text-primary" />
          </span>
          <h1 className="font-serif text-3xl text-foreground">Commande introuvable</h1>
          <p className="mt-3 text-muted-foreground">
            Aucune commande ne porte la référence <span className="font-medium text-foreground">{orderRef}</span> dans
            ce navigateur.
          </p>
          <Link
            href="/commandes"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
          >
            Voir mes commandes
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const payment = PAYMENT_METHODS.find((p) => p.value === order.payment)
  const pieces = order.lines.reduce((sum, l) => sum + l.quantity, 0)

  const reorder = () => {
    for (const line of order.lines) {
      addItem(
        { id: line.productId, name: line.name, price: line.price, image: line.image, size: line.size },
        line.quantity,
      )
    }
    setReordered(true)
    window.setTimeout(() => setReordered(false), 2200)
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link
            href="/commandes"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground boty-transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Mes commandes
          </Link>

          {/* Confirmation, juste après la validation */}
          {justPlaced && (
            <div className="mb-8 flex gap-4 rounded-3xl bg-accent/12 p-6 animate-scale-fade-in sm:p-7">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl text-foreground">Merci {order.customer.name.split(" ")[0]} !</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
                  Votre commande est enregistrée sous la référence{" "}
                  <span className="font-medium">{order.ref}</span>. Nous vous contactons au{" "}
                  {order.customer.phone} pour confirmer la livraison
                  {order.payment === "livraison" ? " et le règlement à la remise du colis" : ""}.
                </p>
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                Commande {order.ref}
              </p>
              <h1 className="text-balance font-serif text-4xl text-foreground sm:text-5xl">Son petit voyage jusqu&apos;à vous</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Passée le {formatDateTime(order.createdAt)} · {pieces} article{pieces > 1 ? "s" : ""}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderJourney
            status={order.status}
            createdAt={order.createdAt}
            city={order.delivery.city}
            zone={order.delivery.zone}
          />

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0 space-y-6">
              {/* Articles */}
              <section className="rounded-3xl bg-card p-6 boty-shadow sm:p-7">
                <h2 className="mb-6 font-serif text-xl text-foreground">Articles</h2>
                <ul className="space-y-4">
                  {order.lines.map((line, index) => (
                    <li key={`${line.productId}-${line.size}-${index}`} className="flex items-center gap-4">
                      <Link
                        href={`/product/${line.productId}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                      >
                        <Image src={line.image || "/placeholder.svg"} alt={line.name} fill sizes="80px" className="object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${line.productId}`}
                          className="block truncate font-medium text-foreground boty-transition hover:text-primary"
                        >
                          {line.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Taille {line.size} · ×{line.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium text-foreground">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-6 space-y-2 border-t border-border/60 pt-5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Sous-total</dt>
                    <dd>{formatPrice(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Livraison</dt>
                    <dd>{order.shipping === 0 ? "Offerte" : formatPrice(order.shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3 text-base font-medium text-foreground">
                    <dt>Total</dt>
                    <dd>{formatPrice(order.total)}</dd>
                  </div>
                </dl>
              </section>
            </div>

            {/* Colonne latérale */}
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-32">
              <section className="rounded-3xl bg-card p-6 boty-shadow">
                <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Livraison
                </h2>
                <p className="font-medium text-foreground">{order.customer.name}</p>
                <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {order.delivery.address}
                    <br />
                    {order.delivery.city} · {order.delivery.zone === "dakar" ? "Dakar et banlieue" : "Régions"}
                  </span>
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {order.customer.phone}
                </p>
                {order.customer.email && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">{order.customer.email}</p>
                )}
                {order.delivery.notes && (
                  <p className="mt-3 rounded-2xl bg-background px-4 py-3 text-xs italic text-muted-foreground">
                    « {order.delivery.notes} »
                  </p>
                )}
              </section>

              <section className="rounded-3xl bg-card p-6 boty-shadow">
                <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Paiement
                </h2>
                <p className="text-sm font-medium text-foreground">{payment?.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{payment?.hint}</p>
              </section>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={reorder}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm boty-transition ${
                    reordered
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {reordered ? (
                    <>
                      <Check className="h-4 w-4" /> Articles remis au panier
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" /> Commander à nouveau
                    </>
                  )}
                </button>

                {order.status === "recue" && (
                  confirmCancel ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          cancelOrder(order.ref)
                          setConfirmCancel(false)
                        }}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-destructive/30 px-4 py-3 text-sm text-destructive boty-transition hover:bg-destructive/10"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm text-muted-foreground boty-transition hover:text-foreground"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex w-full items-center justify-center rounded-full border border-foreground/15 px-6 py-3.5 text-sm text-muted-foreground boty-transition hover:text-foreground"
                    >
                      Annuler la commande
                    </button>
                  )
                )}
              </div>

              <p className="px-2 text-center text-xs text-muted-foreground">
                Une question ? Appelez-nous au +221 77 000 00 00.
              </p>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
