"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const STORAGE_KEY = "mcm-reviews-v1"

/** Avis sur un article précis, ou sur la boutique dans son ensemble. */
export type ReviewTarget = { kind: "product"; productId: string } | { kind: "shop" }

export interface Review {
  id: string
  target: ReviewTarget
  /** Note de 1 à 5. */
  rating: number
  comment: string
  authorName: string
  /** Identifiant du compte : sert à savoir qui peut modifier ou supprimer son avis. */
  authorEmail: string
  /** Commande qui donne le droit d'écrire cet avis — absente pour un avis boutique. */
  orderRef?: string
  createdAt: string
}

export interface Aggregate {
  count: number
  average: number
  /** Nombre d'avis par note, de 1 à 5. */
  distribution: Record<number, number>
}

interface ReviewsContextType {
  reviews: Review[]
  productReviews: (productId: string) => Review[]
  shopReviews: () => Review[]
  aggregate: (target: ReviewTarget) => Aggregate
  /** L'avis déjà déposé par cette adresse pour cette cible, s'il existe. */
  reviewBy: (email: string, target: ReviewTarget) => Review | undefined
  submit: (input: Omit<Review, "id" | "createdAt">) => void
  remove: (id: string) => void
  hydrated: boolean
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined)

function sameTarget(a: ReviewTarget, b: ReviewTarget): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === "product" && b.kind === "product") return a.productId === b.productId
  return true
}

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Lecture différée : le premier rendu doit rester identique côté serveur et client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setReviews(parsed as Review[])
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart sans avis */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
    } catch {
      /* quota dépassé : l'avis reste affiché, seule la persistance est perdue */
    }
  }, [reviews, hydrated])

  const productReviews = useCallback(
    (productId: string) =>
      reviews
        .filter((r) => r.target.kind === "product" && r.target.productId === productId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  )

  const shopReviews = useCallback(
    () => reviews.filter((r) => r.target.kind === "shop").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  )

  const aggregate = useCallback<ReviewsContextType["aggregate"]>(
    (target) => {
      const liste = reviews.filter((r) => sameTarget(r.target, target))
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      for (const r of liste) distribution[r.rating] = (distribution[r.rating] ?? 0) + 1
      const total = liste.reduce((sum, r) => sum + r.rating, 0)
      return {
        count: liste.length,
        average: liste.length ? Math.round((total / liste.length) * 10) / 10 : 0,
        distribution,
      }
    },
    [reviews],
  )

  const reviewBy = useCallback<ReviewsContextType["reviewBy"]>(
    (email, target) => reviews.find((r) => r.authorEmail === email && sameTarget(r.target, target)),
    [reviews],
  )

  const submit = useCallback<ReviewsContextType["submit"]>((input) => {
    setReviews((current) => {
      // Un compte n'a qu'un avis par cible : le nouveau remplace l'ancien.
      const autres = current.filter(
        (r) => !(r.authorEmail === input.authorEmail && sameTarget(r.target, input.target)),
      )
      const review: Review = {
        ...input,
        id: `avis-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      }
      return [review, ...autres]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setReviews((current) => current.filter((r) => r.id !== id))
  }, [])

  const value = useMemo<ReviewsContextType>(
    () => ({ reviews, productReviews, shopReviews, aggregate, reviewBy, submit, remove, hydrated }),
    [reviews, productReviews, shopReviews, aggregate, reviewBy, submit, remove, hydrated],
  )

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}

export function useReviews(): ReviewsContextType {
  const context = useContext(ReviewsContext)
  if (!context) throw new Error("useReviews doit être utilisé à l'intérieur de <ReviewsProvider>")
  return context
}
