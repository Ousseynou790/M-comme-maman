# mcommaman — refonte

Vitrine **Next.js 15 (App Router) + TypeScript + Tailwind CSS 4**, sans autre dépendance.
Reprend à l'identique la maquette `Refonte mcommaman.dc.html`.

---

## Démarrer

```bash
cd react
npm install     # rétablit aussi les routes dynamiques (voir plus bas)
npm run dev
```

→ http://localhost:3000

> **Routes dynamiques.** L'export ne peut pas contenir de crochets dans les noms de dossier :
> `app/p/[slug]` est livré sous `app/p/-slug-`. Le script `scripts/fix-routes.mjs` les renomme,
> et il tourne automatiquement au `npm install`. Si besoin : `npm run fix-routes`.

---

## Routes

| Route | Fichier | Contenu |
|---|---|---|
| `/` | `app/page.tsx` → `components/home.tsx` | Bandeau d'accueil en arche (`components/hero.tsx`), bandeau défilant, réassurance, bento des âges, carrousel à onglets, compte à rebours, sélecteur d'univers en pile, histoire en défilement bloqué, paiements, avis en double rang, appel final |
| `/boutique` | `app/boutique/page.tsx` → `components/catalogue.tsx` | Facettes catégorie / âge / genre, recherche `?q=`, 4 tris, aperçu rapide, pas de pagination |
| `/p/[slug]` | `app/p/[slug]/page.tsx` | Galerie, variantes couleur / taille, accordéons, recommandations, JSON-LD Product |
| `/panier` | `app/panier/page.tsx` | Tunnel à l'étape 1 |
| `/commande` | `app/commande/page.tsx` | Tunnel à l'étape 2 : livraison → paiement → confirmation |
| `/contact` | `app/contact/page.tsx` | Formulaire + coordonnées + WhatsApp |
| `/infos/[slug]` | `app/infos/[slug]/page.tsx` | CGV, mentions légales, confidentialité, retours, livraison, FAQ |
| `/admin` | `app/admin/page.tsx` | Commandes, produits, stock, promotions |
| `/admin` → Produits → **Nouveau produit** | `components/product-form.tsx` | Création d'une fiche : identité, photos, prix, variantes, aperçu live |
| 404 | `app/not-found.tsx` | Page introuvable |

---

## Où brancher la base

Le catalogue est un tableau statique dans **`lib/products.ts`**, avec exactement la forme du
modèle Prisma de l'audit (prix en entier, `slug` distinct du `sku`, `age`, `gender`).
Pour passer en base : remplacer `PRODUCTS`, `bySlug` et `byId` par des requêtes serveur.
Aucun composant n'a besoin de changer.

**`lib/search.ts`** suit la même logique : l'index est construit une fois au chargement du
module, à partir de `PRODUCTS`. Chaque mot tapé doit se retrouver dans la fiche, le score
décide de l'ordre (nom > rayon > âge et genre > description). Le jour où le catalogue passe
en base, seule `chercherProduits` devient une requête serveur — sa signature ne bouge pas.
La palette (`components/search-overlay.tsx`) s'ouvre au clic, à `Ctrl/Cmd + K` et à `/`,
se pilote aux flèches, et renvoie sur `/boutique?q=…` pour la liste complète.

### Publication d'un produit

`components/product-form.tsx` applique le garde-fou de l'audit. Cinq conditions avant publication :
nom commercial de 4 caractères minimum, au moins une photo, prix supérieur à zéro, description de
20 caractères minimum, référence interne renseignée. Tant qu'il en manque une, seul
« Enregistrer en brouillon » est actif et le panneau latéral liste ce qui manque.

**À reproduire côté serveur.** Le contrôle est aujourd'hui dans le composant : un appel direct à
l'API le contournerait. La règle doit vivre dans la couche de validation avant l'écriture en base.

Trois points repris de l'audit et déjà tenus dans le code :

- **Prix en entiers** (`price: 12000`), jamais de `Float` — `lib/format.ts` gère l'affichage.
- **Compte à rebours piloté par une date** (`PROMO_END`) : `components/countdown.tsx` ne rend
  rien quand l'échéance est passée, au lieu d'afficher 00:00:00:00.
