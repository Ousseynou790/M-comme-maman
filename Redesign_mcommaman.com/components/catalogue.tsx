"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "./product-card";
import { QuickView } from "./quick-view";
import { PRODUCTS, CATEGORIES, type Product } from "@/lib/products";
import { chercherProduits } from "@/lib/search";

const SORTS = ["Nouveautés", "Prix croissant", "Prix décroissant", "A → Z"] as const;

const AGE_FACETS = [
  { key: "0-1", label: "0 à 1 an" },
  { key: "2-10", label: "2 à 10 ans" },
  { key: "10-15", label: "10 à 15 ans" },
];

const GENDER_FACETS = [
  { key: "fille", label: "Fille" },
  { key: "garcon", label: "Garçon" },
];

export function Catalogue() {
  const params = useSearchParams();

  const initial = useMemo(() => {
    const f: string[] = [];
    if (params.get("cat")) f.push("cat:" + params.get("cat"));
    if (params.get("age")) f.push("age:" + params.get("age"));
    if (params.get("g")) f.push("g:" + params.get("g"));
    return f;
  }, [params]);

  const [filters, setFilters] = useState<string[]>(initial);
  const [sort, setSort] = useState(0);
  const [quick, setQuick] = useState<Product | null>(null);

  /* La recherche du bandeau arrive par « ?q= ». On la recopie en état pour
     pouvoir la retirer d'un clic, comme un filtre. */
  const [recherche, setRecherche] = useState("");

  /* On peut arriver ici depuis le menu alors qu'on y est déjà : l'URL change
     sans que le composant soit remonté, il faut resynchroniser à la main. */
  useEffect(() => setFilters(initial), [initial]);
  useEffect(() => setRecherche(params.get("q")?.trim() ?? ""), [params]);

  const toggle = (key: string) =>
    setFilters((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]));

  const matches = (p: Product, f: string) => {
    const [kind, value] = f.split(":");
    if (kind === "age") return p.age === value;
    if (kind === "g") return p.gender === value || p.gender === "mixte";
    return p.category === value;
  };

  /* Cherchée, la liste arrive déjà classée par pertinence ; les facettes ne
     font ensuite que retrancher, elles ne rebattent pas l'ordre. */
  const base = useMemo(
    () => (recherche ? chercherProduits(recherche, 100).map((r) => r.product) : PRODUCTS),
    [recherche]
  );

  const list = useMemo(() => {
    const out = base.filter((p) => filters.every((f) => matches(p, f)));
    if (sort === 1) return [...out].sort((a, b) => a.price - b.price);
    if (sort === 2) return [...out].sort((a, b) => b.price - a.price);
    if (sort === 3) return [...out].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return out;
  }, [base, filters, sort]);

  const chipLabel = (f: string) => {
    const [kind, value] = f.split(":");
    if (kind === "age") return value + " ans";
    if (kind === "g") return value === "fille" ? "Fille" : "Garçon";
    return value;
  };

  const countFor = (f: string) => base.filter((p) => matches(p, f)).length;

  const facet = (title: string, entries: { key: string; label: string }[]) => (
    <div className="mb-6.5" key={title}>
      <div className="border-b border-line pb-3 text-[12.5px] font-extrabold uppercase tracking-[.06em]">
        {title}
      </div>
      <div className="flex flex-col pt-2">
        {entries.map((e) => {
          const on = filters.includes(e.key);
          return (
            <button
              key={e.key}
              onClick={() => toggle(e.key)}
              className={`flex items-center gap-3 py-2 text-left text-sm ${on ? "font-bold" : "font-medium text-[#4a3a41]"}`}
            >
              <span
                className={`h-4.5 w-4.5 shrink-0 rounded-md border-[1.5px] transition-colors ${
                  on ? "border-rose bg-rose" : "border-[#dfd3d8] bg-white"
                }`}
              />
              <span className="flex-1">{e.label}</span>
              <span className="text-xs text-[#9c8d93]">{countFor(e.key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-10 pt-8">
      <div className="text-[12.5px] text-muted">Accueil · Catalogue</div>

      <div className="mt-3.5 flex items-end justify-between">
        <div>
          <h1 className="text-5xl font-extrabold tracking-[-.035em]">
            {recherche ? `« ${recherche} »` : "Catalogue"}
          </h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {recherche || filters.length
              ? `${list.length} pièce${list.length > 1 ? "s" : ""} ${
                  recherche ? "pour cette recherche" : "correspondent à votre sélection"
                }.`
              : `${PRODUCTS.length} pièces, toutes photographiées et décrites. Tout tient sur une seule page.`}
          </p>
        </div>
        <button
          onClick={() => setSort((s) => (s + 1) % SORTS.length)}
          className="flex items-center gap-2.5 rounded-full border-[1.5px] border-[#e5d9de] bg-white px-4.5 py-3 text-[13.5px] font-semibold"
        >
          Trier : {SORTS[sort]} <span className="text-rose">↓</span>
        </button>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-11 pb-20 pt-7">
        <aside>
          {facet("Catégorie", CATEGORIES.map((c) => ({ key: "cat:" + c, label: c })))}
          {facet("Âge", AGE_FACETS.map((a) => ({ key: "age:" + a.key, label: a.label })))}
          {facet("Genre", GENDER_FACETS.map((g) => ({ key: "g:" + g.key, label: g.label })))}

          <div>
            <div className="border-b border-line pb-3 text-[12.5px] font-extrabold uppercase tracking-[.06em]">
              Prix
            </div>
            <div className="pt-6">
              <div className="relative h-1 rounded-full bg-line">
                <div className="absolute inset-y-0 left-0 right-[22%] rounded-full bg-rose" />
                <div className="absolute -top-1.5 left-0 h-4 w-4 rounded-full border-2 border-rose bg-white shadow" />
                <div className="absolute -top-1.5 left-[calc(78%-8px)] h-4 w-4 rounded-full border-2 border-rose bg-white shadow" />
              </div>
              <div className="mt-4 flex justify-between text-[13px] tabular-nums text-muted">
                <span>3 000 F</span>
                <span>14 000 F</span>
              </div>
            </div>
          </div>
        </aside>

        <div>
          {(filters.length > 0 || recherche) && (
            <div className="flex flex-wrap items-center gap-2 pb-5">
              {recherche && (
                <button
                  onClick={() => setRecherche("")}
                  className="flex items-center gap-2.5 rounded-full bg-rose px-3.5 py-2 text-[12.5px] font-semibold text-white"
                >
                  Recherche : {recherche} <span className="opacity-55">×</span>
                </button>
              )}
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => toggle(f)}
                  className="flex items-center gap-2.5 rounded-full bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-white"
                >
                  {chipLabel(f)} <span className="opacity-55">×</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setFilters([]);
                  setRecherche("");
                }}
                className="pl-1.5 text-[13px] font-semibold text-muted"
              >
                Tout effacer
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5.5">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} delay={i * 45} />
            ))}
          </div>

          {list.length === 0 && (
            <p className="py-16 text-center text-[14.5px] text-muted">
              Aucune pièce ne répond à cette combinaison. Retirez une pastille pour élargir.
            </p>
          )}

          <p className="pt-11 text-center text-[13.5px] text-muted">
            {recherche || filters.length
              ? `Fin des résultats. Retirez une pastille pour revoir les ${PRODUCTS.length} pièces.`
              : `Vous avez vu les ${PRODUCTS.length} pièces. Pas de page 2 pour un catalogue de cette taille.`}
          </p>
        </div>
      </div>

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </div>
  );
}
