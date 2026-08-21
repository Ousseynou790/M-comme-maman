"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

/**
 * Vue produit à photos multiples.
 *
 * Sur une carte, les vues défilent au survol ; sur la fiche, on les choisit à la
 * main. Un article qui n'a qu'une photo se comporte exactement comme avant :
 * aucun point, aucun défilement.
 */
export function HoverGallery({
  images,
  alt,
  sizes,
  className,
  intervalMs = 1100,
}: {
  images: string[]
  alt: string
  sizes?: string
  className?: string
  intervalMs?: number
}) {
  const [index, setIndex] = useState(0)
  const timer = useRef<number | null>(null)
  const multiple = images.length > 1

  const demarrer = () => {
    if (!multiple || timer.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs)
  }

  const arreter = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    setIndex(0)
  }

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  return (
    <div
      className={className}
      onMouseEnter={demarrer}
      onMouseLeave={arreter}
      onFocusCapture={demarrer}
      onBlurCapture={arreter}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src || "/placeholder.svg"}
          alt={i === 0 ? alt : `${alt} — vue ${i + 1}`}
          fill
          sizes={sizes}
          className={`object-cover boty-transition ${i === index ? "opacity-100" : "opacity-0"}`}
          unoptimized={src.startsWith("data:")}
        />
      ))}

      {multiple && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 rounded-full boty-transition ${
                i === index ? "w-4 bg-background" : "w-1.5 bg-background/60"
              }`}
            />
          ))}
        </span>
      )}
    </div>
  )
}

/** Fiche produit : une grande vue et la bande de vignettes. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)

  // Un changement d'article remet la galerie sur la première vue.
  useEffect(() => setActive(0), [images])

  const courante = images[active] ?? images[0]

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-card boty-shadow">
        <Image
          key={courante}
          src={courante || "/placeholder.svg"}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-scale-fade-in object-cover"
          priority
          unoptimized={courante?.startsWith("data:")}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Voir la vue ${i + 1}`}
              aria-pressed={i === active}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 boty-transition ${
                i === active ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <Image
                src={src || "/placeholder.svg"}
                alt=""
                fill
                sizes="90px"
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