- **Référence interne séparée du nom** : `sku` est affiché en petit sur la fiche, jamais en titre.

---

## Animations

Toujours aucune bibliothèque. Les keyframes vivent dans `app/globals.css`, les primitives
réutilisables dans `components/motion.tsx` et `components/reveal.tsx`.

| Effet | Où |
|---|---|
| Rail produits qui défile seul en boucle, tiré à la souris, flèches et barre d'avancement | `<Carousel speed={46}>` |
| Pile verticale des univers, visuels latéraux qui se substituent | `components/universes.tsx` |
| Arche du bandeau d'accueil qui monte à l'ouverture | `.anim-arch` |
| Trait dessiné sous le mot d'accent | `.anim-draw` + `--len` sur le `<path>` |
| Révélation au défilement, 5 variantes (`up`, `blur`, `scale`, `left`, `right`) | `<Reveal variant="…">` |
| Cascade des enfants d'une grille | `<Reveal stagger={90}>` → classe `.stagger` |
| Titre d'accueil mot à mot, derrière un masque | `<SplitText>` + `.word-mask` |
| Chiffres qui comptent à l'apparition | `<CountUp>` (rAF, `easeOut`) |
| Travelling lent sur la photo d'accueil | `.anim-ken` |
| Points cliquables posés sur une photo | `.hotspot` (libre d'emploi) |
| Halos colorés qui dérivent en fond | `.aurora` |
| Bandeau défilant en boucle, dans les deux sens | `<Marquee>`, `.marquee-rev` |
| Étiquette « Voir » qui suit le curseur sur un visuel | `<CursorTag>` |
| Lueur et inclinaison 3D suivant le curseur | `<GlowCard tilt={5}>`, `useSpotlight` |
| Bouton attiré par le curseur | `<Magnetic>` |
| Photo qui traîne derrière le défilement | `<Parallax speed={26}>` |
| Barre de lecture sous le header | `<ScrollProgress>` |
| Pastille glissante sous l'onglet actif | mesure des boutons dans `components/home.tsx` |
| Reflet qui traverse un bouton au survol | `.shine` |
| Zoom image au survol des cartes | `group-hover:scale-108` sur `components/product-card.tsx` |
| Impulsion de la pastille panier | `anim-pop` + `key={pulse}` dans `components/header.tsx` |
| Bascule des secondes, rotation du bandeau d'annonce | `anim-tick` + `key` sur la valeur |
| Méga-menu « Boutique » au survol et au clavier | `group-hover` / `group-focus-within` dans `components/header.tsx` |
| Ouverture de la palette de recherche | `.anim-veil` + `.anim-pop-in` |
| Ouverture du panier / modale | `anim-slide-in`, `anim-fade-up` |

Deux règles tenues partout :

- **`animation-fill-mode: backwards`, jamais `forwards`.** Une animation remplie vers l'avant garde
  son dernier keyframe en priorité sur les déclarations normales : `transform: none` neutraliserait
  définitivement les `hover:-translate-y` et les inclinaisons des cartes.
- **Un bloc `prefers-reduced-motion`** en fin de `globals.css` coupe animations, transitions et
  inclinaisons. Les hooks JS (`Parallax`, `useSpotlight`, `Magnetic`, `CountUp`) testent la même
  media query avant de poser le moindre écouteur.

`CountUp` rend la valeur finale côté serveur et la remet à zéro en `useLayoutEffect` : sans
JavaScript, le chiffre affiché reste juste.

**Le carrousel est toujours rendu**, jamais monté à l'apparition : les douze pièces doivent être
dans le HTML servi, pour les moteurs comme pour un navigateur sans JavaScript. C'est sa `key` qui
change quand la section entre à l'écran — les cartes sont recréées et la cascade rejoue au bon
moment. Une traînée de plus de 4 px avale le clic de fin de geste, sinon déplacer le rail
finirait par ouvrir une fiche produit.

**Le défilement automatique** avance à 46 px par seconde. La piste est doublée côté client
seulement — le HTML servi ne contient qu'un exemplaire de chaque pièce, la copie est `inert` et
`aria-hidden` pour ne pas être annoncée deux fois. Arrivé au bout de la première piste, on
retranche sa largeur : le saut tombe sur une image identique et ne se voit pas.

Il s'arrête dès que quelqu'un s'en occupe — survol, traînée, molette, doigt, flèches, focus
clavier — et reprend 2,6 s après. Il ne démarre pas du tout quand l'onglet est en arrière-plan,
quand le mouvement réduit est demandé, ou quand les pièces filtrées tiennent déjà dans la largeur
(l'onglet « Bébé » et ses deux pièces retrouvent alors un rail simple, avec aimantation).

La position est tenue en flottant dans une ref plutôt que lue depuis `scrollLeft` : les
sous-pixels seraient perdus d'une image à l'autre et le défilement avancerait par à-coups.

### Le sélecteur d'univers

`components/universes.tsx` — la pile verticale reprise de l'ancien site. La carte active au
centre, ses voisines en retrait, les deux pièces de la catégorie en grand de part et d'autre.
Chaque carte est positionnée à partir de la **distance signée la plus courte** jusqu'à l'active,
pas de son index : la pile boucle donc dans les deux sens sans saut.

Rien n'y est écrit à la main. Les cinq univers viennent de `CATEGORIES`, le décompte et les
photos de `PRODUCTS`, et la ligne « Les filles » / « Les garçons » / « Filles & garçons » est
déduite des `gender` de la catégorie.

**Quand une catégorie n'a qu'une pièce** — Chaussures et T-shirts aujourd'hui — le panneau de
droite l'écrit au lieu de répéter la même photo à gauche et à droite. Même principe que le compte
à rebours qui disparaît plutôt que d'afficher 00:00:00:00 : la page ne fait pas semblant d'avoir
du stock.

---

## Images

Elles pointent encore vers le CDN Shopify actuel (`mcommaman.com/cdn/shop/files/…`), autorisé
dans `next.config.ts`. C'est provisoire : la phase 0 de l'audit prévoit une séance photo homogène.
Le bloc « Notre histoire » de l'accueil affiche volontairement un aplat rayé légendé
« photo à réaliser » plutôt qu'une photo produit détournée.

Le catalogue de démonstration compte **12 pièces réellement photographiées** sur les 19 références
de la boutique. Les noms, catégories et descriptions correspondent à ce qui est dans le cadre.

### Une seule photo d'ambiance

Le CDN a été sondé. Trois fichiers seulement sont exploitables en grand :
`8wy1hz0j.png` (924 × 1109, une enfant en robe fleurie sur fond clair), `enf1.jpg`
(1600 × 1073, deux enfants sur fond jaune) et `0804-Couverture.jpg`, inutilisable.
`enf2.jpg` ne fait que 236 × 319. Tout le reste, ce sont des pièces sur cintre sur
fond dégradé.

C'est ce qui dicte la construction du bandeau d'accueil : **une** photo, et une
forme qui la met en valeur au lieu d'en réclamer d'autres. `8wy1hz0j.png` est
cadrée en arche (`rounded-t-[999px]`), posée sur un lavis ivoire, et la robe
qu'elle porte est justement au catalogue — la pastille « Sur elle » renvoie à sa
fiche. `enf1` et `enf2` ne servent plus qu'en vignettes de 44 px sous les avis,
où leur définition suffit.

Le sujet doit rester **centré et sur fond calme** : la courbe de l'arche rogne les
angles hauts, une photo cadrée serré y perdrait une tête. Le cadrage est réglé par
`object-[50%_35%]` dans `components/hero.tsx`.

**Après la séance photo**, deux chemins : garder l'arche et ne remplacer que
`HERO_PORTRAIT` dans `lib/products.ts`, ou passer à un vrai diaporama — il faudra
alors quatre ou cinq photos de vie de ce niveau.

---

## À faire avant la mise en ligne

1. Séance photo homogène, puis remplacement des URL du CDN Shopify
2. Prisma + PostgreSQL (Neon), migration des 19 produits avec de vrais noms commerciaux
3. PayDunya : webhook signé, identifiant de transaction en clé unique, idempotence
4. Paiement à la livraison conditionné à la zone
5. Resend pour les e-mails de confirmation
6. NINEA et registre du commerce à renseigner dans `lib/legal.ts`
7. Test sur vrai téléphone en 4G — la cible est mobile
