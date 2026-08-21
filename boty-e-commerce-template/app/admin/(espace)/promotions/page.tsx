"use client"

import { useMemo, useState } from "react"
import { Check, Edit3, Plus, Target, Trash2 } from "lucide-react"
import { useAdmin } from "@/lib/admin/store"
import {
  promotionEndDate,
  type AdminPromotion,
  type OrderRule,
  type PromotionTarget,
  type PromotionType,
} from "@/lib/admin/types"
import {
  ActionButton,
  EmptyState,
  OptionPills,
  PageHeader,
  SideDrawer,
  StackedField,
  StackedSelect,
  StackedTextarea,
  ToggleField,
} from "@/components/admin/ui"

/** Durées proposées, pour éviter de compter les jours à la main. */
const DUREES = [
  { value: 7, label: "1 semaine" },
  { value: 14, label: "2 semaines" },
  { value: 30, label: "1 mois" },
  { value: 90, label: "3 mois" },
]

const PORTEES: { value: PromotionTarget; label: string; hint: string }[] = [
  { value: "boutique", label: "Toute la boutique", hint: "Tous les articles" },
  { value: "categorie", label: "Une catégorie", hint: "Un rayon entier" },
  { value: "produit", label: "Un produit", hint: "Un seul article" },
  { value: "commande", label: "Sur la commande", hint: "Selon une condition" },
]

const REGLES: { value: OrderRule; label: string; hint: string }[] = [
  { value: "premiere-commande", label: "Première commande", hint: "Réservée aux nouvelles clientes" },
  { value: "montant-minimum", label: "À partir d'un montant", hint: "Panier au-dessus d'un seuil" },
]

/** Onglets de la liste. */
const FILTRES = [
  { value: "toutes", label: "Toutes" },
  { value: "en-cours", label: "En cours" },
  { value: "programmees", label: "Programmées" },
  { value: "terminees", label: "Terminées" },
] as const
type Filtre = (typeof FILTRES)[number]["value"]

type Statut = "En cours" | "Programmée" | "Terminée" | "Désactivée"

/** Où en est la campagne aujourd'hui. */
function statutDe(promotion: AdminPromotion, aujourdhui: string): Statut {
  if (!promotion.active) return "Désactivée"
  if (promotion.startsAt > aujourdhui) return "Programmée"
  if (promotionEndDate(promotion) < aujourdhui) return "Terminée"
  return "En cours"
}

/** Pastille de statut : un point coloré et un mot. */
const TEINTES: Record<Statut, string> = {
  "En cours": "bg-accent/15 text-[#4f6a49]",
  Programmée: "bg-[#e8b74a]/15 text-[#8a6a12]",
  Terminée: "bg-secondary text-muted-foreground",
  Désactivée: "bg-secondary text-muted-foreground",
}

const emptyPromotion = (): AdminPromotion => ({
  id: `promo-${Date.now().toString(36)}`,
  name: "",
  type: "pourcentage",
  value: 10,
  startsAt: new Date().toISOString().slice(0, 10),
  durationDays: 30,
  target: "boutique",
  categorySlug: "",
  productId: "",
  orderRule: "premiere-commande",
  minAmount: 25000,
  active: true,
  description: "",
})

const jour = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR")

