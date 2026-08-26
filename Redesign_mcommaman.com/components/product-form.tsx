"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatXOF } from "@/lib/format";
import { CATEGORIES, type Age, type Gender } from "@/lib/products";
import { useAdmin } from "@/lib/admin/store";
import { slugify } from "@/lib/admin/seed";
import { AGES, GENDERS, type AdminProduct } from "@/lib/admin/types";
import { Button, Modal, Note } from "./admin/ui";
import { IconArrowLeft, IconCheck, IconImage, IconPlus, IconX } from "./admin/icons";

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
export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { library, createProduct, saveProduct, products } = useAdmin();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compareAt ? String(product.compareAt) : "");
  const [category, setCategory] = useState<string>(product?.category ?? CATEGORIES[0]);
  const [age, setAge] = useState<Age>(product?.age ?? "2-10");
  const [gender, setGender] = useState<Gender>(product?.gender ?? "mixte");
  const [description, setDescription] = useState(product?.description ?? "");
  const [photos, setPhotos] = useState<string[]>(
    product ? [product.image, ...product.gallery].filter(Boolean) : []
  );
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [photothegue, setPhotothegue] = useState(false);
  const [adresse, setAdresse] = useState("");
  const [enregistre, setEnregistre] = useState<"none" | "brouillon" | "publie">("none");

  const priceNumber = nombre(price);
  const compareNumber = nombre(compareAt);
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
    return list;
  }, [name, photos.length, priceNumber, description, sku]);

  const canPublish = blockers.length === 0;
  const variantCount = Math.max(1, colors.length) * Math.max(1, sizes.length);

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
      slug: slug || `fiche-${Date.now().toString(36)}`,
      name: name.trim(),
      sku: sku.trim(),
      price: priceNumber,
      /* Un prix barré inférieur au prix afficherait une remise négative : on ne
         le garde que s'il veut dire quelque chose. */
      ...(compareNumber > priceNumber ? { compareAt: compareNumber } : {}),
      category,
      gender,
      age,
      image: photos[0] ?? "",
      gallery: photos.slice(1),
      description: description.trim(),
      colors,
      sizes,
      stock: Number(stock.replace(/\D/g, "")) || 0,
      status: statut,
      outOfStock: (Number(stock.replace(/\D/g, "")) || 0) <= 0,
      createdAt: product?.createdAt ?? maintenant,
      updatedAt: maintenant,
    };

    if (product) saveProduct(fiche);
    else createProduct(fiche);

    setEnregistre(statut);
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
          <p className="mt-1.5 text-[13.5px] text-muted">
            {product
              ? "Les changements prennent effet dès l'enregistrement."
              : "Enregistré en brouillon tant que la fiche n'est pas complète."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="contour" onClick={() => enregistrer("brouillon")}>
            Enregistrer en brouillon
          </Button>
          <Button variant="rose" disabled={!canPublish} onClick={() => enregistrer("publie")}>
            {product?.status === "publie" ? "Enregistrer et garder en ligne" : "Publier en boutique"}
          </Button>
        </div>
      </div>

      {enregistre !== "none" && (
        <div
          className="anim-fade-up mt-5 flex items-center gap-3 rounded-2xl px-5 py-4 text-[13.5px] font-semibold"
          style={
            enregistre === "publie"
              ? { background: "#eaf6ef", color: "#2e7d52" }
              : { background: "#fdf3dc", color: "#8a6a12" }
          }
        >
          <IconCheck className="h-4 w-4 shrink-0" />
          {enregistre === "publie"
            ? `« ${name} » est en ligne. Adresse en boutique : /p/${slug}.`
            : `« ${name || "Sans titre"} » enregistré en brouillon. Invisible en boutique.`}
        </div>
      )}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {/* -------------------------------------------------------- identité */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nom commercial"
                span={2}
                hint={
                  name
                    ? `Adresse en boutique : /p/${slug}`
                    : "Ce que la cliente lit. Jamais un nom de fichier ni « Ensemble enfant-190 »."
                }
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
                  Une autre fiche occupe déjà l&apos;adresse /p/{slug}. Changez le nom, sinon les
                  deux se marcheront dessus en boutique.
                </p>
              )}

              <Field label="Référence interne" hint="Visible en petit sur la fiche, jamais en titre.">
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="RBP-0040"
                  className={inputClass}
                />
              </Field>

              <Field label="Catégorie">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tranche d'âge">
                <div className="flex gap-2">
                  {AGES.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAge(a.value)}
                      className={`flex-1 rounded-xl border-[1.5px] px-2 py-3 text-[12.5px] font-semibold transition-colors ${
                        age === a.value ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Genre">
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={`flex-1 rounded-xl border-[1.5px] px-2 py-3 text-[12.5px] font-semibold transition-colors ${
                        gender === g.value
                          ? "border-ink bg-ink text-white"
                          : "border-[#ece3e7] bg-white"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Description"
                span={2}
                hint="Matière, coupe, entretien. C'est ce texte qui remplit la fiche et le référencement."
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

            {library.materials.length > 0 && (
              <div className="mt-3.5">
                <span className="text-[11.5px] font-bold text-muted">Matières courantes :</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {library.materials.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setDescription((d) => (d.trim() ? `${d.trim()} ${m}.` : `${m}.`))
                      }
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:border-rose/40 hover:text-ink"
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

            {photos.length === 0 && (
              <p className="mt-3 text-[12px] text-muted">
                Une fiche sans photo ne peut pas être publiée.
              </p>
            )}
          </section>

          {/* --------------------------------------------------- prix et stock */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Prix et stock</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Prix de vente" hint="En francs CFA, nombre entier.">
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

              <Field label="Prix barré (facultatif)" hint="Affiche le badge Promo sur la carte.">
                <div className="relative">
                  <input
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="14 000"
                    inputMode="numeric"
                    className={`${inputClass} pr-14`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-muted">
                    F CFA
                  </span>
                </div>
              </Field>

              <Field label="Stock" hint="Zéro : la fiche se signale en rupture.">
                <input
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                  placeholder="8"
                  inputMode="numeric"
                  className={inputClass}
                />
              </Field>
            </div>

            {compareNumber > 0 && priceNumber > 0 && compareNumber <= priceNumber && (
              <p className="mt-3 rounded-xl bg-rose-soft px-4 py-3 text-[12.5px] font-semibold text-rose-deep">
                Le prix barré doit être supérieur au prix de vente, sinon la remise affichée sera
                fausse. Tel quel, il ne sera pas enregistré.
              </p>
            )}
            {compareNumber > priceNumber && priceNumber > 0 && (
              <p className="mt-3 text-[12.5px] text-muted">
                Remise affichée : −{Math.round((1 - priceNumber / compareNumber) * 100)} % ·{" "}
                {formatXOF(compareNumber - priceNumber)} d&apos;économie
              </p>
            )}
          </section>

          {/* -------------------------------------------------------- variantes */}
          <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-extrabold tracking-tight">Variantes</h2>
              <span className="text-[12px] text-muted">
                {variantCount} variante{variantCount > 1 ? "s" : ""} · réglées dans la bibliothèque
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

            {canPublish ? (
              <p className="mt-3.5 text-[13px] leading-relaxed text-muted">
                La fiche est complète. À la publication, elle apparaît dans le catalogue et dans les
                résultats de recherche.
              </p>
            ) : (
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
                {compareNumber > priceNumber && priceNumber > 0 && (
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
                  {compareNumber > priceNumber && (
                    <span className="text-[13px] text-muted line-through">
                      {formatXOF(compareNumber)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12.5px] text-muted">
                  {category} · {age} ans
                </div>
              </div>
            </div>
          </div>

          <Note>
            Les cinq conditions de publication sont à vérifier côté serveur aussi, pas seulement
            ici : un appel direct à l&apos;API contournerait le brouillon.
          </Note>
        </aside>
      </div>

      {/* ----------------------------------------------------- photothèque */}
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
          <p className="text-[13px] text-muted">
            La photothèque est vide. Ajoutez-y des visuels depuis la bibliothèque.
          </p>
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

        <p className="mt-5 flex items-center gap-2 text-[12px] text-muted">
          <IconImage className="h-4 w-4 shrink-0" />
          La première photo devient la principale : c&apos;est elle qui s&apos;affiche sur la carte
          du catalogue.
        </p>
      </Modal>
    </div>
  );
}
