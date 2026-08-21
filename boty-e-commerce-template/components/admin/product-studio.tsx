"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Info, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ageGroups, categories, formatPrice, type AgeGroup, type CategorySlug } from "@/lib/products"
import { useAdmin } from "@/lib/admin/store"
import type { AdminProduct } from "@/lib/admin/types"
import {
  ActionButton,
  OptionPills,
  StackedField,
  StackedSelect,
  StackedTextarea,
} from "./ui"

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function emptyProduct(): AdminProduct {
  const now = new Date().toISOString()
  return {
    id: "",
    name: "",
    tagline: "",
    description: "",
    price: 0,
    originalPrice: null,
    image: "",
    gallery: [],
    category: "filles",
    age: "2-10",
    badge: null,
    sizes: [],
    colors: [],
    rating: 5,
    reviews: 0,
    matiere: "",
    entretien: "",
    livraison:
      "Livraison à Dakar sous 24-48h. Livraison partout au Sénégal sous 2 à 5 jours. Retour gratuit sous 14 jours si l'article n'a pas été porté.",
    sku: "",
    stock: 0,
    status: "brouillon",
    createdAt: now,
    updatedAt: now,
  }
}

/* ------------------------------------------------------------------ */

/** Pastille en pointillés qui se transforme en champ, pour une valeur hors préréglages. */
function AddValuePill({ label, onAdd }: { label: string; onAdd: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")

  const commit = () => {
    const clean = value.trim()
    if (clean) onAdd(clean)
    setValue("")
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> {label}
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setValue("")
          setEditing(false)
        }
      }}
      placeholder="Puis Entrée"
      className="w-36 rounded-xl border border-foreground/45 bg-popover px-4 py-2.5 text-sm outline-none"
    />
  )
}

