"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXOF } from "@/lib/format";
import { useAdmin } from "@/lib/admin/store";
import { slugify } from "@/lib/admin/seed";
import type { AdminProduct } from "@/lib/admin/types";
import { Button, Modal } from "./admin/ui";
import { IconArrowLeft, IconCheck, IconPlus, IconTrash, IconX } from "./admin/icons";

const inputClass =
  "w-full rounded-2xl border-[1.5px] border-[#ece3e7] bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[#b3a5aa] focus:border-rose";

const Field = ({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span?: number;
}) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label className="mb-2 block text-[12.5px] font-bold">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{hint}</p>}
  </div>
);

/** Un nombre saisi avec des espaces reste un nombre : « 12 000 » vaut 12000. */
const nombre = (v: string) => Number(v.replace(/\s/g, "")) || 0;

/**
 * L'éditeur de fiche.
 *
 * Sans `product`, il crée ; avec, il modifie. Les couleurs, les tailles et les
 * matières ne sont pas écrites ici : elles viennent de la bibliothèque du
 * back-office, pour que deux fiches ne finissent pas avec « rose poudré » et
 * « Rose Poudre ».
 */
/**
 * Une référence interne libre, dérivée du nom.
 *
 * Trois lettres et un numéro qui ne heurte aucune fiche existante : le serveur
 * exige l'unicité, autant la proposer d'emblée plutôt que de la faire découvrir
 * au moment d'enregistrer. Elle reste modifiable — c'est une suggestion.
 */
