"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Conteneur à défilement différé.
 *
 * L'enfant est décalé verticalement en fonction de la position de la boîte dans
 * la fenêtre : au centre de l'écran le décalage est nul, il croît vers les bords.
 * Le décalage est appliqué directement sur le style du nœud, sans passer par
 * l'état React — pas de rendu à chaque image.
 *
 * `speed` est la fraction du déplacement de l'élément qui est rattrapée :
 * 0.15 donne un mouvement discret, 0.35 un effet marqué.
 *
 * `zoom` ajoute une mise au point : le contenu entre légèrement agrandi et se
 * pose à l'échelle 1 quand la boîte atteint le centre de l'écran.
 */
/** Débord vertical réservé de part et d'autre, en fraction de la hauteur du cadre. */
const MARGE_PAR_DEFAUT = 0.12

export function Parallax({
  children,
  speed = 0.15,
  zoom = 0,
  margin = MARGE_PAR_DEFAUT,
  className,
}: {
  children: ReactNode
  speed?: number
  /** Agrandissement résiduel au bord de l'écran, en fraction (0.06 = 6 %). */
  zoom?: number
  /** Débord réservé, donc course maximale : monter au-delà de 0.12 accentue l'effet. */
  margin?: number
  className?: string
}) {
  const cadre = useRef<HTMLDivElement>(null)
  const mobile = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const boite = cadre.current
    const contenu = mobile.current
    if (!boite || !contenu) return

    // Respecte le réglage système : aucun mouvement si l'utilisateur n'en veut pas.
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduit.matches) return

    let frame = 0
    let visible = true

    const placer = () => {
      const rect = boite.getBoundingClientRect()
      const centre = rect.top + rect.height / 2 - window.innerHeight / 2
      // Borné à la marge disponible : sur un grand écran, le décalage calculé
      // peut dépasser le débord et découvrir un bord vide.
      const limite = rect.height * margin
      const decalage = Math.max(-limite, Math.min(limite, -centre * speed))

      // Distance au centre de l'écran, ramenée entre 0 (centré) et 1 (au bord).
      const distance = Math.min(1, Math.abs(centre) / (window.innerHeight / 2 + rect.height / 2))
      const echelle = 1 + zoom * distance

      contenu.style.transform = `translate3d(0, ${decalage.toFixed(2)}px, 0) scale(${echelle.toFixed(4)})`
    }

    const auProchainRendu = () => {
      if (!visible) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(placer)
    }

    // Hors écran, on arrête de calculer.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) auProchainRendu()
      },
      { rootMargin: "120px" },
    )
    observer.observe(boite)

    placer()
    window.addEventListener("scroll", auProchainRendu, { passive: true })
    window.addEventListener("resize", auProchainRendu)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", auProchainRendu)
      window.removeEventListener("resize", auProchainRendu)
    }
  }, [speed, zoom, margin])

  return (
    <div ref={cadre} className={className}>
      {/* Débord vertical : le contenu peut glisser sans jamais découvrir de vide. */}
      <div
        ref={mobile}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `${-margin * 100}%`, bottom: `${-margin * 100}%` }}
      >
        {children}
      </div>
    </div>
  )
}
