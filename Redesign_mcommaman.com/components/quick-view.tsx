"use client";

import { useState } from "react";
import Link from "next/link";
import { formatXOF } from "@/lib/format";
import { COLORS, SIZES, type Product } from "@/lib/products";
import { useCart } from "./cart-context";
import { FavoriteButton } from "./favorite-button";

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { add } = useCart();
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(2);

  if (!product) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-90 flex items-center justify-center bg-ink/45 p-10 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up grid max-h-[88vh] w-[900px] max-w-full grid-cols-2 overflow-auto rounded-[26px] bg-cream"
      >
        <div className="min-h-[420px] bg-stone bg-cover bg-center" style={{ backgroundImage: `url(${product.image})` }} />

        <div className="p-9">
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-rose">Aperçu rapide</span>
            <button onClick={onClose} aria-label="Fermer" className="text-xl leading-none text-muted">
              ×
            </button>
          </div>

          <h2 className="mt-3.5 text-[28px] font-extrabold tracking-tight">{product.name}</h2>

          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl font-extrabold">{formatXOF(product.price)}</span>
            {product.compareAt && (
              <span className="text-[15px] text-muted line-through">{formatXOF(product.compareAt)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#6b5a61]">{product.description}</p>

          <div className="mb-2.5 mt-5 text-[12.5px] font-bold">Couleur</div>
          <div className="flex gap-2.5">
            {COLORS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setColor(i)}
                aria-label={c.name}
                className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c.hex,
                  boxShadow: `0 0 0 1px #e5d9de, 0 0 0 ${color === i ? 2 : 0}px #241a20`,
                }}
              />
            ))}
          </div>

          <div className="mb-2.5 mt-5 text-[12.5px] font-bold">Taille</div>
          <div className="flex flex-wrap gap-2.5">
            {SIZES.map((s, i) => (
              <button
                key={s}
                onClick={() => setSize(i)}
                className={`rounded-xl border-[1.5px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                  size === i ? "border-ink bg-ink text-white" : "border-[#e5d9de] bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => {
                add(product.id, color, size);
                onClose();
              }}
              className="flex-1 rounded-full bg-rose py-3.5 text-[14.5px] font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-97"
            >
              Ajouter au panier
            </button>
            <Link
              href={`/p/${product.slug}`}
              className="rounded-full border-[1.5px] border-[#e5d9de] px-5 py-3.5 text-[14.5px] font-bold"
            >
              Voir la fiche
            </Link>
            <FavoriteButton
              productId={product.id}
              productName={product.name}
              size="md"
              variant="contour"
              className="shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
