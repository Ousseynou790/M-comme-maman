"use client"

import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFavorites } from "./favorites-context"

/**
 * Bouton cœur. Posé au-dessus d'un lien produit, il intercepte le clic
 * pour ne pas déclencher la navigation de la carte.
 */
export function FavoriteButton({
  productId,
  productName,
  className,
  size = "md",
}: {
  productId: string
  productName: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const { isFavorite, toggle, hydrated } = useFavorites()
  const active = hydrated && isFavorite(productId)

  const dimensions = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  }[size]

  const iconSize = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-5 w-5" }[size]

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId)
      }}
      aria-pressed={active}
      aria-label={active ? `Retirer ${productName} des favoris` : `Ajouter ${productName} aux favoris`}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm boty-transition boty-shadow active:scale-90",
        dimensions,
        active ? "text-primary" : "text-foreground/70 hover:text-primary",
        className,
      )}
    >
      <Heart className={cn(iconSize, active && "fill-primary")} />
    </button>
  )
}
