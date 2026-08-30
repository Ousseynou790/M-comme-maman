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
| `/` | `app/page.tsx` → `components/home.tsx` | Bandeau d'accueil en arche (`components/hero.tsx`), bandeau défilant, réassurance, bento des âges, carrousel à onglets, compte à rebours, sélecteur d'univers en pile, histoire en défilement bloqué, paiements, le mot des mamans, section « Nous contacter » |
| `/boutique` | `app/boutique/page.tsx` → `components/catalogue.tsx` | Facettes catégorie / âge / genre, recherche `?q=`, 4 tris, aperçu rapide, pas de pagination |
| `/p/[slug]` | `app/p/[slug]/page.tsx` | Galerie, variantes couleur / taille, accordéons, recommandations, avis de l'article, JSON-LD Product |
| `/panier` | `app/panier/page.tsx` | Tunnel à l'étape 1 |
| `/commande` | `app/commande/page.tsx` | Tunnel à l'étape 2 : livraison validée → paiement → commande enregistrée |
| `/commandes` | `app/commandes/page.tsx` → `components/orders-list.tsx` | Historique et avancement de chaque colis |
| `/commandes/[ref]` | `app/commandes/[ref]/page.tsx` → `components/order-detail.tsx` | Suivi détaillé, frise en quatre temps, recommander, annuler |
| `/favoris` | `app/favoris/page.tsx` → `components/favorites-page.tsx` | Pièces mises de côté, tout ajouter au panier, vider la liste |
| `/avis` | `app/avis/page.tsx` → `components/reviews-page.tsx` | Note moyenne, distribution, avis boutique et articles, dépôt réservé aux commandes reçues |
| `/contact` | `app/contact/page.tsx` | Formulaire + coordonnées + WhatsApp |
| `/compte` | `app/compte/page.tsx` → `components/account-dashboard.tsx` | Tableau de bord : dernière commande, panier en cours, mes envies, adresse par défaut |
| `/compte/connexion` | `app/compte/connexion/page.tsx` → `components/account-auth.tsx` | Connexion, redirection `?suite=` |
| `/compte/inscription` | `app/compte/inscription/page.tsx` → `components/account-auth.tsx` | Création de compte, six règles de validation, jauge de mot de passe |
| `/compte/profil` | `app/compte/profil/page.tsx` → `components/account-profile.tsx` | Informations, carnet d'adresses, tailles suivies, mot de passe, suppression |
| `/infos/[slug]` | `app/infos/[slug]/page.tsx` | CGV, mentions légales, confidentialité, retours, livraison, FAQ |
| `/admin/connexion` | `app/admin/connexion/page.tsx` | Entrée du back-office, identifiants de démonstration affichés |
| `/admin` | `app/admin/(espace)/page.tsx` | Tableau de bord : huit tuiles de rubrique, chacune avec son chiffre |
| `/admin/statistiques` | `app/admin/(espace)/statistiques/page.tsx` | Indicateurs comparés, ventes jour par jour, rayons, paiements, villes, fiches sans vente, journal |
| `/admin/commandes` | `app/admin/(espace)/commandes/page.tsx` | Liste filtrable, détail en fenêtre, avancement du statut |
| `/admin/produits` | `app/admin/(espace)/produits/page.tsx` | Catalogue, stock corrigé sur place, publier / dépublier / dupliquer / supprimer |
| `/admin/produits/nouveau`, `/admin/produits/[id]` | `components/product-form.tsx` | Éditeur de fiche : identité, photothèque, prix, variantes, aperçu live, cinq conditions de publication |
| `/admin/categories` | `app/admin/(espace)/categories/page.tsx` | Catégories, visuel, renvois symétriques, visibilité |
| `/admin/promotions` | `app/admin/(espace)/promotions/page.tsx` | Campagnes en bons de réduction, onglets par statut, avancement, tiroir de saisie |
| `/admin/clients` | `app/admin/(espace)/clients/page.tsx` | Fichier clientes, segments déduits, commandes de chacune |
| `/admin/configuration` | `app/admin/(espace)/configuration/page.tsx` | Tailles, coloris, matières, photothèque |
| `/admin/reglages` | `app/admin/(espace)/reglages/page.tsx` | Identité, livraison, bandeau, photos d'accueil, remise à zéro |
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

