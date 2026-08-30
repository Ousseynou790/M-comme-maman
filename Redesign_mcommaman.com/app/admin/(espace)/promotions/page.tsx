"use client";

import { useMemo, useState } from "react";
import { formatXOF } from "@/lib/format";
import { REFERENCE_DATE, useAdmin } from "@/lib/admin/store";
import {
  promotionEndDate,
  type AdminPromotion,
  type OrderRule,
  type PromotionTarget,
  type PromotionType,
} from "@/lib/admin/types";
import {
  Button,
  EmptyState,
  Field,
  Input,
  OptionPills,
  PageHeader,
  Pagination,
  Pills,
  SideDrawer,
  Textarea,
  Toggle,
  usePagination,
} from "@/components/admin/ui";
import { IconCheck, IconPencil, IconPlus, IconTrash } from "@/components/admin/icons";

/** Durées proposées, pour éviter de compter les jours à la main. */
const DUREES = [
  { value: 7, label: "1 semaine" },
  { value: 14, label: "2 semaines" },
  { value: 30, label: "1 mois" },
  { value: 90, label: "3 mois" },
];

const PORTEES: { value: PromotionTarget; label: string; hint: string }[] = [
  { value: "boutique", label: "Toute la boutique", hint: "Tous les articles du catalogue." },
  { value: "categorie", label: "Un rayon", hint: "Un rayon entier." },
  { value: "produit", label: "Un article", hint: "Un seul article." },
  { value: "commande", label: "Sur la commande", hint: "Selon une condition de panier." },
];

const REGLES: { value: OrderRule; label: string; hint: string }[] = [
  {
    value: "premiere-commande",
    label: "Première commande",
    hint: "Réservée aux nouvelles clientes.",
  },
  {
    value: "montant-minimum",
    label: "À partir d'un montant",
    hint: "Panier au-dessus d'un seuil.",
  },
];

const FILTRES = [
  { value: "toutes", label: "Toutes" },
  { value: "en-cours", label: "En cours" },
  { value: "programmees", label: "Programmées" },
  { value: "terminees", label: "Terminées" },
] as const;
type Filtre = (typeof FILTRES)[number]["value"];

type Statut = "En cours" | "Programmée" | "Terminée" | "Désactivée";

/** Où en est la campagne aujourd'hui. */
function statutDe(promotion: AdminPromotion, aujourdhui: string): Statut {
  if (!promotion.active) return "Désactivée";
  if (promotion.startsAt > aujourdhui) return "Programmée";
  if (promotionEndDate(promotion) < aujourdhui) return "Terminée";
  return "En cours";
}

const TEINTES: Record<Statut, { bg: string; fg: string }> = {
  "En cours": { bg: "#eaf6ef", fg: "#2e7d52" },
  Programmée: { bg: "#eef3fd", fg: "#33538f" },
  Terminée: { bg: "#f4f1f2", fg: "#5d5157" },
  Désactivée: { bg: "#f4f1f2", fg: "#5d5157" },
};

const vide = (): AdminPromotion => ({
  id: `promo-${Date.now().toString(36)}`,
  name: "",
  type: "pourcentage",
  value: 10,
  startsAt: REFERENCE_DATE.toISOString().slice(0, 10),
  durationDays: 30,
  target: "boutique",
  categorySlug: "",
  productId: "",
  orderRule: "premiere-commande",
  minAmount: 25000,
  active: true,
  description: "",
});

const jour = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR");

