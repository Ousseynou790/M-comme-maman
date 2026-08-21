/** Règles de livraison et de paiement de la boutique, alignées sur le bandeau d'annonce. */

export const FREE_SHIPPING_THRESHOLD = 25_000
export const SHIPPING_DAKAR = 2_000
export const SHIPPING_REGIONS = 4_000

export type DeliveryZone = "dakar" | "regions"

export const DELIVERY_ZONES: { value: DeliveryZone; label: string; hint: string; cost: number }[] = [
  { value: "dakar", label: "Dakar et banlieue", hint: "Livraison sous 24-48h", cost: SHIPPING_DAKAR },
  { value: "regions", label: "Autres régions", hint: "Livraison sous 2 à 5 jours", cost: SHIPPING_REGIONS },
]

export type PaymentMethodId = "wave" | "orange_money" | "carte" | "livraison"

export const PAYMENT_METHODS: { value: PaymentMethodId; label: string; hint: string }[] = [
  { value: "wave", label: "Wave", hint: "Vous recevrez un lien de paiement" },
  { value: "orange_money", label: "Orange Money", hint: "Paiement par code sur votre mobile" },
  { value: "carte", label: "Carte bancaire", hint: "Visa ou Mastercard" },
  { value: "livraison", label: "À la livraison", hint: "En espèces, à la remise du colis" },
]

export function shippingCost(zone: DeliveryZone, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return zone === "dakar" ? SHIPPING_DAKAR : SHIPPING_REGIONS
}

/** Ce qu'il reste à ajouter au panier pour obtenir la livraison offerte. */
export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
}