### Espace client

**`components/auth-context.tsx`** tient les comptes : inscription, connexion, profil, carnet
d'adresses, tailles suivies, changement de mot de passe, suppression. Deux clés de stockage —
`mcm-comptes-v1` pour la liste, `mcm-session-v1` pour la session — et un écouteur `storage` pour
qu'une connexion faite dans un autre onglet suive. Le mot de passe est haché en SHA-256 avec un
sel tiré au hasard (`crypto.subtle`, donc contexte sécurisé obligatoire : https ou localhost).

**Ce n'est pas une authentification.** Tout vit dans le navigateur : la liste des comptes est
lisible, la session remplaçable. La mise en ligne demande des comptes en base, un hachage lent
côté serveur (bcrypt ou argon2), une session en cookie HttpOnly et la vérification de l'adresse
e-mail. La note en bas de `auth-context.tsx` le redit.

Ce que le compte change ailleurs : l'en-tête montre les initiales et mène à `/compte` ; l'étape
Livraison du tunnel se pré-remplit depuis l'adresse par défaut, et propose de se connecter
sinon. Les zones de livraison, partagées entre le tunnel et le carnet d'adresses, vivent dans
**`lib/livraison.ts`**.

### Favoris

**`components/favorites-context.tsx`** tient la liste (clé `mcm-favoris-v1`) : le dernier cœur
touché passe en tête, un écouteur `storage` reflète ce qui se fait dans un autre onglet. Le cœur
lui-même est un seul composant, **`components/favorite-button.tsx`** — posé sur une carte, il
intercepte le clic pour ne pas partir sur la fiche ; il se dessine vide tant que le stockage n'a
pas été relu, sinon le premier rendu ne serait pas le même côté serveur et client.

Le même cœur sert partout : carte de la boutique, aperçu rapide, fiche produit, et sur
`/favoris` où il fait office de retrait. La page reprend les cartes de la boutique plutôt qu'un
gabarit à part, ajoute une barre de tête (nombre d'articles, total, **Tout ajouter au panier**,
**Vider la liste** en deux temps) et signale les identifiants qui ne correspondent plus à aucun
article du catalogue au lieu de tomber dessus.

**La liste ne suit pas le compte.** Ouverte sur un autre téléphone, elle est vide, même
connectée. En ligne la table est courte — `(compte, produit, date)` avec une contrainte
d'unicité — et la liste du navigateur doit se **fondre** dans celle du compte à la connexion :
une cliente qui met des pièces de côté avant de créer son compte ne doit pas les perdre en le
créant.

### Commandes et suivi

**`components/orders-context.tsx`** enregistre la commande à la validation : référence
`MCM-2026-0001` tirée du nombre de commandes déjà passées, cinq statuts (`recue` →
`preparation` → `expediee` → `livree`, plus `annulee`), clé `mcm-commandes-v1`. Une commande
s'annule tant qu'elle est encore « reçue », et se remet au panier en un clic — chaque ligne
garde ses indices de couleur et de taille pour ça.

Le tunnel (`components/checkout.tsx`) valide vraiment : nom, téléphone, quartier et point de
repère sont obligatoires, l'e-mail est facultatif mais vérifié s'il est saisi, et les messages
n'apparaissent qu'au `blur` ou à la tentative de passage. Le paiement à la livraison disparaît
hors de Dakar. La remise n'est plus appliquée d'office : il faut saisir le code (`CODES` dans
`lib/livraison.ts`).

### Panier

**`components/cart-context.tsx`** parle au serveur. Ce qu'on met dans le panier est une
**variante** — un produit dans une taille et un coloris — et non un produit : deux tailles du
même article n'ont ni le même stock ni la même disponibilité, et c'est la variante que la
commande achètera. La fiche (`components/product-detail.tsx`) et l'aperçu rapide n'offrent donc
plus les tailles de référence mais celles que le serveur déclare, et une taille absente du
coloris choisi se barre au lieu de se proposer.

