/**
 * Le catalogue, lu sur le serveur.
 *
 * Ce fichier remplace `lib/products.ts` comme source : les composants gardent
 * exactement le même type `Product`, seule la provenance change. C'était le but
 * de la forme donnée au tableau statique dès le départ.
 *
 * `lib/products.ts` reste en place pour les visuels du bandeau, les tailles et
 * les coloris de référence, qui ne dépendent pas encore du serveur.
 */

import { lire, type Page, type ProduitApi, type RayonApi } from "./api";
import type { Age, Gender, Product, Univers } from "./products";

/** Un produit du serveur, mis à la forme que les composants connaissent déjà. */
export function versProduit(brut: ProduitApi): Product {
  return {
    id: String(brut.id),
    slug: brut.slug,
    name: brut.nom,
    sku: "",
    /* Le prix affiché est celui que la caisse retiendra : c'est le serveur qui
       décide, remises en cours comprises. */
    price: brut.prix_public ?? brut.prix,
    compareAt: brut.prix_avant ?? undefined,
    promotion: brut.promotion ?? undefined,
    category: brut.rayon_nom,
    univers: brut.univers as Univers,
    gender: (brut.genre || undefined) as Gender | undefined,
    age: (brut.age || undefined) as Age | undefined,
    image: brut.image,
    description: brut.description,
    outOfStock: brut.en_rupture,
  };
}

export type FiltresCatalogue = {
  univers?: Univers;
  rayon?: string;
  genre?: string;
  age?: string;
  taille?: string;
  promo?: boolean;
  q?: string;
  tri?: "nouveautes" | "prix-croissant" | "prix-decroissant" | "nom";
};

function requete(filtres: FiltresCatalogue): string {
  const params = new URLSearchParams();
  if (filtres.univers) params.set("univers", filtres.univers);
  if (filtres.rayon) params.set("rayon", filtres.rayon);
  if (filtres.genre) params.set("genre", filtres.genre);
  if (filtres.age) params.set("age", filtres.age);
  if (filtres.taille) params.set("taille", filtres.taille);
  if (filtres.promo) params.set("promo", "1");
  if (filtres.q) params.set("q", filtres.q);
  if (filtres.tri) params.set("tri", filtres.tri);
  // Le catalogue tient sur une page : la boutique n'a pas de pagination.
  params.set("page_size", "100");
  return params.toString();
}

/** Les fiches publiées d'un univers. Vide plutôt qu'une erreur si le serveur dort. */
export async function lireCatalogue(filtres: FiltresCatalogue = {}): Promise<Product[]> {
  try {
    const page = await lire<Page<ProduitApi>>(`/api/catalogue/produits/?${requete(filtres)}`, {
      // Le stock bouge : une minute de cache suffit à absorber les rafales sans
      // afficher une rupture d'il y a une heure.
      revalider: 60,
    });
    return (page?.results ?? []).map(versProduit);
  } catch {
    // Le serveur peut être éteint en développement. La boutique doit rester
    // consultable plutôt que de rendre une page d'erreur.
    return [];
  }
}

/** Une fiche complète, variantes comprises. `null` si elle n'existe pas. */
export async function lireFiche(slug: string): Promise<{ produit: Product; brut: ProduitApi } | null> {
  try {
    const brut = await lire<ProduitApi>(`/api/catalogue/produits/${slug}/`, { revalider: 60 });
    return brut ? { produit: versProduit(brut), brut } : null;
  } catch {
    return null;
  }
}

/** Les quatre voisines de rayon, proposées sous une fiche. */
export async function lireSimilaires(slug: string): Promise<Product[]> {
  try {
    const liste = await lire<ProduitApi[]>(`/api/catalogue/produits/${slug}/similaires/`, {
      revalider: 300,
    });
    return (liste ?? []).map(versProduit);
  } catch {
    return [];
  }
}

/**
 * Les rayons visibles d'un univers.
 *
 * Le serveur ne renvoie que le premier niveau ; chaque catégorie porte ses
 * sous-catégories dans `enfants`. Le menu affiche les racines, les filtres
 * déplient.
 */
export async function lireRayons(univers?: Univers): Promise<RayonApi[]> {
  try {
    const chemin = univers
      ? `/api/catalogue/rayons/?univers=${univers}`
      : "/api/catalogue/rayons/";
    // Les rayons changent rarement : un quart d'heure de cache est large.
    return (await lire<RayonApi[]>(chemin, { revalider: 900 })) ?? [];
  } catch {
    return [];
  }
}


/** Les noms des sous-catégories d'une racine, à plat, pour les pastilles de filtre. */
export async function lireSousRayons(racine: string): Promise<{ nom: string; slug: string }[]> {
  const rayons = await lireRayons();
  const parente = rayons.find((r) => r.slug === racine);
  return (parente?.enfants ?? []).map((e) => ({ nom: e.nom, slug: e.slug }));
}
