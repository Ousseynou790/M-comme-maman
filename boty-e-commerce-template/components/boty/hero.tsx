"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDownRight, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { HERO_APPUIS, heroSlides, type HeroConfig, type HeroSlide } from "@/lib/hero"
import { useHeroConfig } from "./use-hero-config"

/* ------------------------------------------------------------------ */
/* Briques communes aux trois modèles                                  */
/* ------------------------------------------------------------------ */

function Boutons({ slide, clair }: { slide: HeroSlide; clair?: boolean }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2.5">
      <Link
        href={slide.ctaHref || "/shop"}
        className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-xs font-semibold transition hover:-translate-y-1 sm:text-sm ${
          clair ? "bg-white text-foreground hover:bg-primary hover:text-white" : "bg-foreground text-background hover:bg-primary"
        }`}
      >
        {slide.ctaLabel || "Découvrir la collection"}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </Link>
      {slide.secondaryLabel && (
        <Link
          href={slide.secondaryHref || "/shop"}
          className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-3 text-xs font-semibold backdrop-blur-sm transition sm:text-sm ${
            clair
              ? "border-white/50 text-white hover:bg-white/15"
              : "border-foreground/25 bg-white/20 hover:bg-white/45"
          }`}
        >
          {slide.secondaryLabel}
          <ArrowDownRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