export default function Page() {
  const { promotions, categories, products, savePromotion, deletePromotion, hydrated } = useAdmin();
  const [brouillon, setBrouillon] = useState<AdminPromotion | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [filtre, setFiltre] = useState<Filtre>("toutes");

  /* Même date de référence que le tableau de bord : la graine est figée au
     15 août 2026, une campagne « en cours » doit l'être par rapport à elle. */
  const aujourdhui = REFERENCE_DATE.toISOString().slice(0, 10);

  const triees = useMemo(
    () => [...promotions].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [promotions]
  );

  const compteurs = useMemo(() => {
    const base: Record<Filtre, number> = {
      toutes: promotions.length,
      "en-cours": 0,
      programmees: 0,
      terminees: 0,
    };
    for (const p of promotions) {
      const s = statutDe(p, aujourdhui);
      if (s === "En cours") base["en-cours"] += 1;
      else if (s === "Programmée") base.programmees += 1;
      else base.terminees += 1;
    }
    return base;
  }, [promotions, aujourdhui]);

  const visibles = triees.filter((p) => {
    if (filtre === "toutes") return true;
    const s = statutDe(p, aujourdhui);
    if (filtre === "en-cours") return s === "En cours";
    if (filtre === "programmees") return s === "Programmée";
    return s === "Terminée" || s === "Désactivée";
  });

  /* Les campagnes s'accumulent au fil des saisons : on en montre six par page. */
  const {
    page,
    pages,
    setPage,
    tranche,
    debut,
    total: totalPage,
  } = usePagination(visibles, 6, (p) => p.id);

  /** Ce sur quoi porte la remise, en une phrase. */
  const porteeLisible = (p: AdminPromotion) => {
    if (p.target === "boutique") return "Toute la boutique";
    if (p.target === "categorie")
      return categories.find((c) => c.slug === p.categorySlug)?.label ?? "Un rayon";
    if (p.target === "produit")
      return products.find((a) => a.id === p.productId)?.name ?? "Un article";
    return p.orderRule === "premiere-commande"
      ? "Première commande"
      : `Commande dès ${formatXOF(p.minAmount)}`;
  };

  const valide = (d: AdminPromotion) => {
    if (d.name.trim().length < 3 || d.value < 1 || d.durationDays < 1) return false;
    if (d.type === "pourcentage" && d.value > 100) return false;
    if (d.target === "categorie" && !d.categorySlug) return false;
    if (d.target === "produit" && !d.productId) return false;
    if (d.target === "commande" && d.orderRule === "montant-minimum" && d.minAmount < 1) return false;
    return true;
  };

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brouillon || !valide(brouillon)) return;
    savePromotion({
      ...brouillon,
      name: brouillon.name.trim(),
      description: brouillon.description.trim(),
    });
    setBrouillon(null);
    setEnregistre(true);
    window.setTimeout(() => setEnregistre(false), 2200);
  };

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture des campagnes…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Promotions"
        sub={
          compteurs["en-cours"] > 0
            ? `${compteurs["en-cours"]} remise${compteurs["en-cours"] > 1 ? "s" : ""} active${
                compteurs["en-cours"] > 1 ? "s" : ""
              } en boutique en ce moment.`
            : "Aucune remise active en boutique en ce moment."
        }
      >
        <Button variant="rose" onClick={() => setBrouillon(vide())}>
          <IconPlus />
          Nouvelle promotion
        </Button>
      </PageHeader>

      {enregistre && (
        <p className="anim-fade-up mb-5 flex items-center gap-2 rounded-2xl bg-[#eaf6ef] px-4 py-3 text-[13px] font-semibold text-[#2e7d52]">
          <IconCheck className="h-4 w-4" />
          Promotion enregistrée.
        </p>
      )}

      <div className="mb-5">
        <Pills
          value={filtre}
          onChange={setFiltre}
          options={FILTRES.map((f) => ({ ...f, count: compteurs[f.value] }))}
        />
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title="Aucune campagne ici"
          hint={
            filtre === "toutes"
              ? "Créez une première remise : un pourcentage, une durée, et le rayon concerné."
              : "Changez d'onglet pour retrouver vos autres campagnes."
          }
          action={
            <Button variant="rose" onClick={() => setBrouillon(vide())}>
              <IconPlus />
              Nouvelle promotion
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tranche.map((p) => {
            const fin = promotionEndDate(p);
            const statut = statutDe(p, aujourdhui);
            const vive = statut === "En cours" || statut === "Programmée";

            /* Avancement de la campagne, pour la barre sous les dates. */
            const total = Math.max(1, p.durationDays);
            const ecoules = Math.round(
              (REFERENCE_DATE.getTime() - new Date(`${p.startsAt}T00:00:00`).getTime()) / 86_400_000
            );
            const avance = Math.min(100, Math.max(0, (ecoules / total) * 100));
            const legende =
              statut === "En cours"
                ? `${Math.max(1, total - ecoules)} j restants`
                : statut === "Programmée"
                  ? `dans ${Math.max(1, -ecoules)} j`
                  : `${total} jours`;

            return (
              <article
                key={p.id}
                className="group flex overflow-hidden rounded-[22px] border border-line bg-white transition-all duration-400 ease-soft hover:-translate-y-0.5 hover:border-rose/40"
              >
                {/* Le talon du bon de réduction : la remise, en grand. */}
                <div
                  className={`relative grid w-[86px] shrink-0 place-items-center px-2 text-center sm:w-[112px] ${
                    !vive
                      ? "bg-mist text-muted"
                      : p.type === "pourcentage"
                        ? "bg-linear-to-br from-rose to-rose-deep text-white"
                        : "bg-linear-to-br from-ink to-[#3d2f35] text-white"
                  }`}
                >
                  <div>
                    <p className="text-[22px] font-extrabold leading-none tracking-[-.03em] tabular-nums sm:text-[26px]">
                      {p.type === "pourcentage"
                        ? `−${p.value} %`
                        : `−${p.value.toLocaleString("fr-FR")}`}
                    </p>
                    <p className="mt-1.5 text-[9px] uppercase tracking-[.18em] opacity-75">
                      {p.type === "pourcentage" ? "de remise" : "F CFA"}
                    </p>
                  </div>
                  {/* Encoches et pointillé : ce qui fait lire « bon de réduction ». */}
                  <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#faf8f9]" />
                  <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[#faf8f9]" />
                  <span className="absolute inset-y-4 right-0 border-r border-dashed border-current opacity-30" />
                </div>

                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-extrabold tracking-tight">
                        {p.name || "Sans nom"}
                      </h2>
                      <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11px] text-muted">
                        <span className="truncate">{porteeLisible(p)}</span>
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                      style={{ background: TEINTES[statut].bg, color: TEINTES[statut].fg }}
                    >
                      {statut}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted">
                      <span className="tabular-nums">
                        {jour(p.startsAt)} → {jour(fin)}
                      </span>
                      <span className="tabular-nums">{legende}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-700 ease-soft ${
                          vive ? "bg-rose" : "bg-muted/40"
                        }`}
                        style={{ width: `${avance}%` }}
                      />
                    </div>
                  </div>

                  {p.description && (
                    <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-1.5">
                    <Button size="sm" variant="contour" onClick={() => setBrouillon({ ...p })}>
                      <IconPencil />
                      Modifier
                    </Button>
                    <button
                      type="button"
                      onClick={() => deletePromotion(p.id)}
                      aria-label={`Supprimer ${p.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-rose-soft hover:text-rose-deep"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        total={totalPage}
        debut={debut}
        affiches={tranche.length}
        onPage={setPage}
        unite="campagnes"
      />

      <SideDrawer
        open={Boolean(brouillon)}
        onClose={() => setBrouillon(null)}
        title={brouillon?.name || "Nouvelle promotion"}
        subtitle="Remise, période et portée"
      >
        {brouillon && (
          <form onSubmit={envoyer} className="flex flex-col gap-6">
            <Field label="Libellé" hint="Le nom que vous verrez dans cette liste.">
              <Input
                value={brouillon.name}
                onChange={(v) => setBrouillon({ ...brouillon, name: v })}
                placeholder="Rentrée des classes"
              />
            </Field>

            {/* ------------------------------------------------------ remise */}
            <div className="flex flex-col gap-4">
              <OptionPills<PromotionType>
                label="Type de réduction"
                value={brouillon.type}
                onChange={(type) => setBrouillon({ ...brouillon, type })}
                options={[
                  { value: "pourcentage", label: "Pourcentage" },
                  { value: "montant", label: "Montant fixe" },
                ]}
              />
              <Field
                label={brouillon.type === "pourcentage" ? "Réduction" : "Montant retiré"}
                hint={
                  brouillon.type === "pourcentage"
                    ? "Entre 1 et 100 %."
                    : "En francs CFA, retirés du total."
                }
              >
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={brouillon.type === "pourcentage" ? 100 : undefined}
                    value={String(brouillon.value)}
                    onChange={(v) =>
                      setBrouillon({ ...brouillon, value: Math.max(0, Number(v) || 0) })
                    }
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted">
                    {brouillon.type === "pourcentage" ? "%" : "F CFA"}
                  </span>
                </div>
              </Field>
            </div>

            {/* ----------------------------------------------------- période */}
            <div className="flex flex-col gap-4">
              <Field label="Date d'effet">
                <Input
                  type="date"
                  value={brouillon.startsAt}
                  onChange={(v) => setBrouillon({ ...brouillon, startsAt: v })}
                />
              </Field>

              <div>
                <OptionPills<string>
                  label="Durée de la promotion"
                  value={String(brouillon.durationDays)}
                  onChange={(v) => setBrouillon({ ...brouillon, durationDays: Number(v) })}
                  options={DUREES.map((d) => ({ value: String(d.value), label: d.label }))}
                />
                <div className="mt-2.5 flex items-end gap-3">
                  <Field label="Ou nombre de jours" className="flex-1">
                    <Input
                      type="number"
                      min={1}
                      value={String(brouillon.durationDays)}
                      onChange={(v) =>
                        setBrouillon({ ...brouillon, durationDays: Math.max(1, Number(v) || 1) })
                      }
                    />
                  </Field>
                  <p className="pb-3 text-[11.5px] text-muted">
                    Fin le {jour(promotionEndDate(brouillon))}
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------ portée */}
            <div className="flex flex-col gap-4">
              <OptionPills<PromotionTarget>
                label="La remise s'applique à"
                value={brouillon.target}
                onChange={(target) => setBrouillon({ ...brouillon, target })}
                options={PORTEES.map((p) => ({ value: p.value, label: p.label }))}
                hint={PORTEES.find((p) => p.value === brouillon.target)?.hint}
              />

              {brouillon.target === "categorie" && (
                <Field label="Rayon concerné">
                  <select
                    value={brouillon.categorySlug}
                    onChange={(e) => setBrouillon({ ...brouillon, categorySlug: e.target.value })}
                    className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#ece3e7] bg-white px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-rose"
                  >
                    <option value="">Choisir un rayon…</option>
                    {categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </Field>
              )}

              {brouillon.target === "produit" && (
                <div className="flex flex-col gap-4">
                  <Field label="Rayon" hint="On choisit d'abord le rayon, puis l'article dedans.">
                    <select
                      value={brouillon.categorySlug}
                      onChange={(e) =>
                        setBrouillon({ ...brouillon, categorySlug: e.target.value, productId: "" })
                      }
                      className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#ece3e7] bg-white px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-rose"
                    >
                      <option value="">Choisir un rayon…</option>
                      {categories
                        .filter((c) => c.active)
                        .map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.label}
                          </option>
                        ))}
                    </select>
                  </Field>

                  {brouillon.categorySlug && (
                    <Field label="Article">
                      <select
                        value={brouillon.productId}
                        onChange={(e) =>
                          setBrouillon({ ...brouillon, productId: e.target.value })
                        }
                        className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#ece3e7] bg-white px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-rose"
                      >
                        <option value="">Choisir un article…</option>
                        {products
                          .filter(
                            (a) =>
                              a.category === brouillon.categorySlug ||
                              categories.find((c) => c.slug === brouillon.categorySlug)?.label ===
                                a.category
                          )
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                  )}
                </div>
              )}

              {brouillon.target === "commande" && (
                <div className="flex flex-col gap-4">
                  <OptionPills<OrderRule>
                    label="Condition"
                    value={brouillon.orderRule}
                    onChange={(orderRule) => setBrouillon({ ...brouillon, orderRule })}
                    options={REGLES.map((r) => ({ value: r.value, label: r.label }))}
                    hint={REGLES.find((r) => r.value === brouillon.orderRule)?.hint}
                  />
                  {brouillon.orderRule === "montant-minimum" && (
                    <Field label="Montant minimum du panier">
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          value={String(brouillon.minAmount)}
                          onChange={(v) =>
                            setBrouillon({ ...brouillon, minAmount: Math.max(0, Number(v) || 0) })
                          }
                        />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted">
                          F CFA
                        </span>
                      </div>
                    </Field>
                  )}
                </div>
              )}
            </div>

            <Field label="Note interne" hint="Visible ici uniquement, jamais en boutique.">
              <Textarea
                rows={2}
                value={brouillon.description}
                onChange={(v) => setBrouillon({ ...brouillon, description: v })}
              />
            </Field>

            <Toggle
              checked={brouillon.active}
              onChange={(active) => setBrouillon({ ...brouillon, active })}
              label="Promotion active"
              hint="Une campagne inactive reste enregistrée sans s'appliquer."
            />

            <Button
              type="submit"
              variant="rose"
              className="w-full"
              disabled={!valide(brouillon)}
            >
              <IconCheck />
              Enregistrer la promotion
            </Button>
          </form>
        )}
      </SideDrawer>
    </>
  );
}
