"use client";

import { useState } from "react";
import Link from "next/link";
import { formatXOF } from "@/lib/format";
import { COLORS, type Product } from "@/lib/products";
import { useCart } from "./cart-context";
import { useSpotlight } from "./motion";

export function ProductCard({
  product,
  onQuickView,
  delay,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
  /** Sans `delay`, la carte n'anime pas son entrée : la grille s'en charge. */
  delay?: number;
}) {
  const ref = useSpotlight<HTMLDivElement>();
  const { add } = useCart();
  const [color, setColor] = useState(0);

  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    <div
      ref={ref}
      className="group flex flex-col"
      style={
        delay === undefined
          ? undefined
          : { animation: `rise-scale .65s ${delay}ms var(--ease-soft) backwards` }
      }
    >
      <div className="spot relative aspect-3/4 overflow-hidden rounded-[22px] bg-stone">
        {/* Toute la photo est cliquable. Les boutons posés dessus sont en z-20. */}
        <Link href={`/p/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />

        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1100ms] ease-soft group-hover:scale-108"
          style={{ backgroundImage: `url(${product.image})` }}
        />

        {/* Teinte de la couleur choisie, très légère : la photo reste la photo. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: COLORS[color].hex }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 translate-y-6 bg-linear-to-t from-ink/55 via-ink/15 to-transparent opacity-0 transition-all duration-500 ease-soft group-hover:translate-y-0 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-rose px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(224,65,127,.9)]">
              −{discount} %
            </span>
          )}
          {product.outOfStock && (
            <span className="rounded-full bg-ink/85 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur">
              Épuisé
            </span>
          )}
        </div>

        {/* Nuanciers : au survol sur grand écran, toujours visibles au doigt. */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5 sm:translate-x-3 sm:opacity-0 sm:transition-all sm:duration-400 sm:ease-soft sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
          {COLORS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setColor(i)}
              aria-label={`Voir en ${c.name}`}
              aria-pressed={color === i}
              className={`h-5 w-5 rounded-full border-2 transition-transform duration-300 ease-back hover:scale-115 ${
                color === i ? "border-white shadow-[0_0_0_1.5px_rgba(36,26,32,.35)]" : "border-white/70"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>

        {!product.outOfStock && (
          <div className="absolute inset-x-3 bottom-3 z-20 flex gap-2 sm:translate-y-4 sm:opacity-0 sm:transition-all sm:duration-400 sm:ease-soft sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            <button
              onClick={() => add(product.id, color)}
              className="shine flex-1 rounded-full bg-ink py-2.5 text-[12.5px] font-bold text-white transition-colors duration-300 hover:bg-rose"
            >
              Ajouter
            </button>
            {onQuickView && (
              <button
                onClick={() => onQuickView(product)}
                aria-label={`Aperçu rapide de ${product.name}`}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/95 text-[13px] backdrop-blur transition-colors duration-300 hover:bg-rose hover:text-white"
              >
                ⤢
              </button>
            )}
          </div>
        )}
      </div>

      <Link href={`/p/${product.slug}`} className="block pt-3.5">
        <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
          {product.category} · {product.age} ans
        </div>
        <div className="mt-1 text-[14.5px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-rose">
          {product.name}
        </div>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <span className="text-[15px] font-extrabold tabular-nums">{formatXOF(product.price)}</span>
          {product.compareAt && (
            <span className="text-[13px] text-muted line-through">{formatXOF(product.compareAt)}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
