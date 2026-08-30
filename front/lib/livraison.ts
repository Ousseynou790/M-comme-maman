import type { ZoneKey } from "@/components/auth-context";

/**
 * Règles de livraison et de paiement, source unique.
 *
 * Le tunnel de commande les affiche pour calculer les frais ; le carnet
 * d'adresses de l'espace client réutilise les zones pour qu'une adresse
 * enregistrée porte la même que celle proposée au paiement ; le suivi de
 * commande y relit le libellé du moyen de paiement. `free` est le montant à
 * partir duquel la livraison ne coûte rien — `Infinity` hors de Dakar, où elle
 * n'est jamais offerte.
 */
export const ZONES: {
  key: ZoneKey;
  t: string;
  /** Le nom court, pour la ligne « Livraison … » du récapitulatif. */
  short: string;
  s: string;
  cost: number;
  free: number;
}[] = [
  { key: "dakar", t: "Dakar et banlieue", short: "Dakar", s: "24 h · offerte dès 25 000 F", cost: 2000, free: 25000 },
  { key: "thies", t: "Thiès, Mbour", short: "Thiès", s: "2 jours · 3 500 F", cost: 3500, free: Infinity },
  { key: "regions", t: "Autres régions", short: "régions", s: "3 à 4 jours · 3 500 F", cost: 3500, free: Infinity },
];

export const zoneLabel = (key: ZoneKey) => ZONES.find((z) => z.key === key)?.t ?? ZONES[0].t;

export const zoneIndex = (key: ZoneKey) => Math.max(0, ZONES.findIndex((z) => z.key === key));

/** Le délai annoncé pour une zone, tel qu'il apparaît dans le suivi. */
export const zoneDelay = (key: ZoneKey) => (key === "dakar" ? "24 à 48 h" : "2 à 4 jours");

export type MethodKey = "wave" | "om" | "cb" | "cod";

export const METHODS: {
  k: MethodKey;
  i: string;
  chip: string;
  fg: string;
  t: string;
  s: string;
  fee: string;
}[] = [
  { k: "wave", i: "W", chip: "#e8f1fd", fg: "#1a63c4", t: "Wave", s: "Redirection vers l'application Wave", fee: "1 %" },
  { k: "om", i: "OM", chip: "#fdeee4", fg: "#c25a12", t: "Orange Money", s: "Code de confirmation par SMS", fee: "1,5 %" },
  { k: "cb", i: "CB", chip: "#f1eefb", fg: "#5540a8", t: "Carte bancaire", s: "Page sécurisée du prestataire", fee: "2,9 %" },
  { k: "cod", i: "₣", chip: "#eaf6ef", fg: "#2e7d52", t: "Paiement à la livraison", s: "Espèces ou Wave au livreur, Dakar uniquement", fee: "sans frais" },
];

export const methodOf = (key: MethodKey) => METHODS.find((m) => m.k === key) ?? METHODS[0];

/**
 * Les codes de réduction acceptés.
 *
 * Un seul pour l'instant, celui de la campagne de rentrée affichée en page
 * d'accueil. La remise était appliquée d'office sur tous les paniers : elle
 * demande maintenant que le code soit saisi, comme il le sera côté serveur.
 */
export const CODES: Record<string, { percent: number; label: string }> = {
  RENTREE15: { percent: 15, label: "Rentrée des classes" },
};

export const findCode = (saisie: string) => CODES[saisie.trim().toUpperCase()] ?? null;
