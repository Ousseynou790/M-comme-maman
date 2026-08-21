"use client"

import Link from "next/link"
import { ArrowRight, BadgePercent, Boxes, Package, Settings, SlidersHorizontal, Tags, Users } from "lucide-react"
import { formatPrice } from "@/lib/products"
import { computePeriod, useAdmin } from "@/lib/admin/store"
import { PageHeader } from "@/components/admin/ui"

/** Carte d'accès à une rubrique du back-office. */
function CarteRubrique({
  href,
  titre,
  chiffre,
  legende,
  description,
  icone: Icone,
}: {
  href: string
  titre: string
  chiffre: string
  legende: string
  description: string
  icone: typeof Package
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-popover/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_22px_48px_-26px_var(--primary)] sm:p-7"
    >
      {/* Voile corail qui monte du bas au survol */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0 bg-gradient-to-t from-primary/[0.10] to-transparent transition-all duration-500 group-hover:h-full" />

      <span className="relative flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-foreground transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icone className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </span>

      <span className="relative mt-5 block font-serif text-lg font-medium text-foreground">{titre}</span>

      <span className="relative mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{chiffre}</span>
        <span className="text-xs text-muted-foreground">{legende}</span>
      </span>

      <span className="relative mt-2 block text-xs leading-relaxed text-muted-foreground">{description}</span>
    </Link>
  )
}

export default function DashboardPage() {
  const { products, orders, customers, categories, promotions, settings, library } = useAdmin()

  const aPreparer = orders.filter((o) => o.status === "en_attente" || o.status === "payee").length
  const stockFaible = products.filter((p) => p.status === "publie" && p.stock <= settings.lowStockThreshold).length
  const periode = computePeriod(orders, 30)
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const promosEnCours = promotions.filter((p) => p.active && p.startsAt <= aujourdhui).length

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        title="Tableau de bord"
        description={`${settings.storeName} — choisissez une rubrique.`}
      >
        <Link
          href="/admin/produits/nouveau"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-105"
        >
          Nouveau produit
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CarteRubrique
          href="/admin/produits"
          titre="Produits"
          chiffre={String(products.length)}
          legende="fiches au catalogue"
          description={
            stockFaible > 0
              ? `${stockFaible} produit${stockFaible > 1 ? "s" : ""} sous le seuil de stock`
              : "Stocks au vert"
          }
          icone={Package}
        />
        <CarteRubrique
          href="/admin/categories"
          titre="Catégories"
          chiffre={String(categories.filter((c) => c.active).length)}
          legende="rayons visibles"
          description="Visuels, descriptions et rayons liés"
          icone={Tags}
        />
        <CarteRubrique
          href="/admin/promotions"
          titre="Promotions"
          chiffre={String(promosEnCours)}
          legende={promosEnCours > 1 ? "campagnes en cours" : "campagne en cours"}
          description={`${promotions.length} campagne${promotions.length > 1 ? "s" : ""} enregistrée${promotions.length > 1 ? "s" : ""}`}
          icone={BadgePercent}
        />
        <CarteRubrique
          href="/admin/commandes"
          titre="Commandes"
          chiffre={String(aPreparer)}
          legende="à préparer"
          description={`${orders.length} commandes depuis l'ouverture`}
          icone={Boxes}
        />
        <CarteRubrique
          href="/admin/clients"
          titre="Clientes"
          chiffre={String(customers.length)}
          legende="inscrites"
          description={`${periode.customers} actives sur les 30 derniers jours`}
          icone={Users}
        />
        <CarteRubrique
          href="/admin/configuration"
          titre="Configuration"
          chiffre={String(library.sizes.length + library.colors.length)}
          legende="tailles et coloris"
          description={`${library.media.length} photos en photothèque`}
          icone={SlidersHorizontal}
        />
        <CarteRubrique
          href="/admin/reglages"
          titre="Réglages"
          chiffre={settings.currency}
          legende="devise"
          description={`Livraison offerte dès ${formatPrice(settings.freeShippingThreshold)}`}
          icone={Settings}
        />
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Données de démonstration générées localement — les modifications restent dans ce navigateur.
      </p>
    </>
  )
}
