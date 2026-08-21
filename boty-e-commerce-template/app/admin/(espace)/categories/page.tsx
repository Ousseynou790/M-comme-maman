"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Check, Edit3, ImagePlus, Link2, Plus, Trash2, X } from "lucide-react"
import { useAdmin } from "@/lib/admin/store"
import type { AdminCategory } from "@/lib/admin/types"
import {
  ActionButton,
  PageHeader,
  Panel,
  SideDrawer,
  StackedField,
  StackedTextarea,
  ToggleField,
} from "@/components/admin/ui"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const emptyCategory = (order: number): AdminCategory => ({
  id: `cat-${Date.now().toString(36)}`,
  slug: "",
  label: "",
  description: "",
  image: "",
  links: [],
  active: true,
  order,
})

export default function CategoriesPage() {
  const { categories, products, saveCategory, deleteCategory, library } = useAdmin()
  const [draft, setDraft] = useState<AdminCategory | null>(null)
  const [saved, setSaved] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const sorted = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft || draft.label.trim().length < 2) return
    // L'adresse du rayon découle du libellé : plus rien à saisir à la main.
    saveCategory({
      ...draft,
      label: draft.label.trim(),
      slug: draft.slug || slugify(draft.label),
      description: draft.description.trim(),
    })
    setDraft(null)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const onFile = (file: File | undefined) => {
    if (!file || !draft) return
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => (d ? { ...d, image: String(reader.result) } : d))
    reader.readAsDataURL(file)
  }

  const toggleLink = (slug: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            links: (d.links ?? []).includes(slug)
              ? (d.links ?? []).filter((s) => s !== slug)
              : [...(d.links ?? []), slug],
          }
        : d,
    )

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Catégories"
        description="Les rayons de la boutique, leur visuel et les rayons auxquels ils se rattachent."
      >
        <ActionButton variant="primary" onClick={() => setDraft(emptyCategory(categories.length + 1))}>
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </ActionButton>
      </PageHeader>

      {saved && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-accent/15 px-4 py-3 text-sm text-[#4f6a49]">
          <Check className="h-4 w-4" /> Catégorie enregistrée.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((category) => {
          const productCount = products.filter((product) => product.category === category.slug).length
          const linked = (category.links ?? [])
            .map((slug) => categories.find((c) => c.slug === slug)?.label)
            .filter(Boolean) as string[]

          return (
            <article
              key={category.id}
              className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-popover/80 transition hover:border-primary/40"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized={category.image.startsWith("data:")}
                  />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-muted-foreground">
                    Aucun visuel
                  </span>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    category.active ? "bg-accent/90 text-accent-foreground" : "bg-foreground/80 text-background"
                  }`}
                >
                  {category.active ? "Visible" : "Masquée"}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg leading-tight">{category.label}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {productCount} produit{productCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setDraft({ ...category })}
                      className="grid h-8 w-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary"
                      aria-label={`Modifier ${category.label}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => productCount === 0 && deleteCategory(category.id)}
                      disabled={productCount > 0}
                      title={productCount ? "Retirez d'abord les produits de ce rayon" : "Supprimer"}
                      className="grid h-8 w-8 place-items-center rounded-full text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label={`Supprimer ${category.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
                )}

                {linked.length > 0 && (
                  <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Link2 className="h-3 w-3 shrink-0" />
                    {linked.map((label) => (
                      <span key={label} className="rounded-full bg-secondary px-2 py-0.5">
                        {label}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <SideDrawer
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.label || "Nouvelle catégorie"}
        subtitle="Nom, visuel, rayons liés et visibilité"
      >
        {draft && (
          <form onSubmit={submit} className="space-y-6">
            <StackedField
              label="Nom du rayon"
              placeholder="Chaussures"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              hint={draft.label ? `Adresse en boutique : /shop?categorie=${slugify(draft.label)}` : undefined}
            />

            <StackedTextarea
              label="Description"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              hint="Une ligne, affichée sous le titre du rayon en boutique."
            />

            {/* Visuel */}
            <div>
              <span className="mb-2 block text-sm font-medium">Photo du rayon</span>
              <div className="flex gap-3">
                <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  {draft.image ? (
                    <>
                      <Image
                        src={draft.image}
                        alt=""
                        fill
                        sizes="104px"
                        className="object-cover"
                        unoptimized={draft.image.startsWith("data:")}
                      />
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, image: "" })}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"
                        aria-label="Retirer la photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="grid h-full w-full place-items-center text-muted-foreground transition hover:text-foreground"
                    >
                      <span className="text-center">
                        <ImagePlus className="mx-auto h-5 w-5" />
                        <span className="mt-1 block text-[11px]">Choisir</span>
                      </span>
                    </button>
                  )}
                </div>

                {/* Photothèque partagée, tenue à jour depuis Configuration */}
                <div className="grid max-h-[140px] flex-1 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4">
                  {library.media.map(({ id, src, name }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDraft({ ...draft, image: src })}
                      title={name}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        draft.image === src ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="60px"
                        className="object-cover"
                        unoptimized={src.startsWith("data:")}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {/* Rayons liés */}
            <div>
              <span className="mb-1.5 block text-sm font-medium">Rayons liés</span>
              <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
                Un rayon transversal se rattache à plusieurs autres : des chaussures existent pour les filles, les
                garçons et les bébés. Le lien fonctionne dans les deux sens.
              </p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.slug !== draft.slug)
                  .map((c) => {
                    const active = (draft.links ?? []).includes(c.slug)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleLink(c.slug)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm transition ${
                          active
                            ? "border-foreground bg-foreground font-medium text-background"
                            : "border-border hover:border-foreground/40"
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {c.label}
                      </button>
                    )
                  })}
              </div>
            </div>

            <ToggleField
              label="Afficher dans la boutique"
              description="Un rayon masqué reste modifiable ici."
              checked={draft.active}
              onChange={(active) => setDraft({ ...draft, active })}
            />

            <ActionButton type="submit" variant="primary" className="w-full" disabled={draft.label.trim().length < 2}>
              <Check className="h-4 w-4" /> Enregistrer
            </ActionButton>
          </form>
        )}
      </SideDrawer>
    </>
  )
}