Deux régimes, comme les favoris. Hors session le panier reste dans le navigateur
(`mcm-panier-v2` — nouvelle clé : l'ancienne gardait des indices de couleur et de taille qui ne
veulent plus rien dire). À la connexion il remonte par `POST /api/compte/panier/fusionner/`,
qui garde **la plus grande des deux quantités et non leur somme** : se reconnecter sur le même
appareil ne doit pas doubler le panier.

C'est le serveur qui arbitre le stock — `add`, `setQuantity` et `remove` adoptent sa réponse
plutôt que de la deviner. Une ligne devenue inservable (rupture, fiche dépubliée) **reste
visible et se signale** au lieu de disparaître, et `complet` ferme la caisse tant qu'elle est
là : un panier qui maigrit tout seul est incompréhensible.

**Le statut ne bouge pas tout seul.** Rien ne le fait avancer côté client — c'est le
back-office qui le pilotera. En ligne, il faudra aussi : commande écrite en base, référence
tirée d'une séquence serveur, et validation du paiement par le webhook signé du prestataire,
jamais par le retour du navigateur.

### Avis

**`components/reviews-context.tsx`** tient les avis (clé `mcm-avis-v1`), sur un article
(`{ kind: "product", productId }`) ou sur la boutique (`{ kind: "shop" }`). `aggregate()`
recalcule la moyenne — arrondie à une décimale — et la distribution des cinq notes à chaque
lecture : plus aucun chiffre d'avis n'est écrit en dur. La fiche produit et la page d'accueil
affichent donc « aucun avis » tant que personne n'a écrit, au lieu d'inventer un 4,8.

**Le droit d'écrire vient d'une commande reçue.** `components/review-form.tsx` cherche une
commande au statut `livree` qui porte l'article (n'importe laquelle pour la boutique) ; sans
elle, le formulaire reste affiché et explique pourquoi il est fermé. Un compte n'a qu'un avis
par cible : le suivant remplace le précédent, et chacune supprime le sien.

Le statut n'avançant pas tout seul, la page de suivi porte un bouton **« J'ai reçu ma
commande »** (`confirmDelivery`) — c'est le seul évènement qui fait passer une commande à
`livree` aujourd'hui, et donc ce qui ouvre le dépôt d'avis.

Sur la page d'accueil, les trois avis d'exemple de `REVIEWS` ne servent que tant qu'aucun avis
boutique n'existe ; dès le premier déposé, ce sont les vrais qui s'affichent, avec la vraie
moyenne à la place du « 4,9/5 sur 126 avis ».

**À reproduire côté serveur.** La vérification est ici côté client : éditer le stockage suffit
à la contourner. En ligne, l'avis se rattache à une ligne de commande livrée, l'unicité se
tient en base, et la modération annoncée demande un vrai passage en revue avant publication.

### Back-office

Il était une maquette : `components/admin.tsx` affichait des tableaux écrits en dur, et
`lib/admin/{types,seed,store}.ts(x)` — 1 300 lignes déjà à la bonne forme — n'était importé par
personne. Le magasin est maintenant branché, et la maquette a été supprimée.

**`lib/admin/store.tsx`** tient tout le back-office dans une seule clé (`mcm-admin-v1`) :
produits, commandes, clientes, rayons, promotions, bibliothèque, réglages, bandeau d'accueil et
journal des actions. Il expose une vingtaine de mutations et, à côté, les fonctions dérivées —
`computePeriod`, `buildDailySeries`, `computeProductPerformance`, `computeCustomerStats`. Aucun
chiffre n'est écrit dans une page : tout se recalcule à partir des commandes.

**`migrer()` accompagne chaque changement de forme.** Un navigateur qui a déjà l'ancien format
lit `undefined` et la page tombe ; toute modification de `AdminState` doit ajouter son entrée.

**La navigation reprend celle de 3001** — mêmes libellés, même ordre — pour qu'on passe de l'un à
l'autre sans se réapprendre le menu. La palette de commandes (Ctrl/⌘ + K) cherche dans les pages,
les fiches, les commandes et les clientes ; Entrée ouvre le premier résultat.

