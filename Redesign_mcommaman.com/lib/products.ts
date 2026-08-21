export type Age = "0-1" | "2-10" | "10-15";
export type Gender = "fille" | "garcon" | "mixte";

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  compareAt?: number;
  category: string;
  gender: Gender;
  age: Age;
  image: string;
  description: string;
  outOfStock?: boolean;
};

const cdn = (file: string) => `https://mcommaman.com/cdn/shop/files/${file}`;

export const CATEGORIES = [
  "Ensembles",
  "Robes & jupes",
  "Bas & jeans",
  "T-shirts & hauts",
  "Chaussures",
] as const;

export const COLORS = [
  { name: "Rose poudré", hex: "#e8b7c8" },
  { name: "Écru", hex: "#efe6da" },
  { name: "Lilas", hex: "#ded0f0" },
  { name: "Bleu nuit", hex: "#39456b" },
];

export const SIZES = ["0-3 m", "6 m", "2 ans", "4 ans", "6 ans", "8 ans"];

export const PRODUCTS: Product[] = [
  {
    id: "p1", slug: "robe-chasuble-rose-plumetis", name: "Robe chasuble rose à volant plumetis",
    sku: "RBP-0040", price: 12000, category: "Robes & jupes", gender: "fille", age: "0-1",
    image: "/images/products/Ensemble_enfant-4-retouche.png",
    description: "Chasuble en satin rose, rosette froncée à l'épaule, bas de jupe en plumetis duveteux. Doublure coton, fermeture pression au dos.",
  },
  {
    id: "p2", slug: "babies-vernies-bride", name: "Babies vernies à bride",
    sku: "CHS-2210", price: 3000, category: "Chaussures", gender: "fille", age: "2-10",
    image: "/images/products/chass1.png",
    description: "Vernis rose, nœud plat sur le dessus, bride réglable par pression. Semelle souple antidérapante, pointures 20 à 30.",
  },
  {
    id: "p3", slug: "ensemble-pyjama-illustration", name: "Ensemble pyjama à illustration",
    sku: "PYJ-1380", price: 12000, compareAt: 14000, category: "Ensembles", gender: "fille", age: "2-10",
    image: "/images/products/Ensemble_enfant-138-retouche.png",
    description: "Haut écru à manches longues, col rouge côtelé et illustration imprimée sur la poitrine. Bas assorti à taille élastique. Jersey de coton.",
  },
  {
    id: "p4", slug: "ensemble-chemise-bermuda-safari", name: "Ensemble chemise et bermuda safari",
    sku: "SAF-0300", price: 9000, category: "Ensembles", gender: "garcon", age: "10-15",
    image: "/images/products/Ensemble_enfant-30-retouche.png",
    description: "Popeline de coton beige, chemise à manches courtes et deux poches poitrine, bermuda assorti à taille ajustable.",
  },
  {
    id: "p5", slug: "tshirt-raglan-rose-gris", name: "T-shirt raglan rose et gris",
    sku: "TSH-0520", price: 5000, compareAt: 6500, category: "T-shirts & hauts", gender: "fille", age: "2-10",
    image: "/images/products/Ensemble_enfant-52-retouche.png",
    description: "Jersey de coton rose, manches raglan grises, col rond marine côtelé. Coupe droite.",
  },
  {
    id: "p6", slug: "ensemble-pyjama-rouge-vichy", name: "Ensemble pyjama rouge et vichy",
    sku: "PYJ-0190", price: 8500, category: "Ensembles", gender: "mixte", age: "2-10",
    image: "/images/products/Ensembleenfant-19-retouche.png", outOfStock: true,
    description: "Haut rouge uni à manches longues, pantalon vichy rouge et blanc. Taille élastiquée, coton doux.",
  },
  {
    id: "p7", slug: "ensemble-pyjama-ecru-motif", name: "Ensemble pyjama écru à motif",
    sku: "PYJ-0150", price: 7500, category: "Ensembles", gender: "mixte", age: "2-10",
    image: "/images/products/Ensembleenfant-15-retouche.png",
    description: "Haut écru à manches longues avec motif appliqué, bas vert imprimé assorti. Coton doux, poignets côtelés.",
  },
  {
    id: "p8", slug: "robe-fete-ecrue-plumetis", name: "Robe de fête écrue à jupe plumetis",
    sku: "RBF-0110", price: 11000, category: "Robes & jupes", gender: "fille", age: "2-10",
    image: "/images/products/Ensemble_enfant-11-retouche.png",
    description: "Robe sans manches en satin écru, jupe en plumetis, fermeture éclair invisible au dos. Doublure intégrale.",
  },
  {
    id: "p9", slug: "ensemble-pyjama-avions", name: "Ensemble pyjama imprimé avions",
    sku: "PYJ-0570", price: 9500, category: "Ensembles", gender: "garcon", age: "2-10",
    image: "/images/products/Ensemble_enfant-57-retouche.png",
    description: "Haut écru imprimé avions, bas bleu uni assorti. Poignets et chevilles côtelés, coton respirant.",
  },
  {
    id: "p10", slug: "jean-droit-denim", name: "Jean droit en denim",
    sku: "JEA-0670", price: 13000, category: "Bas & jeans", gender: "mixte", age: "10-15",
    image: "/images/products/Ensemble_enfant-67-retouche.png",
    description: "Denim bleu moyen, coupe droite cinq poches, taille réglable par bouton intérieur.",
  },
  {
    id: "p11", slug: "pantalon-rose-elastique", name: "Pantalon rose à taille élastiquée",
    sku: "PAN-1870", price: 7000, category: "Bas & jeans", gender: "fille", age: "2-10",
    image: "/images/products/Ensemble_enfant-187-retouche.png",
    description: "Coton stretch rose, taille entièrement élastiquée, coupe droite légèrement fuselée.",
  },
  {
    id: "p12", slug: "robe-ete-fleurie-bloomer", name: "Robe d'été fleurie et bloomer",
    sku: "RBE-0070", price: 6000, category: "Robes & jupes", gender: "fille", age: "0-1",
    image: "/images/products/p7eexgrv.png",
    description: "Robe à bretelles croisées imprimée fleurs, bloomer assorti. Coton léger, doublure jersey.",
  },
];

