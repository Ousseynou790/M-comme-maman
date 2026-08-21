"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInView, useReducedMotion } from "./reveal";
import { CATEGORIES, PRODUCTS } from "@/lib/products";

/** Qui porte cette catégorie — déduit du catalogue, jamais écrit à la main. */
function audience(items: { gender: string }[]) {
  const kinds = new Set(items.map((p) => p.gender));
  if (kinds.size === 1 && kinds.has("fille")) return "Les filles";
  if (kinds.size === 1 && kinds.has("garcon")) return "Les garçons";
  return "Filles & garçons";
}

const UNIVERS = CATEGORIES.map((c) => {
  const items = PRODUCTS.filter((p) => p.category === c);
  return { key: c, who: audience(items), items };
}).filter((u) => u.items.length > 0);

/* Géométrie de la pile. Une seule source pour la hauteur et l'écart. */
const STEP = 128;
const DECK_H = STEP * 3 + 30;

/**
 * Sélecteur d'univers en pile verticale : la carte active au centre, ses
 * voisines en retrait au-dessus et au-dessous, et les deux pièces de la
 * catégorie affichées en grand de part et d'autre.
 *
 * La pile tourne toute seule et s'arrête au survol, au focus clavier, hors
 * champ, ou si le mouvement réduit est demandé.
 */
export function Universes() {
  const [active, setActive] = useState(0);
  const [ref, seen] = useInView<HTMLDivElement>("0px 0px -20% 0px");
  const reduced = useReducedMotion();
  const holdRef = useRef(false);

  const go = (dir: 1 | -1) => setActive((i) => (i + dir + UNIVERS.length) % UNIVERS.length);

  useEffect(() => {
    if (!seen || reduced) return;
    const t = setInterval(() => {
      if (!holdRef.current && !document.hidden) go(1);
    }, 4200);
    return () => clearInterval(t);
  }, [seen, reduced]);

  const current = UNIVERS[active];
  const [left, right] = [current.items[0], current.items[1]];

  return (
    <div
      ref={ref}
      onPointerEnter={() => (holdRef.current = true)}
      onPointerLeave={() => (holdRef.current = false)}
      onFocusCapture={() => (holdRef.current = true)}
      onBlurCapture={() => (holdRef.current = false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); go(1); }
        if (e.key === "ArrowUp") { e.preventDefault(); go(-1); }
      }}
      className="relative overflow-hidden"
    >
      {/* Éventail de rayons très pâle, qui tourne trop lentement pour se voir.
          Le conteneur clippe : 900 px de large élargiraient sinon le document
          sur un téléphone. */}
      <div aria-hidden className="rays pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <Panel product={left} side="left" active={active} />

        {/* --------------------------------------------------------- la pile */}
        <div className="flex flex-col items-center">
          <Chevron dir={-1} onClick={() => go(-1)} />

          <div
            className="relative w-full max-w-[430px] lg:w-[430px]"
            style={{ height: DECK_H }}
            role="listbox"
            aria-label="Univers du catalogue"
            tabIndex={0}
          >
            {UNIVERS.map((u, i) => {
              /* Distance signée la plus courte : la pile boucle des deux côtés. */
              let d = i - active;
              const n = UNIVERS.length;
              if (d > n / 2) d -= n;
              if (d < -n / 2) d += n;
              const far = Math.abs(d) > 1;

              return (
                <Link
                  key={u.key}
                  href={`/boutique?cat=${encodeURIComponent(u.key)}`}
                  role="option"
                  aria-selected={d === 0}
                  tabIndex={d === 0 ? 0 : -1}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`absolute inset-x-0 top-1/2 flex items-center gap-4 rounded-[20px] bg-white p-3 transition-[transform,opacity,box-shadow] duration-600 ease-soft ${
                    d === 0
                      ? "z-30 shadow-[0_28px_60px_-28px_rgba(36,26,32,.45)]"
                      : "z-10 shadow-[0_14px_34px_-24px_rgba(36,26,32,.4)]"
                  } ${far ? "pointer-events-none" : ""}`}
                  style={{
                    transform: `translateY(calc(-50% + ${d * STEP}px)) scale(${
                      d === 0 ? 1 : far ? 0.78 : 0.88
                    })`,
                    opacity: far ? 0 : d === 0 ? 1 : 0.55,
                  }}
                >
                  <div
                    className="h-[104px] w-[92px] shrink-0 rounded-[14px] bg-stone bg-cover bg-center"
                    style={{ backgroundImage: `url(${u.items[0].image})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-muted">{u.who}</div>
                    <div className="mt-1 truncate text-[17px] font-bold tracking-tight">{u.key}</div>
                    <div className="mt-0.5 text-[12.5px] text-muted">
                      {u.items.length} pièce{u.items.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full border border-line transition-all duration-400 ease-soft ${
                      d === 0 ? "h-11 w-11 self-end" : "h-9 w-9 self-end"
                    }`}
                  >
                    ↗
                  </span>
                </Link>
              );
            })}
          </div>

          <Chevron dir={1} onClick={() => go(1)} />
        </div>

        <Panel product={right} side="right" active={active} fallback={current.key} />
      </div>
    </div>
  );
}

function Chevron({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === -1 ? "Univers précédent" : "Univers suivant"}
      className="flex h-9 w-9 items-center justify-center text-lg text-muted transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:text-ink"
    >
      {dir === -1 ? "⌃" : "⌄"}
    </button>
  );
}

/**
 * Grand visuel latéral, avec deux tranches en éventail derrière pour suggérer
 * la pile. Quand la catégorie n'a pas de deuxième pièce, on l'écrit au lieu de
 * répéter la même photo.
 */
function Panel({
  product,
  side,
  active,
  fallback,
}: {
  product?: { image: string; name: string; slug: string };
  side: "left" | "right";
  active: number;
  fallback?: string;
}) {
  const fan = side === "left" ? "-left-3" : "-right-3";
  const fanNear = side === "left" ? "-left-1.5" : "-right-1.5";

  return (
    <div className="relative hidden aspect-4/5 max-h-[520px] lg:block">
      <div aria-hidden className={`absolute inset-y-6 w-full rounded-[26px] bg-ink/8 ${fan}`} />
      <div aria-hidden className={`absolute inset-y-3 w-full rounded-[26px] bg-ink/12 ${fanNear}`} />

      {product ? (
        <Link
          key={`${active}-${product.slug}`}
          href={`/p/${product.slug}`}
          className="anim-panel group absolute inset-0 block overflow-hidden rounded-[26px] bg-stone"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-soft group-hover:scale-105"
            style={{ backgroundImage: `url(${product.image})` }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/80 to-transparent p-5 pt-14">
            <div className="text-[13.5px] font-semibold text-white">{product.name}</div>
          </div>
        </Link>
      ) : (
        <div
          key={active}
          className="anim-panel absolute inset-0 flex flex-col justify-end rounded-[26px] bg-mist p-6"
        >
          <div className="text-[13px] text-muted">{fallback}</div>
          <div className="mt-1 text-[17px] font-bold tracking-tight">Une seule pièce en stock</div>
          <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-muted">
            Le réassort est annoncé sur WhatsApp. La photo de gauche est la pièce disponible
            aujourd&apos;hui.
          </p>
        </div>
      )}
    </div>
  );
}
