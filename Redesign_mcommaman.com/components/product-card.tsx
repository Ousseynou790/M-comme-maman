"use client";

import Link from "next/link";
import { formatXOF } from "@/lib/format";
import { type Product } from "@/lib/products";
import { useCart } from "./cart-context";
import { useSpotlight } from "./motion";
import { FavoriteButton } from "./favorite-button";
import { IconBag } from "./icons";

/* Les deux pastilles posées au bas de la photo : même dessin, même montée au
   survol, seul le coin change. Rien ne se déclenche au doigt, où le lien de la
   carte occupe déjà toute la surface. */
const ACTION =
  "absolute z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition-all duration-300 ease-soft hover:bg-rose hover:text-white sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100";

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

        {/* Le cœur reste visible en permanence, comme sur la maquette boty :
            c'est le seul geste qui ne coûte rien, il ne se mérite pas au
            survol. */}
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute right-3 top-3 z-20"
        />

        {!product.outOfStock && (
          <button
            onClick={() => add(product.id)}
            aria-label={`Ajouter ${product.name} au panier`}
            className={`${ACTION} bottom-3 left-3`}
          >
            <IconBag className="h-4 w-4" />
          </button>
        )}

        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            aria-label={`Aperçu rapide de ${product.name}`}
            className={`${ACTION} bottom-3 right-3 text-[13px]`}
          >
            ⤢
          </button>
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
