"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const STORAGE_KEY = "mcm-favorites-v1"

interface FavoritesContextType {
  /** Identifiants des produits mis en favori, du plus récent au plus ancien. */
  ids: string[]
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  count: number
  /** Faux tant que le stockage local n'a pas été relu : évite les écarts d'hydratation. */
  hydrated: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Lecture différée : le premier rendu doit être identique côté serveur et client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setIds(parsed.filter((v): v is string => typeof v === "string"))
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart d'une liste vide */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [ids, hydrated])

  // Un favori ajouté dans un autre onglet se reflète ici.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed: unknown = JSON.parse(event.newValue)
        if (Array.isArray(parsed)) setIds(parsed.filter((v): v is string => typeof v === "string"))
      } catch {
        /* valeur illisible : on garde l'état courant */
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const toggle = useCallback((id: string) => {
    setIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [id, ...current]))
  }, [])

  const remove = useCallback((id: string) => {
    setIds((current) => current.filter((v) => v !== id))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const value = useMemo<FavoritesContextType>(
    () => ({
      ids,
      isFavorite: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
      count: ids.length,
      hydrated,
    }),
    [ids, toggle, remove, clear, hydrated],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error("useFavorites doit être utilisé à l'intérieur de <FavoritesProvider>")
  return context
}
