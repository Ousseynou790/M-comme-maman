export const formatXOF = (n: number) =>
  n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " F";

export const WHATSAPP = "221762080202";

export const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