/* Le bandeau d'accueil.
   Trois photos du shooting maison, servies depuis `public/` et non depuis le
   CDN Shopify : ce sont de vrais enfants de la boutique, pas des visuels de
   catalogue. Elles sont cadrées en arche, ce qui impose un sujet centré et un
   fond calme — `pos` rattrape le cadrage quand le corps n'est pas au milieu.
   `piece` est l'article du catalogue proposé sous la photo : la pièce portée
   n'est jamais exactement celle-là, d'où le libellé « dans le même esprit ». */
/** Les deux séquences du bandeau. `poster` est la première image affichée :
    elle tient la place tant que la vidéo n'est pas chargée, et reste seule si
    le mouvement réduit est demandé. */
export const HERO_VIDEOS = [
  {
    src: "/videos/hero-1.mp4",
    poster: "/images/hero/fille-cour.webp",
    alt: "Enfants en tenues M comme Maman, filmés en boutique",
    pos: "50% 40%",
    tag: "Tous les jours",
    piece: "p5",
  },
  {
    src: "/videos/hero-2.mp4",
    poster: "/images/hero/robe-rouge.webp",
    alt: "Tenues de fête présentées en boutique",
    pos: "50% 35%",
    tag: "Les grands jours",
    piece: "p8",
  },
] as const;

/** Les photos d'origine du bandeau. Le site sert désormais les vidéos
    ci-dessus ; elles restent la référence du back-office. */
export const HERO_SLIDES = [
  {
    src: "/images/hero/fille-cour.webp",
    alt: "Fillette en t-shirt gris et pantalon écru dans une cour à Dakar",
    pos: "52% 42%",
    tag: "Tous les jours",
    piece: "p5",
  },
  {
    src: "/images/hero/robe-rouge.webp",
    alt: "Fillette en robe de fête rouge à jupe de tulle",
    pos: "50% 26%",
    tag: "Les grands jours",
    piece: "p8",
  },
  {
    src: "/images/hero/garcon-cour.webp",
    alt: "Garçon en t-shirt écru et pantalon cargo noir dans une cour à Dakar",
    pos: "50% 42%",
    tag: "Pour eux aussi",
    piece: "p4",
  },
] as const;

/** Les enfants déjà habillés par la boutique, en petit, sous les avis. */
export const HERO_VIGNETTES = [
  cdn("enf1.jpg?v=1784389757&width=160"),
  cdn("enf2.jpg?width=160"),
  cdn("Ensemble_enfant-138.jpg?v=1785881597&width=160"),
];

export const LOGO = cdn("logo_mcommaman.png?v=1785937900&width=360");

export const byId = (id: string) => PRODUCTS.find((p) => p.id === id);
export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const countByAge = (age: Age) => PRODUCTS.filter((p) => p.age === age).length;

/** Fin de l'opération en cours. Le compte à rebours lit cette date : il ne peut pas rester figé. */
export const PROMO_END = "2026-09-08T23:59:00";
