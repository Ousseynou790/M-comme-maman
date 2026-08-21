"use client"

import { useEffect, useMemo, useState } from "react"
import type { SizeValue } from "@/lib/admin/types"

/** L'état du back-office vit dans ce navigateur ; la vitrine y lit les tailles. */
const CLE_ADMIN = "mcm-admin-state-v1"

export interface AideTailles {
  /** Le repère associé à une taille, vide s'il n'y en a pas. */
  correspondance: (taille: string) => string
  /** Le visuel du guide des tailles, vide s'il n'y en a pas. */
  guide: string
}

/** Une taille enregistrée avant la séparation taille / repère était une chaîne. */
function normaliserTaille(brut: SizeValue | string): SizeValue {
  if (typeof brut === "object" && brut !== null) return brut
  return { value: String(brut), age: "" }
}

/**
 * Les tailles réglées dans l'administration.
 *
 * Lecture différée au montage : le premier rendu doit rester identique côté
 * serveur et client. Sans back-office ouvert dans ce navigateur, la vitrine
 * affiche simplement les tailles sans repère.
 */
export function useSizeGuide(): AideTailles {
  const [tailles, setTailles] = useState<SizeValue[]>([])
  const [guide, setGuide] = useState("")

  useEffect(() => {
    const lire = () => {
      try {
        const brut = window.localStorage.getItem(CLE_ADMIN)
        if (!brut) return
        const etat = JSON.parse(brut) as {
          library?: { sizes?: (SizeValue | string)[]; sizeGuide?: string }
        }
        setTailles((etat.library?.sizes ?? []).map(normaliserTaille))
        setGuide(etat.library?.sizeGuide ?? "")
      } catch {
        /* stockage illisible : on se passe des repères */
      }
    }
    lire()
    window.addEventListener("storage", lire)
    return () => window.removeEventListener("storage", lire)
  }, [])

  return useMemo(
    () => ({
      correspondance: (taille: string) => tailles.find((t) => t.value === taille)?.age ?? "",
      guide,
    }),
    [tailles, guide],
  )
}
