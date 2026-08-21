import { PRODUCTS, CATEGORIES, type Product } from "./products";

/**
 * Recherche de la boutique.
 *
 * Tout se passe dans le navigateur : le catalogue tient en mémoire, il n'y a ni
 * appel réseau ni index à tenir à jour. Le jour où le catalogue passera en base,
 * seule `chercherProduits` sera à remplacer par une requête serveur — la forme
 * du résultat, elle, ne bouge pas.
 */

/** Minuscules, sans accent ni ponctuation : « Robe été » et « robe ete » se valent. */
export function normaliser(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Ce qu'une cliente tape, ramené au mot que porte la fiche. */
const SYNONYMES: Record<string, string> = {
  filles: "fille",
  garcons: "garcon",
  bebes: "bebe",
  nourrisson: "bebe",
  chaussure: "chaussures",
  basket: "chaussures",
  baskets: "chaussures",
  sandale: "chaussures",
  sandales: "chaussures",
  babies: "chaussures",
  chausson: "chaussures",
  chaussons: "chaussures",
  robes: "robe",
  jupes: "jupe",
  pantalons: "pantalon",
  jeans: "jean",
  denim: "jean",
  pyj: "pyjama",
  pyjamas: "pyjama",
  ensembles: "ensemble",
  tee: "shirt",
  tshirt: "shirt",
  haut: "hauts",
  soldes: "promo",
  solde: "promo",
  reduction: "promo",
  remise: "promo",
  nouveaute: "nouveau",
  nouveautes: "nouveau",
};

const mots = (valeur: string) =>
  normaliser(valeur)
    .split(" ")
    .filter(Boolean)
    .map((mot) => SYNONYMES[mot] ?? mot);

/** Comment on parle d'un âge quand on ne connaît pas le code interne. */
const AGE_MOTS: Record<Product["age"], string> = {
  "0-1": "bebe 0 1 an naissance nourrisson",
  "2-10": "enfant 2 10 ans petite maternelle primaire",
  "10-15": "grand ado 10 15 ans preado college",
};

const GENRE_MOTS: Record<Product["gender"], string> = {
  fille: "fille filles",
  garcon: "garcon garcons",
  mixte: "mixte fille garcon unisexe",
};

interface Fiche {
  product: Product;
  nom: string;
  rayon: string;
  contexte: string;
  reste: string;
}

/** Index construit une seule fois, au chargement du module. */
const INDEX: Fiche[] = PRODUCTS.map((product) => ({
  product,
  nom: normaliser(product.name),
  rayon: normaliser(product.category),
  contexte: normaliser(`${AGE_MOTS[product.age]} ${GENRE_MOTS[product.gender]}`),
  reste: normaliser(`${product.description} ${product.sku} ${product.slug}`),
}));

export interface ResultatProduit {
  product: Product;
  score: number;
}

/**
 * Chaque mot tapé doit se retrouver quelque part dans la fiche — sinon la pièce
 * sort. Le score décide ensuite de l'ordre : un mot dans le nom pèse plus qu'un
 * mot perdu au fond de la description.
 */
export function chercherProduits(requete: string, limite = 40): ResultatProduit[] {
  const termes = mots(requete);
  if (termes.length === 0) return [];

  const resultats: ResultatProduit[] = [];

  for (const fiche of INDEX) {
    let score = 0;
    let complet = true;

    for (const terme of termes) {
      let point = 0;
      if (fiche.nom.startsWith(terme)) point = 14;
      else if (fiche.nom.includes(terme)) point = 10;
      else if (fiche.rayon.includes(terme)) point = 6;
      else if (fiche.contexte.includes(terme)) point = 4;
      else if (fiche.reste.includes(terme)) point = 2;

      if (point === 0) {
        complet = false;
        break;
      }
      score += point;
    }

    if (!complet) continue;
    // À score égal, une pièce en stock passe devant une pièce épuisée.
    if (!fiche.product.outOfStock) score += 1;
    resultats.push({ product: fiche.product, score });
  }

  return resultats.sort((a, b) => b.score - a.score).slice(0, limite);
}

/** Les rayons qui répondent à la requête — proposés avant les pièces. */
export function chercherRayons(requete: string): string[] {
  const termes = mots(requete);
  if (termes.length === 0) return [];
  return CATEGORIES.filter((rayon) => {
    const cible = normaliser(rayon);
    return termes.every((terme) => cible.includes(terme));
  });
}

/** Combien de pièces dans ce rayon — affiché sous la suggestion. */
export const compterRayon = (rayon: string) =>
  PRODUCTS.filter((p) => p.category === rayon).length;

/** Proposé quand le champ est vide. Ce que les clientes tapent le plus. */
export const RECHERCHES_FREQUENTES = [
  "robe",
  "pyjama",
  "chaussures",
  "ensemble",
  "bébé",
  "jean",
  "fille",
  "garçon",
];

export interface Fragment {
  texte: string;
  fort: boolean;
}

/**
 * Découpe un libellé pour mettre en gras les mots cherchés. La comparaison se
 * fait sans accent, mais on renvoie le texte d'origine : « été » reste « été »
 * à l'écran même si la cliente a tapé « ete ».
 */
export function surligner(texte: string, requete: string): Fragment[] {
  const termes = mots(requete).filter((terme) => terme.length > 1);
  if (termes.length === 0) return [{ texte, fort: false }];

  return texte.split(/(\s+)/).map((morceau) => {
    if (!morceau.trim()) return { texte: morceau, fort: false };
    // Un mot peut porter de la ponctuation (« T-shirt ») : on teste chacun de
    // ses fragments normalisés, pas seulement le mot entier.
    const bouts = normaliser(morceau).split(" ").filter(Boolean);
    return { texte: morceau, fort: bouts.some((bout) => termes.some((terme) => bout.startsWith(terme))) };
  });
}
