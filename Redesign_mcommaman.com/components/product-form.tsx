"use client";

import { useMemo, useState } from "react";
import { formatXOF } from "@/lib/format";
import { CATEGORIES, COLORS, SIZES } from "@/lib/products";

const AGES = [
  { key: "0-1", label: "0 à 1 an" },
  { key: "2-10", label: "2 à 10 ans" },
  { key: "10-15", label: "10 à 15 ans" },
];

const GENDERS = [
  { key: "fille", label: "Fille" },
  { key: "garcon", label: "Garçon" },
  { key: "mixte", label: "Mixte" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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

const inputClass =
  "w-full rounded-2xl border-[1.5px] border-[#ece3e7] bg-white px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[#b3a5aa] focus:border-rose";

export function ProductForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [age, setAge] = useState("2-10");
  const [gender, setGender] = useState("mixte");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [colors, setColors] = useState<number[]>([0]);
  const [sizes, setSizes] = useState<number[]>([2, 3]);
  const [stock, setStock] = useState("");
  const [saved, setSaved] = useState<"none" | "draft" | "published">("none");

  const priceNumber = Number(price.replace(/\s/g, "")) || 0;
  const compareNumber = Number(compareAt.replace(/\s/g, "")) || 0;

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

  const toggle = (list: number[], set: (v: number[]) => void, i: number) =>
    set(list.includes(i) ? list.filter((x) => x !== i) : [...list, i].sort((a, b) => a - b));

  const addPhoto = () =>
    setPhotos((p) => [...p, `photo-${String(p.length + 1).padStart(2, "0")}.jpg`]);

  return (
    <div className="anim-fade-up">
      <div className="flex items-end justify-between">
        <div>
          <button onClick={onCancel} className="text-[12.5px] font-semibold text-muted hover:text-rose">
            ← Retour aux produits
          </button>
          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-.03em]">Nouveau produit</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Enregistré en brouillon tant que la fiche n&apos;est pas complète.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSaved("draft")}
            className="rounded-full border-[1.5px] border-[#e5d9de] bg-white px-5 py-3 text-[13.5px] font-bold"
          >
            Enregistrer en brouillon
          </button>
          <button
            onClick={() => canPublish && setSaved("published")}
            disabled={!canPublish}
            className="rounded-full bg-rose px-5.5 py-3 text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publier en boutique
          </button>
        </div>
      </div>

      {saved !== "none" && (
        <div
          className="anim-fade-up mt-5 flex items-center gap-3 rounded-2xl px-5 py-4 text-[13.5px] font-semibold"
          style={
            saved === "published"
              ? { background: "#eaf6ef", color: "#2e7d52" }
              : { background: "#fdf3dc", color: "#8a6a12" }
          }
        >
          <span>{saved === "published" ? "✓" : "•"}</span>
          {saved === "published"
            ? `« ${name} » est en ligne. Visible sur /p/${slugify(name)}.`
            : `« ${name || "Sans titre"} » enregistré en brouillon. Invisible en boutique.`}
          <button onClick={() => setSaved("none")} className="ml-auto opacity-60">
            ×
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-[1fr_320px] items-start gap-6">
        <div className="flex flex-col gap-4">
          <section className="rounded-[20px] border border-line bg-white p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nom commercial"
                span={2}
                hint={
                  name
                    ? `Adresse en boutique : /p/${slugify(name)}`
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
                      key={a.key}
                      onClick={() => setAge(a.key)}
                      className={`flex-1 rounded-xl border-[1.5px] px-3 py-3 text-[12.5px] font-semibold transition-colors ${
                        age === a.key ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
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
                      key={g.key}
                      onClick={() => setGender(g.key)}
                      className={`flex-1 rounded-xl border-[1.5px] px-3 py-3 text-[12.5px] font-semibold transition-colors ${
                        gender === g.key ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
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
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[20px] border border-line bg-white p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[15px] font-extrabold tracking-tight">Photos</h2>
              <span className="text-[12px] text-muted">
                Format carré ou 3:4, fond uni, même lumière pour tout le catalogue
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {photos.map((p, i) => (
                <div
                  key={p}
                  className="anim-fade-up group relative flex aspect-3/4 items-end rounded-2xl bg-[repeating-linear-gradient(135deg,#f2e9ed_0_10px,#f7f0f3_10px_20px)] p-2.5"
                >
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white">
                      Principale
                    </span>
                  )}
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Retirer la photo"
                  >
                    ×
                  </button>
                  <span className="text-[10px] font-semibold text-[#a2939a]">{p}</span>
                </div>
              ))}
              <button
                onClick={addPhoto}
                className="flex aspect-3/4 flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#e0d3d9] text-muted transition-colors hover:border-rose hover:text-rose"
              >
                <span className="text-xl leading-none">+</span>
                <span className="text-[11px] font-semibold">Ajouter</span>
              </button>
            </div>
            {photos.length === 0 && (
              <p className="mt-3 text-[12px] text-muted">
                Une fiche sans photo ne peut pas être publiée.
              </p>
            )}
          </section>

          <section className="rounded-[20px] border border-line bg-white p-6">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight">Prix et stock</h2>
            <div className="grid grid-cols-3 gap-4">
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

              <Field label="Stock initial" hint="Réparti ensuite par variante.">
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
                Le prix barré doit être supérieur au prix de vente, sinon la remise affichée sera fausse.
              </p>
            )}
            {compareNumber > priceNumber && priceNumber > 0 && (
              <p className="mt-3 text-[12.5px] text-muted">
                Remise affichée : −{Math.round((1 - priceNumber / compareNumber) * 100)} % ·{" "}
                {formatXOF(compareNumber - priceNumber)} d&apos;économie
              </p>
            )}
          </section>

          <section className="rounded-[20px] border border-line bg-white p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[15px] font-extrabold tracking-tight">Variantes</h2>
              <span className="text-[12px] text-muted">
                {variantCount} variante{variantCount > 1 ? "s" : ""} générée
                {variantCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="mb-2.5 text-[12.5px] font-bold">Couleurs</div>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c, i) => {
                const on = colors.includes(i);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggle(colors, setColors, i)}
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
              {SIZES.map((s, i) => {
                const on = sizes.includes(i);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(sizes, setSizes, i)}
                    className={`rounded-xl border-[1.5px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                      on ? "border-ink bg-ink text-white" : "border-[#ece3e7] bg-white"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="sticky top-8 flex flex-col gap-4">
          <div className="rounded-[20px] border border-line bg-white p-5">
            <div className="flex items-center justify-between">
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
              <div className="relative flex aspect-3/4 items-end overflow-hidden rounded-2xl bg-[repeating-linear-gradient(135deg,#f2e9ed_0_10px,#f7f0f3_10px_20px)] p-3">
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

          <div className="rounded-2xl bg-gold-soft px-5 py-4 text-[12.5px] leading-relaxed text-[#5c4a2a]">
            Les cinq conditions de publication sont vérifiées côté serveur aussi, pas seulement ici :
            un appel direct à l&apos;API ne peut pas contourner le brouillon.
          </div>
        </aside>
      </div>
    </div>
  );
}
