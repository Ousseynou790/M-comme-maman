"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, CreditCard, Lock, Mail, MapPin, Phone, ShoppingBag, Truck, User, UserRound } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useCart } from "@/components/boty/cart-context"
import { useOrders } from "@/components/boty/orders-context"
import { useAuth } from "@/components/boty/auth-context"
import {
  ChoiceCard,
  FormField,
  SectionCard,
  SubmitButton,
  TextareaField,
} from "@/components/boty/form-kit"
import { formatPrice } from "@/lib/products"
import {
  amountToFreeShipping,
  DELIVERY_ZONES,
  PAYMENT_METHODS,
  shippingCost,
  type DeliveryZone,
  type PaymentMethodId,
} from "@/lib/shipping"

/* ------------------------------------------------------------------ */

export default function CommandePage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { placeOrder } = useOrders()
  const { account } = useAuth()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [zone, setZone] = useState<DeliveryZone>("dakar")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [payment, setPayment] = useState<PaymentMethodId>("wave")
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  // Cliente connectée : ses informations remplissent le formulaire, sans écraser une saisie en cours.
  useEffect(() => {
    if (!account) return
    setName((v) => v || account.name)
    setPhone((v) => v || account.phone)
    setEmail((v) => v || account.email)

    const preferred = account.addresses.find((a) => a.isDefault)
    if (preferred) {
      setZone(preferred.zone)
      setCity((v) => v || preferred.city)
      setAddress((v) => v || preferred.address)
      setNotes((v) => v || preferred.notes)
    } else {
      setCity((v) => v || account.city)
    }
  }, [account])

  const shipping = shippingCost(zone, subtotal)
  const total = subtotal + shipping
  const missingForFree = amountToFreeShipping(subtotal)

  const errors = useMemo(() => {
    const list: Record<string, string> = {}
    if (name.trim().length < 3) list.name = "Indiquez le nom qui figurera sur le colis."
    if (!/^[0-9+\s().-]{9,}$/.test(phone.trim())) list.phone = "Un numéro joignable, par exemple 77 123 45 67."
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) list.email = "Cette adresse ne semble pas valide."
    if (city.trim().length < 2) list.city = zone === "dakar" ? "Quartier ou commune." : "Ville de livraison."
    if (address.trim().length < 5) list.address = "Un repère aide beaucoup le livreur."
    return list
  }, [name, phone, email, city, address, zone])

  // Comme sur les pages compte : le message n'apparaît qu'une fois le champ quitté.
  const markTouched = (field: string) => setTouched((s) => new Set(s).add(field))
  const showError = (key: string) => (submitted || touched.has(key) ? errors[key] : undefined)
  const showValid = (key: string) => (submitted || touched.has(key)) && !errors[key]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSending(true)
    const order = placeOrder({
      lines: items.map((item) => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      shipping,
      total,
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      delivery: { zone, city: city.trim(), address: address.trim(), notes: notes.trim() },
      payment,
    })

    clearCart()
    router.push(`/commandes/${order.ref}?nouvelle=1`)
  }

  /* Panier vide : rien à valider. */
  if (items.length === 0 && !sending) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-card">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </span>
          <h1 className="font-serif text-3xl text-foreground">Votre panier est vide</h1>
          <p className="mt-3 text-muted-foreground">
            Ajoutez un article pour passer commande. Vos favoris vous attendent peut-être déjà.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
            >
              Parcourir la boutique
            </Link>
            <Link
              href="/favoris"
              className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 py-3.5 text-sm text-foreground boty-transition hover:bg-foreground/5"
            >
              Mes favoris
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-14 pt-8 lg:pt-10">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Link
            href="/shop"
            className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground boty-transition hover:text-foreground sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Continuer mes achats
          </Link>

          <div className="mb-7">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-primary">Dernière étape</span>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">Valider ma commande</h1>
          </div>

          {/* La piste doit pouvoir descendre sous la largeur de son contenu, sinon
                 un nom d'article long élargit la grille et la page défile latéralement. */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 [grid-template-columns:minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
          >
            <div className="min-w-0 space-y-5">
              <SectionCard step={1} title="Vos coordonnées">
                {!account && (
                  <p className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
                    <UserRound className="h-4 w-4 shrink-0 text-primary" />
                    Déjà cliente ?
                    <Link
                      href="/compte/connexion?suite=/commande"
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      Connectez-vous
                    </Link>
                    pour remplir ces champs automatiquement.
                  </p>
                )}
                <div className="space-y-4">
                  <div data-error={Boolean(showError("name"))}>
                    <FormField
                      label="Nom et prénom"
                      icon={User}
                      placeholder="Aïssatou Diop"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => markTouched("name")}
                      error={showError("name")}
                      valid={showValid("name")}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div data-error={Boolean(showError("phone"))}>
                      <FormField
                        label="Téléphone"
                        icon={Phone}
                        placeholder="77 123 45 67"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => markTouched("phone")}
                      error={showError("phone")}
                      valid={showValid("phone")}
                        hint="Nous vous appelons pour confirmer la livraison."
                      />
                    </div>
                    <FormField
                      label="E-mail"
                      icon={Mail}
                      type="email"
                      optional
                      placeholder="aissatou@example.sn"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                      error={showError("email")}
                      valid={showValid("email")}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard step={2} title="Livraison">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DELIVERY_ZONES.map((option) => (
                      <ChoiceCard
                        key={option.value}
                        active={zone === option.value}
                        title={option.label}
                        hint={option.hint}
                        aside={subtotal >= 25_000 ? "Offerte" : formatPrice(option.cost)}
                        onClick={() => setZone(option.value)}
                      />
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div data-error={Boolean(showError("city"))}>
                      <FormField
                        label={zone === "dakar" ? "Quartier ou commune" : "Ville"}
                        icon={MapPin}
                        placeholder={zone === "dakar" ? "Sacré-Cœur 3" : "Thiès"}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onBlur={() => markTouched("city")}
                      error={showError("city")}
                      valid={showValid("city")}
                      />
                    </div>
                    <div data-error={Boolean(showError("address"))}>
                      <FormField
                        label="Adresse ou point de repère"
                        icon={MapPin}
                        placeholder="Villa 42, en face de la pharmacie"
                        autoComplete="street-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={() => markTouched("address")}
                      error={showError("address")}
                      valid={showValid("address")}
                      />
                    </div>
                  </div>

                  <TextareaField
                    label="Instructions pour le livreur"
                    optional
                    rows={3}
                    placeholder="Appeler avant d'arriver, portail bleu…"
                    value={notes}
                    onChange={setNotes}
                  />

                  {missingForFree > 0 && (
                    <p className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3 text-xs text-muted-foreground">
                      <Truck className="h-4 w-4 shrink-0 text-primary" />
                      Plus que {formatPrice(missingForFree)} pour la livraison offerte.
                    </p>
                  )}
                </div>
              </SectionCard>

              <SectionCard step={3} title="Paiement">
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => (
                    <ChoiceCard
                      key={method.value}
                      active={payment === method.value}
                      title={method.label}
                      hint={method.hint}
                      icon={CreditCard}
                      onClick={() => setPayment(method.value)}
                    />
                  ))}
                </div>
                <p className="mt-5 flex gap-2 rounded-2xl bg-background px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Maquette : aucun paiement n&apos;est encaissé et aucune donnée n&apos;est envoyée. La commande est
                  enregistrée dans ce navigateur pour la démonstration.
                </p>
              </SectionCard>
            </div>

            {/* Récapitulatif */}
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-32">
              <div className="rounded-[1.4rem] bg-card p-5 boty-shadow">
                <h2 className="mb-4 font-serif text-lg text-foreground">Votre panier</h2>

                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={`${item.id}-${item.size}`} className="flex gap-3">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image src={item.image || "/placeholder.svg"} alt="" fill sizes="64px" className="object-cover" />
                        <span className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-foreground text-[10px] font-semibold text-background">
                          {item.quantity}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">Taille {item.size}</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-5 space-y-2 border-t border-border/60 pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Sous-total</dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Livraison</dt>
                    <dd>{shipping === 0 ? "Offerte" : formatPrice(shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3 text-base font-medium text-foreground">
                    <dt>Total</dt>
                    <dd>{formatPrice(total)}</dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <SubmitButton pending={sending} pendingLabel="Enregistrement…" icon={Check}>
                    Confirmer la commande
                  </SubmitButton>
                </div>

                {submitted && Object.keys(errors).length > 0 && (
                  <p className="mt-3 text-center text-xs text-destructive">
                    Quelques informations manquent au-dessus.
                  </p>
                )}
              </div>

              <p className="px-2 text-center text-xs text-muted-foreground">
                Retour gratuit sous 14 jours si l&apos;article n&apos;a pas été porté.
              </p>
            </aside>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