/** Pagination : une barre par annonce, la barre active se remplit. */
function Pagination({
  slides,
  active,
  onPick,
  clair,
}: {
  slides: HeroSlide[]
  active: number
  onPick: (index: number) => void
  clair?: boolean
}) {
  if (slides.length < 2) return null
  return (
    <div className="flex items-center gap-2" aria-label="Choisir une annonce">
      {slides.map((item, index) => (
        <button
          key={item.title}
          onClick={() => onPick(index)}
          aria-label={`Voir l'annonce ${index + 1}`}
          /* La barre reste fine, mais le bouton fait 32 px de haut : au doigt,
             une cible de 6 px est inatteignable. */
          className="group grid h-8 place-items-center px-0.5"
        >
          <span
            className={`relative block h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
              index === active ? "w-12" : "w-5 group-hover:opacity-70"
            } ${clair ? "bg-white/35" : "bg-foreground/25"}`}
          >
            {index === active && (
              <span
                key={`progress-${active}`}
                className={`hero-progress absolute inset-y-0 left-0 ${clair ? "bg-white" : "bg-foreground"}`}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

function Fleches({ onMove, clair }: { onMove: (direction: number) => void; clair?: boolean }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onMove(-1)}
        aria-label="Annonce précédente"
        className={`grid h-10 w-10 place-items-center rounded-full border backdrop-blur transition ${
          clair ? "border-white/40 text-white hover:bg-white/20" : "border-foreground/20 bg-white/25 hover:bg-white/60"
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onMove(1)}
        aria-label="Annonce suivante"
        className={`grid h-10 w-10 place-items-center rounded-full transition hover:scale-105 ${
          clair ? "bg-white text-foreground" : "bg-foreground text-background"
        }`}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modèle 1 — Affiche : la photo occupe tout, le titre se pose dessus  */
/* ------------------------------------------------------------------ */

function Affiche({
  slide,
  slides,
  active,
  onPick,
  onMove,
}: {
  slide: HeroSlide
  slides: HeroSlide[]
  active: number
  onPick: (index: number) => void
  onMove: (direction: number) => void
}) {
  return (
    /* Plein écran : la photo occupe toute la largeur et toute la hauteur
       restante sous l'en-tête, sans marge ni coin arrondi. */
    <section className="relative">
      <div className="relative min-h-[calc(100svh-11rem)] overflow-hidden bg-foreground lg:min-h-[calc(100svh-7.1rem)]">
        <div key={`image-${active}`} className="hero-image-enter absolute inset-0">
          <Image
            src={slide.image}
            alt={slide.accent || slide.title}
            fill
            priority
            className="object-cover object-[50%_28%]"
            sizes="100vw"
            unoptimized={slide.image.startsWith("data:")}
          />
        </div>

        {/* Deux voiles croisés : le texte reste lisible quelle que soit la photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
        <div className="hero-grain absolute inset-0 opacity-[0.12]" />

        {slide.accent && (
          <span className="absolute right-6 top-6 rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white backdrop-blur-md sm:right-10 sm:top-8 lg:right-14">
            {slide.accent}
          </span>
        )}

        <div className="relative mx-auto flex min-h-[calc(100svh-11rem)] max-w-[1560px] flex-col justify-end px-6 pb-8 pt-16 sm:px-10 sm:pb-10 lg:min-h-[calc(100svh-7.1rem)] lg:px-14 lg:pb-12">
          <div key={`copy-${active}`} className="hero-copy-enter max-w-3xl">
            {slide.eyebrow && (
              <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/85">
                <span className="h-px w-9 bg-white/50" />
                {slide.eyebrow}
              </p>
            )}
            <h1 className="font-serif text-[2.9rem] font-medium leading-[0.96] tracking-[-0.045em] text-white sm:text-[3.9rem] lg:text-[4.9rem]">
              {slide.title}
            </h1>
            {slide.copy && (
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{slide.copy}</p>
            )}
            <Boutons slide={slide} clair />
          </div>

          <div className="mt-9 flex items-end justify-between gap-4">
            <Pagination slides={slides} active={active} onPick={onPick} clair />
            {slides.length > 1 && <Fleches onMove={onMove} clair />}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Modèle 2 — Éditorial : texte à gauche, photo à droite               */
/* ------------------------------------------------------------------ */

function Editorial({
  slide,
  slides,
  active,
  onPick,
  onMove,
}: {
  slide: HeroSlide
  slides: HeroSlide[]
  active: number
  onPick: (index: number) => void
  onMove: (direction: number) => void
}) {
  return (
    <section>
      <div className="mx-auto grid max-w-[1560px] items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-12 lg:py-14">
        <div key={`copy-${active}`} className="hero-copy-enter">
          {slide.eyebrow && (
            <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/70">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {slide.eyebrow}
            </p>
          )}
          <h1 className="border-l-2 border-primary/60 pl-5 font-serif text-[2.6rem] font-medium leading-[1] tracking-[-0.04em] text-foreground sm:text-[3.4rem] lg:text-[4rem]">
            {slide.title}
          </h1>
          {slide.copy && (
            <p className="mt-6 max-w-lg pl-5 text-sm leading-relaxed text-foreground/70 sm:text-base">{slide.copy}</p>
          )}
          <div className="pl-5">
            <Boutons slide={slide} />
          </div>

          <div className="mt-10 flex items-end gap-5 pl-5">
            <Pagination slides={slides} active={active} onPick={onPick} />
            {slides.length > 1 && <Fleches onMove={onMove} />}
          </div>
        </div>

        <div className="relative">
          <div
            key={`image-${active}`}
            className="hero-image-enter relative aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-[4/4.4] lg:rounded-[2rem]"
          >
            <Image
              src={slide.image}
              alt={slide.accent || slide.title}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 52vw, 100vw"
              unoptimized={slide.image.startsWith("data:")}
            />
          </div>
          {slide.accent && (
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-background/95 px-4 py-3 shadow-[0_18px_40px_-24px_rgba(52,41,43,0.6)] backdrop-blur">
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">À découvrir</span>
                <span className="mt-0.5 block font-serif text-lg leading-tight">{slide.accent}</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Modèle 3 — Lookbook : titre centré, trois photos décalées           */
/* ------------------------------------------------------------------ */

function Lookbook({
  slide,
  slides,
  active,
  onPick,
}: {
  slide: HeroSlide
  slides: HeroSlide[]
  active: number
  onPick: (index: number) => void
}) {
  const photos = [slide.image, ...HERO_APPUIS].slice(0, 3)
  const decalages = ["lg:mt-10", "lg:mt-0", "lg:mt-16"]

  return (
    <section>
      <div className="mx-auto max-w-[1560px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
        <div key={`copy-${active}`} className="hero-copy-enter mx-auto max-w-2xl text-center">
          {slide.eyebrow && (
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{slide.eyebrow}</p>
          )}
          <h1 className="text-balance font-serif text-[2.5rem] font-medium leading-[1] tracking-[-0.04em] text-foreground sm:text-[3.3rem] lg:text-[3.9rem]">
            {slide.title}
          </h1>
          {slide.copy && (
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-foreground/70 sm:text-base">
              {slide.copy}
            </p>
          )}
          <div className="flex justify-center">
            <Boutons slide={slide} />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className={`relative overflow-hidden rounded-[1.25rem] lg:rounded-[1.75rem] ${decalages[index]} ${
                index === 2 ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:aspect-[4/5]" : "aspect-[3/4] lg:aspect-[4/5]"
              }`}
            >
              <Image
                src={photo}
                alt=""
                fill
                priority={index === 0}
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(min-width: 1024px) 33vw, 50vw"
                unoptimized={photo.startsWith("data:")}
              />
              {index === 1 && slide.accent && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/92 px-4 py-1.5 text-xs font-medium backdrop-blur">
                  {slide.accent}
                </span>
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination slides={slides} active={active} onPick={onPick} />
          </div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

/** Le bandeau d'accueil. `config` n'est fourni que par l'aperçu du back-office. */
export function Hero({ config }: { config?: HeroConfig }) {
  const reglages = useHeroConfig()
  const actif = config ?? reglages
  const slides = heroSlides(actif)

  const [active, setActive] = useState(0)
  const slide = slides[Math.min(active, slides.length - 1)]

  // Une seule annonce : rien à faire défiler.
  useEffect(() => {
    if (slides.length < 2) {
      setActive(0)
      return
    }
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length)

  if (actif.template === "editorial") {
    return <Editorial slide={slide} slides={slides} active={active} onPick={setActive} onMove={move} />
  }
  if (actif.template === "collection") {
    return <Lookbook slide={slide} slides={slides} active={active} onPick={setActive} />
  }
  return <Affiche slide={slide} slides={slides} active={active} onPick={setActive} onMove={move} />
}