function referenceProposee(nom: string, prises: Set<string>): string {
  const lettres =
    (nom
      .normalize("NFD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, 3) || "REF").padEnd(3, "X");

  for (let n = 1; n < 10_000; n += 1) {
    const candidat = `${lettres}-${String(n).padStart(4, "0")}`;
    if (!prises.has(candidat)) return candidat;
  }
  // Dix mille fiches partageant les mêmes trois lettres : on ne bloque pas.
  return `${lettres}-${Date.now().toString(36).toUpperCase()}`;
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { library, createProduct, saveProduct, products, categories } = useAdmin();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  /* Tant que la gérante n'a pas écrit sa propre référence, celle-ci suit le
     nom. Dès qu'elle en saisit une, on ne la lui reprend plus. */
  const [skuTouche, setSkuTouche] = useState(Boolean(product?.sku));
  const [price, setPrice] = useState(product ? String(product.price) : "");
  /* Les rayons viennent de la table des catégories, jamais d'une liste écrite
     ici : en créer une nouvelle doit suffire à la voir apparaître. Les
     sous-catégories d'abord, ce sont elles qui rangent vraiment une fiche. */
  const rayons = useMemo(() => {
    const racines = categories.filter((c) => c.parentSlugs.length === 0);
    const groupes = racines.map((racine) => ({
      titre: racine.label,
      options: [
        racine,
        ...categories.filter((c) => c.parentSlugs.includes(racine.slug)),
      ],
    }));
    /* Une sous-catégorie dont la parente aurait disparu resterait choisissable :
       mieux vaut la proposer que la perdre. */
    const orphelines = categories.filter(
      (c) => c.parentSlugs.length > 0 && !racines.some((r) => c.parentSlugs.includes(r.slug)),
    );
    return orphelines.length
      ? [...groupes, { titre: "Sans catégorie parente", options: orphelines }]
      : groupes;
  }, [categories]);

  const premierRayon = rayons[0]?.options[0]?.label ?? "";
  const [category, setCategory] = useState<string>(product?.category ?? premierRayon);
  const [description, setDescription] = useState(product?.description ?? "");
  const [photos, setPhotos] = useState<string[]>(
    product ? [product.image, ...product.gallery].filter(Boolean) : []
  );
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [materials, setMaterials] = useState<string[]>(product?.materials ?? []);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (product?.variants ?? []).map((v) => [`${v.size}\u0000${v.color}`, v.stock]),
    ),
  );
  const [variantesExclues, setVariantesExclues] = useState<Set<string>>(() => {
    if (!product) return new Set();
    const presentes = new Set(product.variants.map((v) => `${v.size}\u0000${v.color}`));
    const couleurs = product.colors.length ? product.colors : [""];
    return new Set(
      product.sizes
        .flatMap((size) => couleurs.map((color) => `${size}\u0000${color}`))
        .filter((cle) => !presentes.has(cle)),
    );
  });
  const [varianteASupprimer, setVarianteASupprimer] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const [photothegue, setPhotothegue] = useState(false);
  const [adresse, setAdresse] = useState("");

  const referencesPrises = useMemo(
    () => new Set(products.filter((p) => p.id !== product?.id).map((p) => p.sku)),
    [products, product?.id],
  );

  useEffect(() => {
    if (skuTouche) return;
    setSku(name.trim() ? referenceProposee(name, referencesPrises) : "");
  }, [name, skuTouche, referencesPrises]);

  /* Le premier rayon connu sert de valeur de départ : la liste arrive après le
     premier rendu, quand le back-office a fini de lire la base. */
  useEffect(() => {
    if (!category && premierRayon) setCategory(premierRayon);
  }, [category, premierRayon]);

  const priceNumber = nombre(price);
  const slug = slugify(name);

  /**
   * Garde-fou de l'audit : un produit ne peut pas être publié tant qu'il n'a pas
   * un nom commercial, au moins une photo et un prix supérieur à zéro.
   * C'est ce contrôle qui manquait quand « Safari enfant » est parti en ligne à 0 F.
   */
  const blockers = useMemo(() => {
    const list: string[] = [];
    if (name.trim().length < 4) list.push("un nom commercial d'au moins 4 caractères");
    if (photos.length === 0) list.push("au moins une photo");
    if (priceNumber <= 0) list.push("un prix supérieur à zéro");
    if (description.trim().length < 20) list.push("une description d'au moins 20 caractères");
    if (!sku.trim()) list.push("une référence interne");
    if (sizes.length === 0) list.push("au moins une taille ou option de vente");
    return list;
  }, [name, photos.length, priceNumber, description, sku, sizes.length]);

  const variantChoices = useMemo(
    () =>
      sizes.flatMap((size) =>
        (colors.length ? colors : [""]).map((color) => ({
          size,
          color,
          key: `${size}\u0000${color}`,
        })),
      ).filter((variante) => !variantesExclues.has(variante.key)),
    [colors, sizes, variantesExclues],
  );
  const variantCount = variantChoices.length;
  const canPublish = blockers.length === 0 && variantCount > 0;

  /* Deux fiches qui partagent une adresse s'écrasent en boutique. */
  const slugPris = slug
    ? products.some((p) => p.slug === slug && p.id !== product?.id)
    : false;

  const bascule = (liste: string[], set: (v: string[]) => void, valeur: string) =>
    set(liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]);

  const ajouterPhoto = (src: string) => {
    const propre = src.trim();
    if (!propre || photos.includes(propre)) return;
    setPhotos((p) => [...p, propre]);
  };

  const enregistrer = (statut: "brouillon" | "publie") => {
    if (statut === "publie" && !canPublish) return;
    const maintenant = new Date().toISOString();

    const fiche: AdminProduct = {
      id: product?.id ?? `prod-${Date.now().toString(36)}`,
      univers: categories.find((c) => c.label === category)?.univers ?? "enfant",
      slug: slug || `fiche-${Date.now().toString(36)}`,
      name: name.trim(),
      sku: sku.trim(),
      price: priceNumber,
      /* Le prix barré ne se saisit plus ici : une fiche déjà en promotion garde
         le sien tant qu'on ne le change pas. */
      ...(product?.compareAt ? { compareAt: product.compareAt } : {}),
      category,
      image: photos[0] ?? "",
      gallery: photos.slice(1),
      description: description.trim(),
      colors,
      sizes,
      materials,
      variants: variantChoices.map(({ size, color, key }) => ({
        id: product?.variants.find((v) => v.size === size && v.color === color)?.id,
        size,
        color,
        stock: variantStocks[key] ?? 0,
      })),
      stock: variantChoices.reduce((total, v) => total + (variantStocks[v.key] ?? 0), 0),
      status: statut,
      outOfStock: variantChoices.every((v) => (variantStocks[v.key] ?? 0) <= 0),
      createdAt: product?.createdAt ?? maintenant,
      updatedAt: maintenant,
    };

    if (product) saveProduct(fiche);
    else createProduct(fiche);

    window.setTimeout(() => router.push("/admin/produits"), 900);
  };

  return (
    <div className="anim-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.push("/admin/produits")}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-rose"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Retour aux produits
          </button>
          <h1 className="mt-2 text-[clamp(1.6rem,3vw,1.9rem)] font-extrabold tracking-[-.03em]">
            {product ? product.name : "Nouveau produit"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="contour" onClick={() => enregistrer("brouillon")}>
            Enregistrer en brouillon
          </Button>
          <Button
            variant="rose"
            disabled={!canPublish}
            onClick={() => enregistrer("publie")}
          >
            {product?.status === "publie" ? "Enregistrer et garder en ligne" : "Publier en boutique"}
          </Button>
        </div>
      </div>


      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {/* -------------------------------------------------------- identité */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nom commercial"
                span={2}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Robe chasuble rose à volant plumetis"
                  className={inputClass}
                />
              </Field>

              {slugPris && (
                <p
                  style={{ gridColumn: "span 2" }}
                  className="rounded-xl bg-rose-soft px-4 py-3 text-[12.5px] font-semibold text-rose-deep"
                >
                  Un produit portant ce nom existe déjà.
                </p>
              )}

              <Field
                label="Référence interne"
              >
                <input
                  value={sku}
                  onChange={(e) => {
                    setSkuTouche(true);
                    setSku(e.target.value.toUpperCase());
                  }}
                  placeholder="TEE-0001"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Catégorie"
              >
                {rayons.length === 0 ? (
                  <p className="rounded-xl bg-rose-soft px-4 py-3 text-[12.5px] leading-relaxed text-rose-deep">
                    Aucune catégorie disponible.{" "}
                    <Link href="/admin/categories" className="underline underline-offset-2">
                      Ajouter une catégorie
                    </Link>
                  </p>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {rayons.map((groupe) => (
                      <optgroup key={groupe.titre} label={groupe.titre}>
                        {groupe.options.map((c) => (
                          <option key={c.id} value={c.label}>
                            {c.parentSlugs.length > 0 ? `\u00a0\u00a0${c.label}` : c.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </Field>

              <Field
                label="Description"
                span={2}
              >
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Chasuble en satin rose, rosette froncée à l'épaule, bas de jupe en plumetis duveteux. Doublure coton, fermeture pression au dos."
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <span className="text-[12.5px] font-bold">Composition</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {library.materials.map((m) => {
                  const on = materials.includes(m.name);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => bascule(materials, setMaterials, m.name)}
                      className={`rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                        on ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
                {library.materials.length === 0 && (
                  <Link href="/admin/configuration" className="text-[12.5px] font-semibold text-rose underline">
                    Ajouter des matières dans la configuration
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------- photos */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-extrabold tracking-tight">Photos</h2>
              <span className="text-[12px] text-muted">
                Format 3:4, fond uni, même lumière pour tout le catalogue
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {photos.map((src, i) => (
                <div
                  key={src}
                  className="anim-fade-up group relative aspect-3/4 overflow-hidden rounded-2xl bg-stone bg-cover bg-center"
                  style={{ backgroundImage: `url(${src})` }}
                >
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white">
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((x) => x !== src))}
                    aria-label="Retirer la photo"
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setPhotothegue(true)}
                className="flex aspect-3/4 flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#e0d3d9] text-muted transition-colors hover:border-rose hover:text-rose"
              >
                <IconPlus />
                <span className="text-[11px] font-semibold">Ajouter</span>
              </button>
            </div>

          </section>

          {/* ------------------------------------------------------------- prix */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Prix</h2>
            <div className="max-w-md">
              <Field label="Prix de vente">
                <div className="relative">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="12 000"
                    inputMode="numeric"
                    className={`${inputClass} pr-14`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-muted">
                    F CFA
                  </span>
                </div>
              </Field>

            </div>
          </section>

          {/* -------------------------------------------------------- variantes */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-extrabold tracking-tight">Variantes</h2>
              <span className="text-[12px] text-muted">
                {variantCount} variante{variantCount > 1 ? "s" : ""} · stock géré par option
              </span>
            </div>

            <div className="mb-2.5 text-[12.5px] font-bold">Couleurs</div>
            <div className="flex flex-wrap gap-2.5">
              {library.colors.map((c) => {
                const on = colors.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => bascule(colors, setColors, c.name)}
                    className={`flex items-center gap-2.5 rounded-full border-[1.5px] py-2 pl-2 pr-4 text-[12.5px] font-semibold transition-colors ${
                      on ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ background: c.hex, boxShadow: "0 0 0 1px #e5d9de" }}
                    />
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div className="mb-2.5 mt-5 text-[12.5px] font-bold">Tailles</div>
            <div className="flex flex-wrap gap-2.5">
              {library.sizes.map((s) => {
                const on = sizes.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => bascule(sizes, setSizes, s.value)}
                    className={`rounded-xl border-[1.5px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                      on ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
                    }`}
                    title={s.age ? `repère : ${s.age}` : undefined}
                  >
                    {s.value}
                  </button>
                );
              })}
            </div>

            {variantChoices.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-line">
                <div className="grid grid-cols-[1fr_110px_40px] bg-[#faf7f8] px-4 py-2.5 text-[11.5px] font-bold uppercase text-muted">
                  <span>Option vendable</span>
                  <span>Stock</span>
                  <span />
                </div>
                {variantChoices.map(({ size, color, key }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_110px_40px] items-center gap-2 border-t border-line px-4 py-2.5"
                  >
                    <span className="text-[13px] font-semibold">
                      {size}{color ? ` · ${color}` : ""}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={variantStocks[key] ?? 0}
                      onChange={(e) =>
                        setVariantStocks((stocks) => ({
                          ...stocks,
                          [key]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      aria-label={`Stock ${size}${color ? ` ${color}` : ""}`}
                      className="w-full rounded-lg border-[1.5px] border-[#ece3e7] bg-white px-3 py-2 text-[13px] tabular-nums outline-none focus:border-rose"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVarianteASupprimer({ key, label: `${size}${color ? ` · ${color}` : ""}` })
                      }
                      aria-label={`Supprimer ${size}${color ? ` ${color}` : ""}`}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-rose-soft hover:text-rose-deep"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------------------ aside */}
        <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
          <div className="rounded-[20px] border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-extrabold uppercase tracking-[.06em]">Statut</span>
              <span
                className="rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                style={
                  canPublish
                    ? { background: "#eaf6ef", color: "#2e7d52" }
                    : { background: "#fdf3dc", color: "#8a6a12" }
                }
              >
                {canPublish ? "Prêt à publier" : "Brouillon"}
              </span>
            </div>

            {!canPublish && (
              <>
                <p className="mt-3.5 text-[13px] font-semibold">Il manque encore :</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {blockers.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[13px] leading-snug text-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="rounded-[20px] border border-line bg-white p-5">
            <div className="text-[12.5px] font-extrabold uppercase tracking-[.06em]">
              Aperçu de la carte
            </div>
            <div className="mt-3.5">
              <div
                className="relative flex aspect-3/4 items-end overflow-hidden rounded-2xl bg-stone bg-cover bg-center p-3"
                style={photos[0] ? { backgroundImage: `url(${photos[0]})` } : undefined}
              >
                {Boolean(product?.compareAt) && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose px-3 py-1.5 text-[11.5px] font-bold text-white">
                    Promo
                  </span>
                )}
                {photos.length === 0 && (
                  <span className="text-[10.5px] font-semibold text-[#a2939a]">aucune photo</span>
                )}
              </div>
              <div className="pt-3">
                <div className="text-[14px] font-semibold tracking-tight">
                  {name || <span className="text-[#b3a5aa]">Nom du produit</span>}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="text-[15px] font-extrabold tabular-nums">
                    {priceNumber > 0 ? formatXOF(priceNumber) : "— F"}
                  </span>
                  {product?.compareAt && (
                    <span className="text-[13px] text-muted line-through">
                      {formatXOF(product.compareAt)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12.5px] text-muted">
                  {category}{materials.length ? ` · ${materials.join(", ")}` : ""}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ----------------------------------------------------- photothèque */}
      <Modal
        open={Boolean(varianteASupprimer)}
        onClose={() => setVarianteASupprimer(null)}
        title={`Supprimer ${varianteASupprimer?.label ?? "cette option"} ?`}
      >
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setVarianteASupprimer(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!varianteASupprimer) return;
              setVariantesExclues((cles) => new Set(cles).add(varianteASupprimer.key));
              setVarianteASupprimer(null);
            }}
          >
            <IconTrash className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </Modal>

      <Modal
        open={photothegue}
        onClose={() => setPhotothegue(false)}
        title="Choisir une photo"
        wide
      >
        <div className="mb-5 flex flex-wrap items-end gap-2.5">
          <label className="min-w-[240px] flex-1">
            <span className="mb-1.5 block text-[12px] font-bold">Ou coller une adresse</span>
            <input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border-[1.5px] border-[#ece3e7] bg-white px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-rose"
            />
          </label>
          <Button
            variant="ink"
            onClick={() => {
              ajouterPhoto(adresse);
              setAdresse("");
              setPhotothegue(false);
            }}
            disabled={!adresse.trim()}
          >
            <IconPlus />
            Ajouter
          </Button>
        </div>

        {library.media.length === 0 ? (
          <p className="text-[13px] text-muted">Photothèque vide.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {library.media.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  ajouterPhoto(m.src);
                  setPhotothegue(false);
                }}
                title={m.name}
                className="group relative aspect-3/4 overflow-hidden rounded-2xl bg-stone bg-cover bg-center ring-offset-2 transition-all hover:ring-2 hover:ring-rose"
                style={{ backgroundImage: `url(${m.src})` }}
              >
                <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {m.name}
                </span>
                {photos.includes(m.src) && (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose text-white">
                    <IconCheck className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

      </Modal>
    </div>
  );
}
