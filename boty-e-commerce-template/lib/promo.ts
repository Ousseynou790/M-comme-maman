import { products } from "./products"

/** Un article dont le prix barré est supérieur au prix de vente. */
export interface PromoItem {
  id: string
  percent: number
  saved: number
}

export function getPromoItems(): PromoItem[] {
  return products
    .filter((p): p is typeof p & { originalPrice: number } => p.originalPrice !== null && p.originalPrice > p.price)
    .map((p) => ({
      id: p.id,
      percent: Math.round((1 - p.price / p.originalPrice) * 100),
      saved: p.originalPrice - p.price,
    }))
    .sort((a, b) => b.percent - a.percent)
}

export interface PromoCampaign {
  eyebrow: string
  title: string
  /** Fin de l'opération, en heure locale. Passée cette date, le bandeau disparaît de lui-même. */
  endsAt: string
  ctaLabel: string
  ctaHref: string
  image: string
}

/**
 * L'opération commerciale en cours.
 *
 * Mettre `null` pour retirer le bandeau, ou repousser `endsAt` pour prolonger.
 * Le compte à rebours lit cette date : il n'y a pas d'horloge cachée ailleurs.
 */
export const promoCampaign: PromoCampaign | null = {
  eyebrow: "Offre à durée limitée",
  title: "Rentrée des classes",
  endsAt: "2026-09-30T23:59:59",
  ctaLabel: "J'en profite",
  ctaHref: "/shop?promo=1",
  image: "/images/mcm/real/promo-enfants-pyjamas-boutique-v4.png",
}

export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  over: boolean
}

export function computeRemaining(target: string, now: number = Date.now()): Remaining {
  const diff = new Date(target).getTime() - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, over: true }

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    over: false,
  }
}