function Section({
  title,
  aside,
  children,
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5 backdrop-blur-sm sm:p-7">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-xl font-medium leading-none">{title}</h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </header>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */

export function ProductStudio({ initial, mode }: { initial: AdminProduct; mode: "create" | "edit" }) {
  const router = useRouter()
  const { products, createProduct, saveProduct, deleteProduct, settings, library } = useAdmin()
  const [draft, setDraft] = useState<AdminProduct>(initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  /** Dimensions réelles de la photo, pour prévenir avant publication. */
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const toggle = (key: "sizes" | "colors", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }))

  /* Conditions de publication — la même liste sert de garde-fou et de pense-bête. */
  const requirements = useMemo(
    () => [
      { done: draft.name.trim().length >= 4, label: "un nom commercial d'au moins 4 caractères" },
      { done: Boolean(draft.image), label: "au moins une photo" },
      { done: draft.price > 0, label: "un prix supérieur à zéro" },
      { done: draft.description.trim().length >= 20, label: "une description d'au moins 20 caractères" },
      { done: draft.sizes.length > 0, label: "au moins une taille" },
    ],
    [draft],
  )
  const missing = requirements.filter((r) => !r.done)
  const publishable = missing.length === 0
  const canSaveDraft = draft.name.trim().length > 0

  const discount =
    draft.originalPrice && draft.originalPrice > draft.price
      ? Math.round((1 - draft.price / draft.originalPrice) * 100)
      : 0

  const variantCount = draft.sizes.length * Math.max(1, draft.colors.length)

  /* Le vocabulaire vient de la page Configuration : grilles de tailles, coloris,
     matières et photothèque y sont tenus à jour une fois pour toutes. */
  const pastille = (color: string) => library.colors.find((c) => c.name === color)?.hex ?? "var(--muted)"

  // Les valeurs déjà enregistrées qui ne sont dans aucune liste restent visibles.
  const colorOptions = [...new Set([...library.colors.map((c) => c.name), ...draft.colors])]
  const sizeOptions = (() => {
    const connues = new Map<string, string>()
    for (const taille of library.sizes) connues.set(taille.value, taille.age)
    for (const taille of draft.sizes) if (!connues.has(taille)) connues.set(taille, "")
    return [...connues].map(([value, age]) => ({ value, label: value, note: age }))
  })()

  const addValue = (key: "sizes" | "colors", value: string) =>
    setDraft((d) => (d[key].includes(value) ? d : { ...d, [key]: [...d[key], value] }))

  const persist = (status: AdminProduct["status"]) => {
    const id = draft.id || slugify(draft.name) || `produit-${Date.now().toString(36)}`
    const sku =
      draft.sku || `${draft.category.slice(0, 3).toUpperCase()}-${String(products.length + 1).padStart(4, "0")}`
    const payload: AdminProduct = { ...draft, id, sku, status, updatedAt: new Date().toISOString() }

    if (mode === "create") createProduct(payload)
    else saveProduct(payload)

    setDraft(payload)
    setSaved(status === "publie" ? "Fiche publiée en boutique." : "Brouillon enregistré.")
    window.setTimeout(() => setSaved(null), 2600)
    if (mode === "create") router.push(`/admin/produits/${payload.id}`)
  }

  /* Le cadre de la boutique fait 3:4 : on mesure pour signaler ce qui sera rogné
     ou étiré, sans jamais laisser la photo décider de la taille de la vignette. */
  const mesurer = (src: string) => {
    const img = new window.Image()
    img.onload = () => setPhotoSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => setPhotoSize(null)
    img.src = src
  }

  const choisirImage = (src: string) => {
    set("image", src)
    mesurer(src)
  }

  /* Vues secondaires : dos, détail, porté. Elles défilent au survol de la carte
     en boutique et s'affichent en vignettes sur la fiche. */
  const ajouterVue = (src: string) =>
    setDraft((d) => (d.image === src || d.gallery.includes(src) ? d : { ...d, gallery: [...d.gallery, src] }))

  const retirerVue = (src: string) =>
    setDraft((d) => ({ ...d, gallery: d.gallery.filter((v) => v !== src) }))

  /** Une vue secondaire devient la photo principale, l'ancienne rejoint la galerie. */
  const promouvoir = (src: string) =>
    setDraft((d) => ({
      ...d,
      image: src,
      gallery: [...d.gallery.filter((v) => v !== src), ...(d.image ? [d.image] : [])],
    }))

  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      // Sans photo principale, le fichier déposé le devient ; sinon il complète la galerie.
      if (!draft.image) {
        set("image", src)
        mesurer(src)
      } else {
        ajouterVue(src)
      }
    }
    reader.readAsDataURL(file)
  }

  /* Seuils : en dessous de 800 px de large la photo est étirée dans la grille,
     et au delà de 15 % d'écart avec le 3:4 le recadrage devient visible. */
  const photoAlerte = (() => {
    if (!photoSize) return null
    const ratio = photoSize.w / photoSize.h
    if (photoSize.w < 800) {
      return `Photo de ${photoSize.w} × ${photoSize.h} px : elle sera agrandie et paraîtra floue. Visez 800 px de large au minimum.`
    }
    if (Math.abs(ratio - 0.75) > 0.15) {
      return `Format ${ratio > 0.75 ? "large" : "très allongé"} (${photoSize.w} × ${photoSize.h}) : le cadre 3:4 de la boutique en rognera ${ratio > 0.75 ? "les côtés" : "le haut et le bas"}.`
    }
    return null
  })()

  const categoryLabel = categories.find((c) => c.slug === draft.category)?.label ?? ""

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* -------------------------------------------------------- */}
      {/* En-tête                                                   */}
      {/* -------------------------------------------------------- */}
      <div className="mb-7">
        <Link
          href="/admin/produits"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux produits
        </Link>

        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h1 className="font-serif text-4xl font-medium leading-none">
              {mode === "create" ? "Nouveau produit" : draft.name || "Fiche produit"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "create"
                ? "Enregistré en brouillon tant que la fiche n'est pas complète."
                : `Référence ${draft.sku} · dernière modification le ${new Date(draft.updatedAt).toLocaleDateString("fr-FR")}`}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <ActionButton variant="outline" disabled={!canSaveDraft} onClick={() => persist("brouillon")}>
              Enregistrer en brouillon
            </ActionButton>
            <ActionButton variant="primary" disabled={!publishable} onClick={() => persist("publie")}>
              Publier en boutique
            </ActionButton>
          </div>
        </div>

        {saved && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-accent/12 px-4 py-2.5 text-sm text-[#4f6a49] animate-scale-fade-in">
            <Check className="h-4 w-4" /> {saved}
          </p>
        )}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------------------------------------ */}
        {/* Colonne principale                                      */}
        {/* ------------------------------------------------------ */}
        <div className="space-y-5">
          <Section title="Identité">
            <div className="space-y-5">
              <StackedField
                label="Nom commercial"
                placeholder="Robe chasuble rose à volant plumetis"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                hint="Ce que la cliente lit. Jamais un nom de fichier ni « Ensemble enfant-190 »."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <StackedSelect<CategorySlug>
                  label="Catégorie"
                  value={draft.category}
                  onChange={(value) => set("category", value)}
                  options={categories.map((c) => ({ value: c.slug, label: c.label }))}
                />
                <StackedField
                  label="Accroche"
                  placeholder="La robe des beaux jours"
                  value={draft.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  hint="Une ligne, sous le nom, sur la carte."
                />
              </div>

              <OptionPills<AgeGroup>
                label="Tranche d'âge"
                value={draft.age}
                onChange={(value) => set("age", value)}
                options={ageGroups.map((a) => ({ value: a.value, label: a.label }))}
              />

              <StackedTextarea
                label="Description"
                rows={3}
                maxLength={420}
                placeholder="Chasuble en satin rose, rosette froncée à l'épaule, bas de jupe en plumetis duveteux. Doublure coton, fermeture pression au dos."
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                hint="Matière, coupe, usage : ce qui rassure une maman avant d'ajouter au panier."
              />
            </div>
          </Section>

          <Section title="Photos" aside={draft.image ? "1 photo" : "aucune photo"}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                onFile(e.dataTransfer.files?.[0])
              }}
              className="flex flex-wrap gap-3"
            >
              {draft.image && (
                <div className="group relative h-[150px] w-[150px] overflow-hidden rounded-xl border border-border">
                  <Image
                    src={draft.image}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-cover"
                    unoptimized={draft.image.startsWith("data:")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      set("image", "")
                      setPhotoSize(null)
                    }}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground opacity-0 transition group-hover:opacity-100"
                    aria-label="Retirer la photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid h-[150px] w-[150px] place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
              >
                <span className="text-center">
                  <Plus className="mx-auto h-5 w-5" />
                  <span className="mt-1 block text-sm">Ajouter</span>
                </span>
              </button>

              <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {/* Vues secondaires */}
            {draft.gallery.length > 0 && (
              <div className="mt-4">
                <span className="mb-2 block text-sm font-medium">
                  Vues secondaires <span className="text-xs text-muted-foreground">({draft.gallery.length})</span>
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {draft.gallery.map((src) => (
                    <div key={src} className="group relative h-[92px] w-[92px] overflow-hidden rounded-xl border border-border">
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="92px"
                        className="object-cover"
                        unoptimized={src.startsWith("data:")}
                      />
                      <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-foreground/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => promouvoir(src)}
                          className="rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground"
                        >
                          Principale
                        </button>
                        <button
                          type="button"
                          onClick={() => retirerVue(src)}
                          aria-label="Retirer cette vue"
                          className="grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photoAlerte && (
              <p className="mt-3 flex gap-2 rounded-xl bg-[#C79A6B]/12 px-4 py-3 text-xs leading-relaxed text-[#7c6034]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {photoAlerte}
              </p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Quelle que soit sa taille, la photo est recadrée dans un cadre 3:4 : elle ne déforme jamais la vignette.
              Une fiche sans photo ne peut pas être publiée. Glissez un fichier sur la zone ou choisissez dans la
              photothèque.
            </p>

            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium">Photothèque</span>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12">
                {library.media.map(({ id, src }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => choisirImage(src)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 transition",
                      draft.image === src ? "border-foreground" : "border-transparent hover:border-border",
                    )}
                  >
                    <Image src={src} alt="" fill sizes="72px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Prix et stock">
            <div className="grid gap-5 sm:grid-cols-2">
              <StackedField
                label="Prix de vente"
                type="number"
                inputMode="numeric"
                placeholder="12 000"
                value={draft.price || ""}
                onChange={(e) => set("price", Number(e.target.value) || 0)}
                suffix={settings.currency}
                hint="En francs CFA, nombre entier."
              />
              <StackedField
                label="Stock initial"
                type="number"
                inputMode="numeric"
                placeholder="8"
                value={draft.stock || ""}
                onChange={(e) => set("stock", Math.max(0, Number(e.target.value) || 0))}
                hint={
                  draft.stock > 0 && draft.stock <= settings.lowStockThreshold
                    ? `Sous le seuil d'alerte (${settings.lowStockThreshold}).`
                    : "Réparti ensuite par variante."
                }
              />
            </div>
          </Section>

          <Section
            title="Variantes"
            aside={`${variantCount} variante${variantCount > 1 ? "s" : ""} générée${variantCount > 1 ? "s" : ""}`}
          >
            <div className="space-y-5">
              <div>
                <OptionPills
                  label="Couleurs"
                  multiple
                  value={draft.colors}
                  onChange={(value) => toggle("colors", value)}
                  options={colorOptions.map((color) => ({ value: color, label: color, swatch: pastille(color) }))}
                />
                <div className="mt-2">
                  <AddValuePill label="Autre coloris" onAdd={(value) => addValue("colors", value)} />
                </div>
              </div>
              <div>
                <OptionPills
                  label="Tailles"
                  multiple
                  value={draft.sizes}
                  onChange={(value) => toggle("sizes", value)}
                  options={sizeOptions}
                  hint={
                    <>
                      Les tailles viennent de la liste réglée dans Configuration. La ligne grise n&apos;est qu&apos;un
                      repère indicatif, jamais la taille elle-même.
                      {library.sizeGuide && (
                        <span className="mt-2 flex items-center gap-2">
                          <span className="relative h-9 w-9 overflow-hidden rounded-lg border border-border">
                            <Image
                              src={library.sizeGuide}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={library.sizeGuide.startsWith("data:")}
                            />
                          </span>
                          Un guide des tailles est disponible en boutique.
                        </span>
                      )}
                    </>
                  }
                />
                <div className="mt-2">
                  <AddValuePill label="Autre taille" onAdd={(value) => addValue("sizes", value)} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Informations produit">
            <div className="space-y-5">
              <div>
                <StackedTextarea
                  label="Matière"
                  rows={2}
                  maxLength={200}
                  placeholder="100% coton biologique, doux et respirant."
                  value={draft.matiere}
                  onChange={(e) => set("matiere", e.target.value)}
                />
                {library.materials.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Insérer :</span>
                    {library.materials.map((matiere) => (
                      <button
                        key={matiere}
                        type="button"
                        onClick={() =>
                          set("matiere", draft.matiere.trim() ? `${draft.matiere.trim()} ${matiere}` : matiere)
                        }
                        className="rounded-lg border border-border px-2.5 py-1 text-xs transition hover:border-foreground/40 hover:bg-secondary/60"
                      >
                        {matiere}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <StackedTextarea
                label="Livraison et retours"
                rows={3}
                value={draft.livraison}
                onChange={(e) => set("livraison", e.target.value)}
                hint="Pré-rempli avec les conditions de la boutique."
              />
            </div>
          </Section>

          {mode === "edit" && (
            <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-destructive/25 bg-destructive/5 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Supprimer ce produit</p>
                <p className="text-xs text-muted-foreground">
                  La fiche disparaît du catalogue. Les commandes passées la conservent.
                </p>
              </div>
              {confirmDelete ? (
                <>
                  <ActionButton variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Annuler
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    onClick={() => {
                      deleteProduct(draft.id)
                      router.push("/admin/produits")
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Confirmer
                  </ActionButton>
                </>
              ) : (
                <ActionButton variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Supprimer
                </ActionButton>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ */}
        {/* Colonne latérale                                        */}
        {/* ------------------------------------------------------ */}
        <div className="space-y-5 xl:sticky xl:top-24">
          <section className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Statut</h2>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  draft.status === "publie"
                    ? "bg-accent/20 text-[#4f6a49]"
                    : draft.status === "archive"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-[#C79A6B]/18 text-[#8a6a3f]",
                )}
              >
                {draft.status === "publie" ? "Publié" : draft.status === "archive" ? "Archivé" : "Brouillon"}
              </span>
            </div>

            {missing.length > 0 ? (
              <>
                <p className="mt-4 text-sm font-medium">Il manque encore :</p>
                <ul className="mt-2.5 space-y-2">
                  {missing.map((item) => (
                    <li key={item.label} className="flex gap-2.5 text-sm leading-snug text-foreground/85">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 flex gap-2 text-sm leading-snug">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Toutes les conditions de publication sont réunies.
              </p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Aperçu de la carte
            </h2>

            <div className="overflow-hidden rounded-xl">
              <div className="relative aspect-square">
                {draft.image ? (
                  <Image
                    src={draft.image}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-cover"
                    unoptimized={draft.image.startsWith("data:")}
                  />
                ) : (
                  <div
                    className="grid h-full place-items-end p-3 text-xs text-muted-foreground"
                    style={{
                      background:
                        "repeating-linear-gradient(135deg, var(--muted) 0 10px, var(--secondary) 10px 20px)",
                    }}
                  >
                    aucune photo
                  </div>
                )}
                {draft.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium">
                    {draft.badge}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 font-serif text-lg leading-tight">{draft.name || "Nom du produit"}</p>
            <p className="mt-1 flex items-baseline gap-2 font-serif text-lg">
              {draft.price > 0 ? formatPrice(draft.price) : "—"}
              {draft.originalPrice && draft.originalPrice > draft.price && (
                <span className="text-sm text-muted-foreground line-through">{formatPrice(draft.originalPrice)}</span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryLabel}
              {draft.sizes.length > 0 && ` · ${draft.sizes[0]} → ${draft.sizes[draft.sizes.length - 1]}`}
            </p>
          </section>

          <p className="flex gap-2.5 rounded-[1.5rem] border border-[#C79A6B]/35 bg-[#C79A6B]/10 p-4 text-xs leading-relaxed text-[#7c6034]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Les cinq conditions de publication sont vérifiées ici, dans le navigateur. Quand la boutique aura une API,
            elles devront l&apos;être une seconde fois côté serveur : sans cela, un appel direct pourra contourner le
            brouillon.
          </p>
        </div>
      </div>
    </div>
  )
}
