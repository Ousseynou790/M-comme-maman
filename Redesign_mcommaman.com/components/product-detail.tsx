"use client";

import { useState } from "react";
import Link from "next/link";
import { formatXOF, waLink } from "@/lib/format";
import { COLORS, SIZES, PRODUCTS, type Product } from "@/lib/products";
import { ProductCard } from "./product-card";
import { useCart } from "./cart-context";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(2);
  const [openBlock, setOpenBlock] = useState(0);

  const blocks = [
    { t: "Description", c: product.description },
    {
      t: "Composition et entretien",
      c: "95 % coton, 5 % élasthanne.\nLavage machine à 30°, séchage à plat.\nRepassage doux sur l'envers.",
    },
    {
      t: "Livraison et retours",
      c: "Dakar et banlieue : 24 h, 2 000 F, offerte dès 25 000 F.\nRégions : 2 à 4 jours, 3 500 F.\nÉchange ou remboursement sous 7 jours.",
    },
  ];

  const gallery = [
    { image: product.image, label: "" },
    { image: null, label: "vue dos" },
    { image: null, label: "détail tissu" },
    { image: null, label: "porté" },
  ];

  const discount = product.compareAt
    ? `−${Math.round((1 - product.price / product.compareAt) * 100)} %`
    : null;

  const recos = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1400px] px-10 pb-20 pt-7">
      <div className="text-[12.5px] text-muted">
        <Link href="/">Accueil</Link> · <Link href="/boutique">{product.category}</Link> · {product.name}
      </div>

      <div className="grid grid-cols-[1.05fr_.95fr] gap-14 pt-5">
        <div>
          <div
            className="aspect-4/5 rounded-3xl bg-stone bg-cover bg-center"
            style={{ backgroundImage: `url(${product.image})` }}
          />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.map((g, i) => (
              <div
                key={i}
                className="flex aspect-square items-end rounded-2xl bg-stone bg-cover bg-center p-2.5"
                style={{
                  backgroundImage: g.image ? `url(${g.image})` : undefined,
                  boxShadow: i === 0 ? "0 0 0 2px #241a20" : undefined,
                }}
              >
                <span className="text-[10px] font-semibold leading-tight text-[#a2939a]">{g.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-rose">{product.category}</span>
            <span className="text-xs text-[#9c8d93]">réf. {product.sku}</span>
          </div>

          <h1 className="mt-3.5 text-[40px] font-extrabold leading-[1.08] tracking-[-.03em]">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2.5">
            <span className="text-sm tracking-[2px] text-gold">★★★★★</span>
            <span className="text-[13px] text-muted">4,8 · 12 avis</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-[30px] font-extrabold tracking-[-.03em]">{formatXOF(product.price)}</span>
            {product.compareAt && (
              <span className="text-base text-[#9c8d93] line-through">{formatXOF(product.compareAt)}</span>
            )}
            {discount && (
              <span className="rounded-full bg-rose-soft px-2.5 py-1 text-xs font-bold text-rose-deep">
                {discount}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Taxes incluses. Livraison calculée à l&apos;étape suivante.
          </p>

          <div className="mt-7">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-bold">Couleur</span>
              <span className="text-[13px] text-muted">{COLORS[color].name}</span>
            </div>
            <div className="flex gap-2.5">
              {COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColor(i)}
                  aria-label={c.name}
                  className="h-9 w-9 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c.hex,
                    boxShadow: `0 0 0 1px #e5d9de, 0 0 0 ${color === i ? 2 : 0}px #241a20`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-bold">Taille</span>
              <span className="text-[13px] font-semibold text-rose">Guide des tailles</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {SIZES.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSize(i)}
                  className={`rounded-xl border-[1.5px] px-4.5 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    size === i ? "border-ink bg-ink text-white" : "border-[#e5d9de] bg-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5.5 flex items-center gap-2.5 text-[13.5px] font-semibold text-[#2e7d52]">
            <span className="h-2 w-2 rounded-full bg-[#2e7d52]" />
            {product.outOfStock ? "Réassort attendu sous 10 jours" : "En stock — expédié aujourd'hui"}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => add(product.id, color, size)}
              disabled={product.outOfStock}
              className="flex-1 rounded-full bg-rose py-4.5 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(224,65,127,.65)] transition-all hover:-translate-y-[3px] active:scale-97 disabled:opacity-50"
            >
              {product.outOfStock ? "Me prévenir du réassort" : "Ajouter au panier"}
            </button>
            <a
              href={waLink(`Bonjour, je suis intéressée par : ${product.name} (${product.sku})`)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border-[1.5px] border-[#e5d9de] bg-white px-6 py-4.5 text-[15px] font-bold"
            >
              WhatsApp
            </a>
          </div>

          <div className="mt-5 flex gap-5 text-[12.5px] text-muted">
            <span>Livraison Dakar 24 h</span>
            <span>Échange sous 7 jours</span>
            <span>Paiement à la livraison</span>
          </div>

          <div className="mt-7 border-t border-line">
            {blocks.map((b, i) => (
              <div key={b.t} className="border-b border-line">
                <button
                  onClick={() => setOpenBlock(openBlock === i ? -1 : i)}
                  className="flex w-full items-center justify-between py-4.5 text-left text-[14.5px] font-bold"
                >
                  {b.t}
                  <span className="text-lg text-rose">{openBlock === i ? "−" : "+"}</span>
                </button>
                {openBlock === i && (
                  <p className="whitespace-pre-line pb-5 text-sm leading-[1.7] text-[#6b5a61]">{b.c}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-17">
        <h2 className="mb-5 text-[32px] font-extrabold tracking-[-.03em]">Dans le même esprit</h2>
        <div className="grid grid-cols-4 gap-5">
          {recos.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 60} />
          ))}
        </div>
      </div>
    </div>
  );
}