**Les promotions** sont la page la plus travaillée, reprise trait pour trait de 3001 : campagnes
en bons de réduction (talon, encoches, pointillé), onglets Toutes / En cours / Programmées /
Terminées avec leurs compteurs, barre d'avancement et « N j restants », portée résumée en une
phrase, et un tiroir latéral pour la saisie — durées proposées, pastilles de choix expliquées,
et la cascade rayon → article plutôt qu'une liste de tout le catalogue.

**La pagination est dans la primitive**, pas dans les pages : `usePagination` découpe une liste et
`Pagination` dessine la barre ; `Table` s'en sert tout seul, avec `pageSize` et le nom de ce qu'on
compte (« 1–20 sur 243 commandes »). Les deux grilles de cartes — promotions et catégories — les
appellent directement. Un changement de filtre ou de recherche ramène en page 1, et la page
courante se recale d'elle-même quand une suppression raccourcit la liste.

L'interface tient en deux fichiers de base : **`components/admin/ui.tsx`** (tableau en grille CSS,
pastilles de statut, champs, fenêtre modale, suppression en deux temps, barres dessinées à la
main) et **`components/admin/shell.tsx`** (le portier et la chrome). Les icônes ont leur propre
jeu, `components/admin/icons.tsx`, séparé de celui de la vitrine.

Le fournisseur ne descend que sur `/admin` (`app/admin/layout.tsx`) : la vitrine n'a pas à porter
un état qu'elle n'ouvre jamais. Le groupe `(espace)` porte le portier et la chrome ;
`/admin/connexion` reste en dehors, sinon la page de connexion serait elle-même protégée.

**Le portier n'est pas une sécurité.** Il regarde une clé du navigateur, et les identifiants de
démonstration sont écrits en clair dans la page de connexion
(`ousseynou@mcommemaman.sn` / `mcm2026`). Tant que le back-office ne modifie qu'un état local,
c'est sans conséquence. Dès qu'il écrit en base, il faut un vrai compte administrateur, une
session en cookie signé, et la vérification du rôle sur le serveur à **chaque** écriture.

**Deux ponts manquent encore**, et le back-office le dit lui-même sur les pages concernées :

- Les commandes et les comptes de la vitrine (`mcm-commandes-v1`, `mcm-comptes-v1`) vivent dans le
  navigateur de chaque cliente et ne remontent pas ici. C'est pour ça que le suivi de commande de
  la vitrine se termine par un bouton « J'ai reçu ma commande » plutôt que par un statut piloté.
- Ce que l'on modifie ici ne redescend pas sur la vitrine, qui lit encore ses constantes
  (`lib/products.ts`, `lib/livraison.ts`, `components/hero.tsx`). Sur 3001 le pont existe : la
  vitrine ouvre la clé du back-office à la main.

### Publication d'un produit

`components/product-form.tsx` est le seul éditeur : sans `product` il crée, avec il modifie, et il
écrit dans le magasin. Les coloris, tailles et matières ne s'y saisissent pas — ils viennent de la
bibliothèque, ce qui évite « rose poudré » d'un côté et « Rose Poudre » de l'autre. Il applique le
garde-fou de l'audit : cinq conditions avant publication —
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
4. Paiement à la livraison conditionné à la zone — fait côté client, reste à refuser côté serveur
5. Resend pour les e-mails de confirmation
6. Comptes clients côté serveur : `auth-context.tsx` en est la maquette, pas l'implémentation
7. NINEA et registre du commerce à renseigner dans `lib/legal.ts`
8. Back-office réel : compte administrateur en base, session en cookie signé, rôle vérifié à chaque écriture
9. Ponts back-office ↔ vitrine : commandes et comptes remontés, réglages et catalogue redescendus
10. Favoris rattachés au compte en base, fusion de la liste du navigateur à la connexion
11. Avis vérifiés côté serveur : rattachement à une ligne de commande livrée, unicité, modération
12. Test sur vrai téléphone en 4G — la cible est mobile
