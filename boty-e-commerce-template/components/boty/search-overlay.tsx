"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Clock, CornerDownLeft, Search, Tag, X } from "lucide-react"
import { categories, formatPrice } from "@/lib/products"
import { chercherProduits, chercherRayons, RECHERCHES_FREQUENTES, surligner } from "@/lib/search"

const CLE_RECENTES = "mcm-recherches-recentes"
const MAX_RECENTES = 6

/** Un résultat mis en avant, produit ou rayon. */
type Element =
  | { type: "produit"; href: string; id: string; nom: string; rayon: string; prix: number; image: string }
  | { type: "rayon"; href: string; id: string; nom: string; description: string }

/** Le libellé, avec les lettres cherchées en gras. */
function Surligne({ texte, requete }: { texte: string; requete: string }) {
  return (
    <>
      {surligner(texte, requete).map((fragment, index) =>
        fragment.fort ? (
          <mark key={index} className="bg-primary/18 text-foreground">
            {fragment.texte}
          </mark>
        ) : (
          <span key={index}>{fragment.texte}</span>
        ),
      )}
    </>
  )
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [requete, setRequete] = useState("")
  const [recentes, setRecentes] = useState<string[]>([])
  const [curseur, setCurseur] = useState(0)
  const champ = useRef<HTMLInputElement>(null)

  // Lecture différée : le premier rendu doit rester identique serveur et client.
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_RECENTES)
      if (brut) setRecentes(JSON.parse(brut) as string[])
    } catch {
      /* stockage indisponible : on s'en passe */
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setRequete("")
    setCurseur(0)
    const t = window.setTimeout(() => champ.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open])

  // La page derrière ne doit pas défiler pendant la recherche.
  useEffect(() => {
    if (!open) return
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = avant
    }
  }, [open])

  const rayons = useMemo(() => chercherRayons(requete).slice(0, 2), [requete])
  const produits = useMemo(() => chercherProduits(requete, 24), [requete])

  const elements = useMemo<Element[]>(() => {
    const liste: Element[] = rayons.map((rayon) => ({
      type: "rayon",
      id: rayon.slug,
      href: `/shop?categorie=${rayon.slug}`,
      nom: rayon.label,
      description: rayon.description,
    }))
    for (const { product } of produits.slice(0, 6)) {
      liste.push({
        type: "produit",
        id: product.id,
        href: `/product/${product.id}`,
        nom: product.name,
        rayon: categories.find((c) => c.slug === product.category)?.label ?? product.category,
        prix: product.price,
        image: product.image,
      })
    }
    return liste
  }, [rayons, produits])

  useEffect(() => setCurseur(0), [requete])

  const memoriser = (valeur: string) => {
    const propre = valeur.trim()
    if (propre.length < 2) return
    const liste = [propre, ...recentes.filter((r) => r.toLowerCase() !== propre.toLowerCase())].slice(0, MAX_RECENTES)
    setRecentes(liste)
    try {
      window.localStorage.setItem(CLE_RECENTES, JSON.stringify(liste))
    } catch {
      /* ignoré */
    }
  }

  const ouvrir = (href: string) => {
    memoriser(requete)
    onClose()
    router.push(href)
  }

  const toutVoir = () => {
    memoriser(requete)
    onClose()
    router.push(`/shop?q=${encodeURIComponent(requete.trim())}`)
  }

  const auClavier = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setCurseur((c) => Math.min(c + 1, elements.length - 1))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setCurseur((c) => Math.max(c - 1, 0))
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const cible = elements[curseur]
      if (cible) ouvrir(cible.href)
      else if (requete.trim()) toutVoir()
    }
  }

  if (!open) return null

  const vide = requete.trim().length === 0

  return (
    <div className="fixed inset-0 z-[70] flex justify-center px-3 pt-[6dvh] sm:pt-[10dvh]" role="dialog" aria-modal="true" aria-label="Recherche">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-foreground/25 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer la recherche"
      />

      <div className="relative flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-border bg-popover shadow-[0_40px_90px_-40px_rgba(52,41,43,0.55)] animate-scale-fade-in">
        {/* Champ */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={champ}
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            onKeyDown={auClavier}
            placeholder="Une robe, un ensemble, une taille…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
            aria-label="Que cherchez-vous ?"
          />
          {requete && (
            <button
              type="button"
              onClick={() => {
                setRequete("")
                champ.current?.focus()
              }}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* --- Champ vide : on propose --- */}
          {vide && (
            <div className="space-y-6 px-5 py-5">
              {recentes.length > 0 && (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Vos dernières recherches
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentes([])
                        try {
                          window.localStorage.removeItem(CLE_RECENTES)
                        } catch {
                          /* ignoré */
                        }
                      }}
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Effacer
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentes.map((mot) => (
                      <button
                        key={mot}
                        type="button"
                        onClick={() => setRequete(mot)}
                        className="rounded-full border border-border px-3.5 py-1.5 text-sm transition hover:border-foreground/40 hover:bg-secondary/60"
                      >
                        {mot}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Recherches fréquentes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {RECHERCHES_FREQUENTES.map((mot) => (
                    <button
                      key={mot}
                      type="button"
                      onClick={() => setRequete(mot)}
                      className="rounded-full bg-secondary px-3.5 py-1.5 text-sm transition hover:bg-primary hover:text-primary-foreground"
                    >
                      {mot}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* --- Résultats --- */}
          {!vide && elements.length > 0 && (
            <div className="py-2">
              {elements.map((element, index) => {
                const actif = index === curseur
                return (
                  <button
                    key={`${element.type}-${element.id}`}
                    type="button"
                    onMouseEnter={() => setCurseur(index)}
                    onClick={() => ouvrir(element.href)}
                    className={`flex w-full items-center gap-3.5 px-5 py-2.5 text-left transition ${
                      actif ? "bg-secondary/70" : ""
                    }`}
                  >
                    {element.type === "produit" ? (
                      <>
                        <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={element.image} alt="" fill sizes="44px" className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            <Surligne texte={element.nom} requete={requete} />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{element.rayon}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(element.prix)}</span>
                      </>
                    ) : (
                      <>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Tag className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            Rayon <Surligne texte={element.nom} requete={requete} />
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {element.description}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* --- Rien trouvé --- */}
          {!vide && elements.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="font-serif text-lg">Rien pour « {requete.trim()} »</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                Essayez un mot plus court — le nom d&apos;une pièce, une couleur ou un âge.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {RECHERCHES_FREQUENTES.slice(0, 4).map((mot) => (
                  <button
                    key={mot}
                    type="button"
                    onClick={() => setRequete(mot)}
                    className="rounded-full bg-secondary px-3.5 py-1.5 text-sm transition hover:bg-primary hover:text-primary-foreground"
                  >
                    {mot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded border border-border px-1.5 py-0.5">↓</kbd> naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border px-1.5 py-0.5">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border px-1.5 py-0.5">esc</kbd> fermer
            </span>
          </p>
          <button
            type="button"
            onClick={toutVoir}
            disabled={vide || produits.length === 0}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-primary disabled:opacity-30"
          >
            {produits.length > 0 ? `Voir les ${produits.length} résultats` : "Voir la boutique"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
