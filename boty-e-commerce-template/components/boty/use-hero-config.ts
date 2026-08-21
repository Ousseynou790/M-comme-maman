"use client"

import { useEffect, useState } from "react"
import { heroParDefaut, type HeroConfig } from "@/lib/hero"

/** L'état du back-office vit dans ce navigateur ; la vitrine y lit son bandeau. */
const CLE_ADMIN = "mcm-admin-state-v1"

/**
 * Le bandeau réglé dans l'administration, ou les modèles par défaut.
 *
 * La lecture est différée au montage : le premier rendu doit rester identique
 * côté serveur et côté client. L'événement `storage` fait suivre la vitrine
 * quand les réglages changent dans un autre onglet.
 */
export function useHeroConfig(): HeroConfig {
  const [config, setConfig] = useState<HeroConfig>(heroParDefaut)

  useEffect(() => {
    const lire = () => {
      try {
        const brut = window.localStorage.getItem(CLE_ADMIN)
        if (!brut) return
        const etat = JSON.parse(brut) as { hero?: Partial<HeroConfig> }
        if (!etat.hero) return
        setConfig({
          ...heroParDefaut,
          ...etat.hero,
          slide: { ...heroParDefaut.slide, ...etat.hero.slide },
        })
      } catch {
        /* stockage illisible : les modèles par défaut font l'affaire */
      }
    }

    lire()
    window.addEventListener("storage", lire)
    return () => window.removeEventListener("storage", lire)
  }, [])

  return config
}
