/**
 * « jusqu'au 13 septembre » — la fin d'une promotion, dite à la cliente.
 *
 * Le fuseau est imposé : sans lui, le serveur et le navigateur peuvent tomber
 * sur deux jours différents et React signale un écart d'hydratation.
 */
export function jusquAu(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export const formatXOF = (n: number) =>
  n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " F";

export const WHATSAPP = "221762080202";

/* Les comptes de la boutique. À confirmer avant mise en ligne : un lien vers le
   mauvais compte est pire que pas de lien du tout. */
export const INSTAGRAM = "mcommaman";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM}`;

export const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
