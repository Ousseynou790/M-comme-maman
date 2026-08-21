import { ageGroups, categories, products, type Category, type Product } from "./products"

/**
 * Recherche de la boutique.
 *
 * Tout est côté navigateur : le catalogue tient en mémoire, il n'y a donc ni
 * appel réseau ni index à maintenir. Le jour où le catalogue grossira, seule
 * `chercherProduits` sera à remplacer par un appel au serveur.
 */

/** Minuscules, sans accent ni ponctuation : « Robe été » et « robe ete » se valent. */
export function normaliser(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Ce qu'une cliente tape pour ce qu'elle cherche vraiment. */
const SYNONYMES: Record<string, string> = {
  fille: "filles",
  garcon: "garcons",
  bebe: "bebes",
  bebes: "bebes",
  chaussure: "chaussures",
  basket: "chaussures",
  baskets: "chaussures",
  accessoire: "accessoires",
  soldes: "promo",
  reduction: "promo",
  nouveaute: "nouveau",
  nouveautes: "nouveau",
}

const mots = (valeur: string) =>
  normaliser(valeur)
    .split(" ")
    .filter(Boolean)
    .map((mot) => SYNONYMES[mot] ?? mot)

interface Fiche {
  product: Product
  nom: string
  accroche: string
  rayon: string
  reste: string
}

/** Index construit une fois pour toutes au chargement du module. */
const INDEX: Fiche[] = products.map((product) => {
  const rayon = categories.find((c) => c.slug === product.category)
  const age = ageGroups.find((a) => a.value === product.age)
  return {
    product,
    nom: normaliser(product.name),
    accroche: normaliser(product.tagline),
    rayon: normaliser(`${rayon?.label ?? ""} ${product.category} ${age?.label ?? ""} ${age?.hint ?? ""}`),
    reste: normaliser(
      [product.description, product.matiere, product.badge ?? "", ...product.colors, ...product.sizes].join(" "),
    ),
  }
})

export interface ResultatProduit {
  product: Product
  score: number
}

/**
 * Chaque mot de la requête doit se retrouver quelque part dans la fiche ; le
 * score dit ensuite lequel des résultats mérite la première place.
 */
export function chercherProduits(requete: string, limite = 40): ResultatProduit[] {
  const termes = mots(requete)
  if (termes.length === 0) return []

  const resultats: ResultatProduit[] = []

  for (const fiche of INDEX) {
    let score = 0
    let complet = true

    for (const terme of termes) {
      let point = 0
      if (fiche.nom.startsWith(terme)) point = 8
      else if (new RegExp(`\\b${terme}`).test(fiche.nom)) point = 6
      else if (fiche.nom.includes(terme)) point = 4
      else if (fiche.rayon.includes(terme)) point = 3
      else if (fiche.accroche.includes(terme)) point = 2
      else if (fiche.reste.includes(terme)) point = 1

      if (point === 0) {
        complet = false
        break
      }
      score += point
    }

    if (!complet) continue
    // À score égal, l'article le mieux noté et le moins cher passe devant.
    resultats.push({ product: fiche.product, score: score * 100 + fiche.product.rating * 10 })
  }

  return resultats.sort((a, b) => b.score - a.score).slice(0, limite)
}

/** Les rayons dont le nom colle à la requête, proposés au-dessus des articles. */
export function chercherRayons(requete: string): Category[] {
  const termes = mots(requete)
  if (termes.length === 0) return []
  return categories.filter((category) => {
    const cible = normaliser(`${category.label} ${category.slug} ${category.description}`)
    return termes.every((terme) => cible.includes(terme))
  })
}

/** Propositions affichées tant que le champ est vide. */
export const RECHERCHES_FREQUENTES = ["Robe", "Ensemble", "Bébé", "Chaussures", "Pyjama", "Cérémonie"]

/**
 * Aplatit un libellé caractère par caractère, sans jamais changer sa longueur :
 * indispensable pour retrouver ensuite la position exacte du terme dans le
 * texte d'origine.
 */
function aplatir(texte: string): string {
  let sortie = ""
  for (const caractere of texte) {
    const nu = caractere
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
    sortie += nu.length === 1 && /[a-z0-9]/.test(nu) ? nu : " "
  }
  return sortie
}

/**
 * Découpe un libellé pour mettre en gras ce qui correspond à la requête.
 * Renvoie une suite de fragments plutôt que du HTML, pour rester sûr.
 */
export function surligner(texte: string, requete: string): { texte: string; fort: boolean }[] {
  const termes = mots(requete).filter((t) => t.length > 1)
  if (termes.length === 0) return [{ texte, fort: false }]

  const source = aplatir(texte)
  const marques = new Array<boolean>(texte.length).fill(false)

  for (const terme of termes) {
    let depuis = source.indexOf(terme)
    while (depuis !== -1) {
      for (let i = depuis; i < depuis + terme.length; i++) marques[i] = true
      depuis = source.indexOf(terme, depuis + terme.length)
    }
  }

  const fragments: { texte: string; fort: boolean }[] = []
  let courant = ""
  let fort = marques[0]
  for (let i = 0; i < texte.length; i++) {
    if (marques[i] === fort) {
      courant += texte[i]
    } else {
      fragments.push({ texte: courant, fort })
      courant = texte[i]
      fort = marques[i]
    }
  }
  if (courant) fragments.push({ texte: courant, fort })
  return fragments
}
