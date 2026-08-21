"use client"

import { products } from "@/lib/products"
import { promoCampaign } from "@/lib/promo"
import { PromoCountdown } from "./promo-countdown"

/** La meilleure remise en cours, pour l'annoncer sans l'écrire en dur. */
const bestPercent = products
  .filter((p) => p.originalPrice !== null && p.originalPrice > p.price)
  .reduce((best, p) => Math.max(best, Math.round((1 - p.price / (p.originalPrice as number)) * 100)), 0)

export function PromoSection() {
  // Ni campagne en cours, ni article remisé : rien à mettre en avant.
  if (!promoCampaign || bestPercent === 0) return null

  return (
    <PromoCountdown campaign={promoCampaign} headline={`jusqu'à −${bestPercent} % sur la sélection`} />
  )
}
