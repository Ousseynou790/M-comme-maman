"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, Eye, ImagePlus, Monitor, RotateCcw, Smartphone, X } from "lucide-react"
import { Hero } from "@/components/boty/hero"
import { useAdmin } from "@/lib/admin/store"
import { HERO_MODELES, HERO_PAR_DEFAUT, heroUtilisable, type HeroConfig, type HeroTemplate } from "@/lib/hero"
import { ActionButton, StackedField, StackedTextarea, ToggleField } from "./ui"

/* ------------------------------------------------------------------ */
/* Vignettes de modèles : un schéma vaut mieux qu'un nom               */
/* ------------------------------------------------------------------ */

function Schema({ template }: { template: HeroTemplate }) {
  if (template === "editorial") {
    return (
      <span className="flex h-full w-full gap-1.5 p-2">
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className="h-1 w-4 rounded-full bg-foreground/25" />
          <span className="h-2 w-full rounded bg-foreground/45" />
          <span className="h-1 w-3/4 rounded-full bg-foreground/20" />
        </span>
        <span className="w-[46%] rounded bg-foreground/30" />
      </span>
    )
  }
  if (template === "collection") {
    return (
      <span className="flex h-full w-full flex-col items-center gap-1.5 p-2">
        <span className="h-2 w-2/3 rounded bg-foreground/45" />
        <span className="h-1 w-1/2 rounded-full bg-foreground/20" />
        <span className="mt-0.5 flex w-full flex-1 items-end gap-1">
          <span className="h-[75%] flex-1 rounded bg-foreground/30" />
          <span className="h-full flex-1 rounded bg-foreground/30" />
          <span className="h-[60%] flex-1 rounded bg-foreground/30" />
        </span>
      </span>
    )
  }
  return (
    <span className="relative flex h-full w-full items-end bg-foreground/30 p-2">
      <span className="flex w-full flex-col gap-1">
        <span className="h-1 w-5 rounded-full bg-white/70" />
        <span className="h-2 w-4/5 rounded bg-white/85" />
        <span className="h-1 w-1/2 rounded-full bg-white/60" />
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Aperçu : la vitrine réelle, réduite à la largeur du panneau         */
/* ------------------------------------------------------------------ */

/** Les deux largeurs de référence de l'aperçu. */
const LARGEURS = { bureau: 1280, mobile: 390 } as const
type Support = keyof typeof LARGEURS

function Apercu({ config }: { config: HeroConfig }) {
  const cadre = useRef<HTMLDivElement>(null)
  const contenu = useRef<HTMLDivElement>(null)
  const [support, setSupport] = useState<Support>("bureau")
  const [echelle, setEchelle] = useState(0.5)
  const [hauteur, setHauteur] = useState(360)

  // Sur un petit écran, montrer la version bureau n'apprend rien : on ouvre
  // directement sur la vue mobile.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setSupport("mobile")
  }, [])

  useEffect(() => {
    const element = cadre.current
    if (!element) return
    const mesurer = () => {
      // L'aperçu mobile ne dépasse jamais sa taille réelle : au-delà, il
      // paraîtrait plus grand qu'un téléphone.
      const facteur = Math.min(element.clientWidth / LARGEURS[support], support === "mobile" ? 1 : Infinity)
      setEchelle(facteur)
      const brute = contenu.current?.firstElementChild?.getBoundingClientRect().height
      if (brute) setHauteur(brute)
    }
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(element)
    // La hauteur du bandeau change avec le modèle et le texte.
    const t = window.setTimeout(mesurer, 140)
    return () => {
      observateur.disconnect()
      window.clearTimeout(t)
    }
  }, [config, support])

  const largeur = LARGEURS[support]

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 text-muted-foreground" /> Aperçu de la boutique
        </p>
        <div className="flex gap-1 rounded-full bg-secondary p-1">
          {(Object.keys(LARGEURS) as Support[]).map((valeur) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setSupport(valeur)}
              aria-pressed={support === valeur}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                support === valeur ? "bg-foreground font-medium text-background" : "text-muted-foreground"
              }`}
            >
              {valeur === "bureau" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
              {valeur === "bureau" ? "Ordinateur" : "Téléphone"}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={cadre}
        className="overflow-hidden rounded-2xl border border-border bg-background"
        style={support === "mobile" ? { maxWidth: largeur, marginInline: "auto" } : undefined}
      >
        <div style={{ height: hauteur * echelle }} className="relative">
          {/* Aperçu inerte : les liens de la vitrine ne doivent pas emmener ailleurs. */}
          <div
            ref={contenu}
            className="pointer-events-none absolute left-0 top-0 origin-top-left"
            style={{ width: largeur, transform: `scale(${echelle})` }}
          >
            <Hero config={config} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function HeroStudio() {
  const { hero, updateHero, library } = useAdmin()
  const [draft, setDraft] = useState<HeroConfig>(hero)
  const [saved, setSaved] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)

  // Le panneau suit l'état enregistré quand il change ailleurs.
  useEffect(() => setDraft(hero), [hero])

  const dirty = JSON.stringify(draft) !== JSON.stringify(hero)
  const set = <K extends keyof HeroConfig["slide"]>(key: K, value: HeroConfig["slide"][K]) =>
    setDraft((d) => ({ ...d, slide: { ...d.slide, [key]: value } }))

  const enregistrer = () => {
    updateHero(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const importer = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set("image", String(reader.result))
    reader.readAsDataURL(file)
  }

  const annonceActive = heroUtilisable(draft)

  return (
    <section className="rounded-[1.5rem] border border-border/70 bg-popover/80 p-5 sm:p-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl leading-tight">Bandeau d&apos;accueil</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            La première chose que voit une visiteuse. Mettez en avant une collection ou une promotion — sinon, les
            modèles livrés avec le site défilent tout seuls.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="ghost" disabled={!dirty} onClick={() => setDraft(hero)}>
            Annuler
          </ActionButton>
          <ActionButton variant="primary" disabled={!dirty} onClick={enregistrer}>
            <Check className="h-4 w-4" /> Enregistrer le bandeau
          </ActionButton>
        </div>
      </header>

      {saved && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-accent/12 px-4 py-3 text-sm text-[#4f6a49]">
          <Check className="h-4 w-4" /> Bandeau enregistré. La boutique l&apos;affiche déjà.
        </p>
      )}

      {/* Modèle de mise en page */}
      <div className="mb-6">
        <span className="mb-2.5 block text-sm font-medium">Mise en page</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {HERO_MODELES.map((modele) => {
            const actif = draft.template === modele.value
            return (
              <button
                key={modele.value}
                type="button"
                onClick={() => setDraft({ ...draft, template: modele.value })}
                aria-pressed={actif}
                className={`rounded-2xl border p-3 text-left transition ${
                  actif ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/40"
                }`}
              >
                <span
                  className={`block h-16 overflow-hidden rounded-xl ${actif ? "bg-background" : "bg-secondary/60"}`}
                >
                  <Schema template={modele.value} />
                </span>
                <span className="mt-2.5 flex items-center gap-1.5 text-sm font-medium">
                  {actif && <Check className="h-3.5 w-3.5 text-primary" />}
                  {modele.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {modele.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <ToggleField
        label="Mettre en avant mon annonce"
        description="Désactivé, la boutique fait défiler les trois modèles livrés avec le site."
        checked={draft.custom}
        onChange={(custom) => setDraft({ ...draft, custom })}
      />

      {!draft.custom && (
        <div className="mt-4 rounded-2xl bg-secondary/45 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Annonces par défaut</p>
          <ul className="mt-2 space-y-1 text-sm">
            {HERO_PAR_DEFAUT.map((modele) => (
              <li key={modele.title} className="flex gap-2">
                <span className="text-muted-foreground">·</span>
                <span>
                  <span className="font-medium">{modele.title}</span>{" "}
                  <span className="text-muted-foreground">— {modele.eyebrow}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.custom && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <StackedField
              label="Surtitre"
              placeholder="Nouvelle collection · Tabaski 2026"
              value={draft.slide.eyebrow}
              onChange={(e) => set("eyebrow", e.target.value)}
              hint="La petite ligne au-dessus du titre."
            />
            <StackedField
              label="Étiquette sur la photo"
              placeholder="Collection soleil"
              value={draft.slide.accent}
              onChange={(e) => set("accent", e.target.value)}
              hint="Facultative. Le nom de la pièce ou de la série."
            />
          </div>

          <StackedField
            label="Titre"
            placeholder="Des looks qui suivent leurs aventures."
            value={draft.slide.title}
            onChange={(e) => set("title", e.target.value)}
            hint="Court et parlant : c'est la phrase la plus lue de la boutique."
          />

          <StackedTextarea
            label="Texte"
            rows={2}
            maxLength={200}
            value={draft.slide.copy}
            onChange={(e) => set("copy", e.target.value)}
          />

          {/* Photo */}
          <div>
            <span className="mb-2 block text-sm font-medium">Photo</span>
            <div className="flex gap-3">
              <div className="relative h-[104px] w-[140px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                {draft.slide.image ? (
                  <>
                    <Image
                      src={draft.slide.image}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover"
                      unoptimized={draft.slide.image.startsWith("data:")}
                    />
                    <button
                      type="button"
                      onClick={() => set("image", "")}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"
                      aria-label="Retirer la photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fichier.current?.click()}
                    className="grid h-full w-full place-items-center text-muted-foreground transition hover:text-foreground"
                  >
                    <span className="text-center">
                      <ImagePlus className="mx-auto h-5 w-5" />
                      <span className="mt-1 block text-[11px]">Importer</span>
                    </span>
                  </button>
                )}
              </div>

              {/* Photothèque partagée, tenue à jour depuis Configuration */}
              <div className="grid max-h-[140px] flex-1 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-6">
                {library.media.map(({ id, src, name }) => (
                  <button
                    key={id}
                    type="button"
                    title={name}
                    onClick={() => set("image", src)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                      draft.slide.image === src ? "border-primary" : "border-transparent hover:border-border"
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
            <input
              ref={fichier}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                importer(e.target.files?.[0])
                e.target.value = ""
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Une photo large et lumineuse fonctionne mieux : elle est recadrée en bandeau.
            </p>
          </div>

          {/* Boutons */}
          <div className="grid gap-5 lg:grid-cols-2">
            <StackedField
              label="Bouton principal"
              placeholder="Découvrir la collection"
              value={draft.slide.ctaLabel}
              onChange={(e) => set("ctaLabel", e.target.value)}
            />
            <StackedField
              label="Vers quelle page"
              placeholder="/shop?categorie=filles"
              value={draft.slide.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              hint="Adresse interne : /shop, /shop?promo=1, /shop?categorie=bebes."
            />
            <StackedField
              label="Bouton secondaire"
              placeholder="Voir les nouveautés"
              value={draft.slide.secondaryLabel}
              onChange={(e) => set("secondaryLabel", e.target.value)}
              hint="Laissez vide pour n'afficher qu'un seul bouton."
            />
            <StackedField
              label="Vers quelle page"
              placeholder="/shop"
              value={draft.slide.secondaryHref}
              onChange={(e) => set("secondaryHref", e.target.value)}
            />
          </div>

          {!annonceActive && (
            <p className="rounded-xl bg-[#C79A6B]/12 px-4 py-3 text-xs leading-relaxed text-[#7c6034]">
              Sans titre, l&apos;annonce ne peut pas s&apos;afficher : la boutique montrera les modèles par défaut.
            </p>
          )}

          <button
            type="button"
            onClick={() => setDraft({ ...draft, slide: { ...HERO_PAR_DEFAUT[0] } })}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Repartir du modèle « Nouvelle collection »
          </button>
        </div>
      )}

      {/* Aperçu */}
      <div className="mt-7">
        <Apercu config={draft} />
      </div>
    </section>
  )
}
