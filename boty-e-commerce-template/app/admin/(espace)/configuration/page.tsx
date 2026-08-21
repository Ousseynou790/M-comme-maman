"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Check, Cloud, ImagePlus, Palette, Plus, Ruler, Scissors, Trash2, X } from "lucide-react"
import { useAdmin } from "@/lib/admin/store"
import type { AdminColor, MediaItem, SizeValue } from "@/lib/admin/types"
import { ActionButton, EmptyState, PageHeader } from "@/components/admin/ui"

type Onglet = "tailles" | "couleurs" | "matieres" | "photos"

const ONGLETS: { value: Onglet; label: string; icone: typeof Ruler; aide: string }[] = [
  { value: "tailles", label: "Tailles", icone: Ruler, aide: "Les grilles proposées sur la fiche produit" },
  { value: "couleurs", label: "Couleurs", icone: Palette, aide: "Les coloris et leur pastille" },
  { value: "matieres", label: "Matières", icone: Scissors, aide: "Les compositions à insérer en un clic" },
  { value: "photos", label: "Photothèque", icone: ImagePlus, aide: "Les visuels des fiches et des rayons" },
]

/* ------------------------------------------------------------------ */
/* Petites briques                                                     */
/* ------------------------------------------------------------------ */

/** Une liste de valeurs courtes : on retire d'un clic, on ajoute au clavier. */
function ListeEtiquettes({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [saisie, setSaisie] = useState("")

  const ajouter = () => {
    const valeur = saisie.trim()
    if (!valeur || values.includes(valeur)) {
      setSaisie("")
      return
    }
    onChange([...values, valeur])
    setSaisie("")
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-1.5 pl-3 pr-1.5 text-sm"
        >
          {value}
          <button
            type="button"
            onClick={() => onChange(values.filter((v) => v !== value))}
            className="grid h-5 w-5 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Retirer ${value}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <span className="inline-flex items-center gap-1 rounded-xl border border-dashed border-border py-1 pl-2.5 pr-1">
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              ajouter()
            }
          }}
          placeholder={placeholder}
          className="w-[124px] bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!saisie.trim()}
          className="grid h-6 w-6 place-items-center rounded-lg bg-foreground text-background transition disabled:opacity-25"
          aria-label="Ajouter"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

/**
 * Les tailles d'une grille.
 *
 * Une taille est ce qui est imprimé sur l'étiquette — une lettre ou un nombre.
 * L'âge n'en fait pas partie : il l'accompagne en correspondance, pour guider
 * la cliente sans usurper la place de la taille.
 */
function ListeTailles({ values, onChange }: { values: SizeValue[]; onChange: (values: SizeValue[]) => void }) {
  const [valeur, setValeur] = useState("")
  const [age, setAge] = useState("")

  const ajouter = () => {
    const propre = valeur.trim()
    if (!propre || values.some((t) => t.value.toLowerCase() === propre.toLowerCase())) {
      setValeur("")
      setAge("")
      return
    }
    onChange([...values, { value: propre, age: age.trim() }])
    setValeur("")
    setAge("")
  }

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {values.map((taille) => (
        <span
          key={taille.value}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 py-1.5 pl-3 pr-1.5"
        >
          <span className="text-left">
            <span className="block text-sm font-semibold leading-tight">{taille.value}</span>
            {taille.age && (
              <span className="mt-0.5 block text-[10px] leading-none text-muted-foreground">{taille.age}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onChange(values.filter((t) => t.value !== taille.value))}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Retirer la taille ${taille.value}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <span className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border py-1 pl-2.5 pr-1">
        <input
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              ajouter()
            }
          }}
          placeholder="S"
          aria-label="Taille"
          className="w-[58px] bg-transparent py-2 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
        />
        <span className="text-xs text-muted-foreground">≈</span>
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              ajouter()
            }
          }}
          placeholder="repère"
          aria-label="Repère indicatif, facultatif"
          className="w-[84px] bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!valeur.trim()}
          className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background transition disabled:opacity-25"
          aria-label="Ajouter la taille"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