export default function PromotionsPage() {
  const { promotions, categories, products, savePromotion, deletePromotion, settings } = useAdmin()
  const [draft, setDraft] = useState<AdminPromotion | null>(null)
  const [saved, setSaved] = useState(false)
  const [filtre, setFiltre] = useState<Filtre>("toutes")

  const now = new Date().toISOString().slice(0, 10)
  const sorted = useMemo(
    () => [...promotions].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [promotions],
  )

  /** Combien de campagnes derrière chaque onglet. */
  const compteurs = useMemo(() => {
    const base: Record<Filtre, number> = { toutes: promotions.length, "en-cours": 0, programmees: 0, terminees: 0 }
    for (const promotion of promotions) {
      const statut = statutDe(promotion, now)
      if (statut === "En cours") base["en-cours"] += 1
      else if (statut === "Programmée") base.programmees += 1
      else base.terminees += 1
    }
    return base
  }, [promotions, now])

  const visibles = sorted.filter((promotion) => {
    if (filtre === "toutes") return true
    const statut = statutDe(promotion, now)
    if (filtre === "en-cours") return statut === "En cours"
    if (filtre === "programmees") return statut === "Programmée"
    return statut === "Terminée" || statut === "Désactivée"
  })

  /** Ce sur quoi porte la remise, en une phrase. */
  const porteeLisible = (promotion: AdminPromotion) => {
    if (promotion.target === "boutique") return "Toute la boutique"
    if (promotion.target === "categorie")
      return categories.find((c) => c.slug === promotion.categorySlug)?.label ?? "Une catégorie"
    if (promotion.target === "produit")
      return products.find((p) => p.id === promotion.productId)?.name ?? "Un produit"
    return promotion.orderRule === "premiere-commande"
      ? "Première commande"
      : `Commande dès ${promotion.minAmount.toLocaleString("fr-FR")} ${settings.currency}`
  }

  const valide = (d: AdminPromotion) => {
    if (d.name.trim().length < 3 || d.value < 1 || d.durationDays < 1) return false
    if (d.target === "categorie" && !d.categorySlug) return false
    if (d.target === "produit" && !d.productId) return false
    if (d.target === "commande" && d.orderRule === "montant-minimum" && d.minAmount < 1) return false
    return true
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft || !valide(draft)) return
    savePromotion({ ...draft, name: draft.name.trim(), description: draft.description.trim() })
    setDraft(null)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Promotions"
        description={
          compteurs["en-cours"] > 0
            ? `${compteurs["en-cours"]} remise${compteurs["en-cours"] > 1 ? "s" : ""} active${
                compteurs["en-cours"] > 1 ? "s" : ""
              } en boutique en ce moment.`
            : "Aucune remise active en boutique en ce moment."
        }
      >
        <ActionButton variant="primary" onClick={() => setDraft(emptyPromotion())}>
          <Plus className="h-4 w-4" /> Nouvelle promotion
        </ActionButton>
      </PageHeader>

      {saved && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-accent/15 px-4 py-3 text-sm text-[#4f6a49]">
          <Check className="h-4 w-4" /> Promotion enregistrée.
        </p>
      )}

      {/* Onglets de la liste */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTRES.map((f) => {
          const actif = filtre === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltre(f.value)}
              aria-pressed={actif}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                actif
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                  actif ? "bg-background/20" : "bg-secondary"
                }`}
              >
                {compteurs[f.value]}
              </span>
            </button>
          )
        })}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title="Aucune campagne ici"
          description={
            filtre === "toutes"
              ? "Créez une première remise : un pourcentage, une durée, et le rayon concerné."
              : "Changez d'onglet pour retrouver vos autres campagnes."
          }
          action={
            <ActionButton variant="primary" onClick={() => setDraft(emptyPromotion())}>
              <Plus className="h-4 w-4" /> Nouvelle promotion
            </ActionButton>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibles.map((promotion) => {
            const fin = promotionEndDate(promotion)
            const statut = statutDe(promotion, now)
            const vive = statut === "En cours" || statut === "Programmée"

            // Avancement de la campagne, pour la barre sous les dates.
            const total = Math.max(1, promotion.durationDays)
            const ecoules = Math.round(
              (Date.now() - new Date(`${promotion.startsAt}T00:00:00`).getTime()) / 86_400_000,
            )
            const avance = Math.min(100, Math.max(0, (ecoules / total) * 100))
            const legende =
              statut === "En cours"
                ? `${Math.max(1, total - ecoules)} j restants`
                : statut === "Programmée"
                  ? `dans ${Math.max(1, -ecoules)} j`
                  : `${total} jours`

            return (
              <article
                key={promotion.id}
                className="group relative flex overflow-hidden rounded-[1.75rem] border border-border/70 bg-popover/80 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_22px_48px_-30px_var(--primary)]"
              >
                {/* Talon du ticket : la remise, en grand */}
                <div
                  className={`relative grid w-[86px] shrink-0 place-items-center px-2 text-center sm:w-[118px] sm:px-3 ${
                    !vive
                      ? "bg-secondary text-muted-foreground"
                      : promotion.type === "pourcentage"
                        ? "bg-gradient-to-br from-[#e0654e] to-[#c14a34] text-white"
                        : "bg-gradient-to-br from-[#8ca783] to-[#6d8a65] text-white"
                  }`}
                >
                  <div>
                    <p className="font-serif text-[22px] leading-none tracking-tight sm:text-[26px]">
                      {promotion.type === "pourcentage"
                        ? `−${promotion.value} %`
                        : `−${promotion.value.toLocaleString("fr-FR")}`}
                    </p>
                    <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] opacity-75">
                      {promotion.type === "pourcentage" ? "de remise" : settings.currency}
                    </p>
                  </div>
                  {/* Encoches et pointillé : le côté « bon de réduction » */}
                  <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-background" />
                  <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-background" />
                  <span className="absolute inset-y-4 right-0 border-r border-dashed border-current opacity-30" />
                </div>

                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg leading-tight">{promotion.name}</h2>
                      <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                        <Target className="h-3 w-3 shrink-0" />
                        <span className="truncate">{porteeLisible(promotion)}</span>
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${TEINTES[statut]}`}
                    >
                      {statut}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="tabular-nums">
                        {jour(promotion.startsAt)} → {jour(fin)}
                      </span>
                      <span className="tabular-nums">{legende}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-700 ${
                          vive ? "bg-primary" : "bg-muted-foreground/40"
                        }`}
                        style={{ width: `${avance}%` }}
                      />
                    </div>
                  </div>

                  {promotion.description && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {promotion.description}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-1.5">
                    <button
                      onClick={() => setDraft({ ...promotion })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary hover:text-primary"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => deletePromotion(promotion.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
                      aria-label={`Supprimer ${promotion.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <SideDrawer
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.name || "Nouvelle promotion"}
        subtitle="Remise, période et portée"
      >
        {draft && (
          <form onSubmit={submit} className="space-y-6">
            <StackedField
              label="Libellé"
              placeholder="Rentrée des classes"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              hint="Le nom que vous verrez dans cette liste."
            />

            {/* Remise */}
            <div className="space-y-4">
              <OptionPills<PromotionType>
                label="Type de réduction"
                value={draft.type}
                onChange={(type) => setDraft({ ...draft, type })}
                options={[
                  { value: "pourcentage", label: "Pourcentage" },
                  { value: "montant", label: "Montant fixe" },
                ]}
              />
              <StackedField
                label={draft.type === "pourcentage" ? "Réduction" : "Montant retiré"}
                type="number"
                min={1}
                max={draft.type === "pourcentage" ? 100 : undefined}
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
                suffix={draft.type === "pourcentage" ? "%" : settings.currency}
              />
            </div>

            {/* Période */}
            <div className="space-y-4">
              <StackedField
                label="Date d'effet"
                type="date"
                value={draft.startsAt}
                onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
              />
              <div>
                <OptionPills<string>
                  label="Durée de la promotion"
                  value={String(draft.durationDays)}
                  onChange={(v) => setDraft({ ...draft, durationDays: Number(v) })}
                  options={DUREES.map((d) => ({ value: String(d.value), label: d.label }))}
                />
                <div className="mt-2 flex items-end gap-3">
                  <StackedField
                    label="Ou nombre de jours"
                    type="number"
                    min={1}
                    className="flex-1"
                    value={draft.durationDays}
                    onChange={(e) => setDraft({ ...draft, durationDays: Math.max(1, Number(e.target.value)) })}
                  />
                  <p className="pb-3 text-xs text-muted-foreground">
                    Fin le {jour(promotionEndDate(draft))}
                  </p>
                </div>
              </div>
            </div>

            {/* Portée */}
            <div className="space-y-4">
              <OptionPills<PromotionTarget>
                label="La remise s'applique à"
                value={draft.target}
                onChange={(target) => setDraft({ ...draft, target })}
                options={PORTEES.map((p) => ({ value: p.value, label: p.label }))}
                hint={PORTEES.find((p) => p.value === draft.target)?.hint}
              />

              {draft.target === "categorie" && (
                <StackedSelect
                  label="Catégorie concernée"
                  value={draft.categorySlug}
                  onChange={(categorySlug) => setDraft({ ...draft, categorySlug })}
                  options={[
                    { value: "", label: "Choisir un rayon…" },
                    ...categories.filter((c) => c.active).map((c) => ({ value: c.slug, label: c.label })),
                  ]}
                />
              )}

              {draft.target === "produit" && (
                <div className="space-y-4">
                  <StackedSelect
                    label="Rayon"
                    value={draft.categorySlug}
                    onChange={(categorySlug) => setDraft({ ...draft, categorySlug, productId: "" })}
                    options={[
                      { value: "", label: "Choisir un rayon…" },
                      ...categories.filter((c) => c.active).map((c) => ({ value: c.slug, label: c.label })),
                    ]}
                    hint="On choisit d'abord le rayon, puis l'article dedans."
                  />
                  {draft.categorySlug && (
                    <StackedSelect
                      label="Produit"
                      value={draft.productId}
                      onChange={(productId) => setDraft({ ...draft, productId })}
                      options={[
                        { value: "", label: "Choisir un article…" },
                        ...products
                          .filter((p) => p.category === draft.categorySlug)
                          .map((p) => ({ value: p.id, label: p.name })),
                      ]}
                    />
                  )}
                </div>
              )}

              {draft.target === "commande" && (
                <div className="space-y-4">
                  <OptionPills<OrderRule>
                    label="Condition"
                    value={draft.orderRule}
                    onChange={(orderRule) => setDraft({ ...draft, orderRule })}
                    options={REGLES.map((r) => ({ value: r.value, label: r.label }))}
                    hint={REGLES.find((r) => r.value === draft.orderRule)?.hint}
                  />
                  {draft.orderRule === "montant-minimum" && (
                    <StackedField
                      label="Montant minimum du panier"
                      type="number"
                      min={1}
                      value={draft.minAmount}
                      onChange={(e) => setDraft({ ...draft, minAmount: Number(e.target.value) })}
                      suffix={settings.currency}
                    />
                  )}
                </div>
              )}
            </div>

            <StackedTextarea
              label="Note interne"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              hint="Visible ici uniquement, jamais en boutique."
            />

            <ToggleField
              label="Promotion active"
              description="Une campagne inactive reste enregistrée sans s'appliquer."
              checked={draft.active}
              onChange={(active) => setDraft({ ...draft, active })}
            />

            <ActionButton type="submit" variant="primary" className="w-full" disabled={!valide(draft)}>
              <Check className="h-4 w-4" /> Enregistrer la promotion
            </ActionButton>
          </form>
        )}
      </SideDrawer>
    </>
  )
}