/** Le visuel du guide des tailles rattaché à une grille. */
function ChoixGuide({
  valeur,
  media,
  onChange,
}: {
  valeur: string
  media: MediaItem[]
  onChange: (src: string) => void
}) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {valeur ? (
            <Image
              src={valeur}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              unoptimized={valeur.startsWith("data:")}
            />
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Guide des tailles</p>
          <p className="text-xs text-muted-foreground">
            {valeur ? "Visuel associé à cette grille." : "Un schéma ou une photo de mesures, facultatif."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs transition hover:border-foreground/40"
        >
          {ouvert ? "Fermer" : valeur ? "Changer" : "Choisir"}
        </button>
        {valeur && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
            aria-label="Retirer le guide"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {ouvert && (
        <div className="mt-3 grid max-h-[140px] grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
          {media.map(({ id, src, name }) => (
            <button
              key={id}
              type="button"
              title={name}
              onClick={() => {
                onChange(src)
                setOuvert(false)
              }}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                valeur === src ? "border-primary" : "border-transparent hover:border-border"
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
      )}
    </div>
  )
}

/** Cadre d'une rubrique de la page. */
function Bloc({
  titre,
  aide,
  action,
  children,
}: {
  titre: string
  aide: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl leading-tight">{titre}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{aide}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ConfigurationPage() {
  const {
    library,
    products,
    categories,
    saveSizes,
    setSizeGuide,
    saveColor,
    deleteColor,
    setMaterials,
    addMedia,
    removeMedia,
  } = useAdmin()

  const [onglet, setOnglet] = useState<Onglet>("tailles")
  const [nouvelleCouleur, setNouvelleCouleur] = useState({ name: "", hex: "#e0654e" })
  const fileInput = useRef<HTMLInputElement>(null)

  const compteurs: Record<Onglet, number> = {
    tailles: library.sizes.length,
    couleurs: library.colors.length,
    matieres: library.materials.length,
    photos: library.media.length,
  }

  /** Combien de fiches emploient chaque coloris. */
  const usageCouleur = useMemo(() => {
    const total = new Map<string, number>()
    for (const product of products) {
      for (const color of product.colors) total.set(color, (total.get(color) ?? 0) + 1)
    }
    return total
  }, [products])

  /** Combien de fiches ou de rayons emploient chaque image. */
  const usageImage = useMemo(() => {
    const total = new Map<string, number>()
    const compter = (src: string) => total.set(src, (total.get(src) ?? 0) + 1)
    for (const product of products) {
      if (product.image) compter(product.image)
      for (const vue of product.gallery ?? []) compter(vue)
    }
    for (const category of categories) if (category.image) compter(category.image)
    return total
  }, [products, categories])

  /* Il n'y a pas de bouton « Enregistrer » : chaque modification part
     directement dans le stockage. Ce témoin le dit, sinon on cherche. */
  const [temoin, setTemoin] = useState(false)
  const premierRendu = useRef(true)
  const empreinte = JSON.stringify(library)
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false
      return
    }
    setTemoin(true)
    const t = window.setTimeout(() => setTemoin(false), 2000)
    return () => window.clearTimeout(t)
  }, [empreinte])

  const ajouterCouleur = () => {
    const name = nouvelleCouleur.name.trim()
    if (name.length < 2) return
    saveColor({ id: `col-${Date.now().toString(36)}`, name, hex: nouvelleCouleur.hex })
    setNouvelleCouleur({ name: "", hex: "#e0654e" })
  }

  const importer = (files: FileList | null) => {
    if (!files?.length) return
    const lectures = [...files].map(
      (file) =>
        new Promise<{ src: string; name: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ src: String(reader.result), name: file.name.replace(/\.[^.]+$/, "") })
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    )
    Promise.all(lectures).then(addMedia).catch(() => undefined)
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Configuration"
        description="Le vocabulaire de la boutique : tailles, coloris, matières et photothèque, réutilisés par toutes les fiches."
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs transition ${
            temoin ? "bg-accent/15 text-[#4f6a49]" : "bg-secondary text-muted-foreground"
          }`}
          aria-live="polite"
        >
          {temoin ? <Check className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
          {temoin ? "Enregistré" : "Enregistrement automatique"}
        </span>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[232px_1fr]">
        {/* Rail des rubriques */}
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:h-fit lg:flex-col lg:overflow-visible lg:pb-0">
          {ONGLETS.map((item) => {
            const actif = onglet === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setOnglet(item.value)}
                aria-pressed={actif}
                className={`flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition lg:w-full ${
                  actif
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                <item.icone className={`h-4 w-4 shrink-0 ${actif ? "text-[#ef9d82]" : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                    actif ? "bg-background/20" : "bg-secondary"
                  }`}
                >
                  {compteurs[item.value]}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0">
          {/* ---------------- Tailles ---------------- */}
          {onglet === "tailles" && (
            <Bloc
              titre="Tailles"
              aide="La liste des tailles de la boutique. Une taille est une lettre ou un nombre — elle ne dépend ni d'un rayon ni d'un âge."
            >
              <div className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Tailles enregistrées ({library.sizes.length})
                </span>
                <ListeTailles values={library.sizes} onChange={saveSizes} />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Le champ de droite est un simple repère, facultatif : « S » peut convenir vers 2 ans sans que
                  « 2 ans » devienne une taille. Tapez la taille puis <kbd className="rounded border border-border px-1">Entrée</kbd>,
                  ou cliquez sur le +. C&apos;est enregistré aussitôt.
                </p>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-popover/80 p-5">
                <ChoixGuide valeur={library.sizeGuide} media={library.media} onChange={setSizeGuide} />
              </div>
            </Bloc>
          )}

          {/* ---------------- Couleurs ---------------- */}
          {onglet === "couleurs" && (
            <Bloc
              titre="Coloris"
              aide="Le nom lu par la cliente et la pastille affichée sur la fiche. Cliquez sur la pastille pour changer la teinte."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {library.colors.map((color) => (
                  <CarteCouleur
                    key={color.id}
                    color={color}
                    usage={usageCouleur.get(color.name) ?? 0}
                    onChange={saveColor}
                    onDelete={() => deleteColor(color.id)}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-dashed border-border p-4">
                <label
                  className="relative h-10 w-10 shrink-0 cursor-pointer rounded-full ring-1 ring-inset ring-black/10"
                  style={{ background: nouvelleCouleur.hex }}
                  aria-label="Teinte du nouveau coloris"
                >
                  <input
                    type="color"
                    value={nouvelleCouleur.hex}
                    onChange={(e) => setNouvelleCouleur((c) => ({ ...c, hex: e.target.value }))}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <input
                  value={nouvelleCouleur.name}
                  onChange={(e) => setNouvelleCouleur((c) => ({ ...c, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && ajouterCouleur()}
                  placeholder="Nom du coloris — Terracotta…"
                  className="min-w-[180px] flex-1 rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition focus:border-foreground"
                />
                <ActionButton
                  variant="primary"
                  onClick={ajouterCouleur}
                  disabled={nouvelleCouleur.name.trim().length < 2}
                >
                  <Plus className="h-4 w-4" /> Ajouter
                </ActionButton>
              </div>
            </Bloc>
          )}

          {/* ---------------- Matières ---------------- */}
          {onglet === "matieres" && (
            <Bloc
              titre="Matières"
              aide="Proposées en saisie rapide sous le champ « Matière » de la fiche produit."
            >
              <div className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5">
                <ListeEtiquettes
                  values={library.materials}
                  onChange={setMaterials}
                  placeholder="Popeline de coton"
                />
              </div>
            </Bloc>
          )}

          {/* ---------------- Photothèque ---------------- */}
          {onglet === "photos" && (
            <Bloc
              titre="Photothèque"
              aide="Les visuels disponibles au moment de créer une fiche ou d'habiller un rayon."
              action={
                <ActionButton variant="primary" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Importer des photos
                </ActionButton>
              }
            >
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  importer(e.target.files)
                  e.target.value = ""
                }}
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {library.media.map((item) => {
                  const usage = usageImage.get(item.src) ?? 0
                  return (
                    <figure key={item.id} className="group overflow-hidden rounded-2xl border border-border/70">
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={item.src}
                          alt={item.name}
                          fill
                          sizes="200px"
                          className="object-cover"
                          unoptimized={item.src.startsWith("data:")}
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(item.id)}
                          disabled={usage > 0}
                          title={
                            usage > 0
                              ? "Cette image est utilisée : retirez-la d'abord des fiches concernées."
                              : "Retirer de la photothèque"
                          }
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:text-muted-foreground"
                          aria-label={`Retirer ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {usage > 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                            {usage} usage{usage > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <figcaption className="truncate px-2.5 py-2 text-[11px] text-muted-foreground">
                        {item.name}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>

              {library.media.length === 0 && (
                <EmptyState
                  title="Photothèque vide"
                  description="Importez vos visuels : ils seront proposés à la création d'une fiche produit et d'un rayon."
                />
              )}

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Les photos importées ici restent dans ce navigateur. Le jour où la boutique aura un serveur, elles
                partiront vers un espace de stockage et seront visibles depuis n&apos;importe quel poste.
              </p>
            </Bloc>
          )}
        </div>
      </div>
    </>
  )
}

/** Une ligne de la palette : pastille, nom, usage, suppression. */
function CarteCouleur({
  color,
  usage,
  onChange,
  onDelete,
}: {
  color: AdminColor
  usage: number
  onChange: (color: AdminColor) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-popover/80 p-3">
      <label
        className="relative h-11 w-11 shrink-0 cursor-pointer rounded-full ring-1 ring-inset ring-black/10"
        style={{ background: color.hex }}
        aria-label={`Teinte de ${color.name}`}
      >
        <input
          type="color"
          value={color.hex}
          onChange={(e) => onChange({ ...color, hex: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <div className="min-w-0 flex-1">
        <input
          value={color.name}
          onChange={(e) => onChange({ ...color, name: e.target.value })}
          className="w-full rounded-lg bg-transparent text-sm outline-none focus:bg-secondary/50 focus:px-2"
          aria-label="Nom du coloris"
        />
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {usage > 0 ? `${usage} fiche${usage > 1 ? "s" : ""}` : "Jamais employé"} · {color.hex}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={usage > 0}
        title={usage > 0 ? "Ce coloris est employé par des fiches produit." : "Supprimer le coloris"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:text-muted-foreground/40"
        aria-label={`Supprimer ${color.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
