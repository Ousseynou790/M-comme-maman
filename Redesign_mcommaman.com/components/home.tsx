"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal, useInView } from "./reveal";
import {
  Carousel,
  CountUp,
  GlowCard,
  Magnetic,
  Marquee,
  Parallax,
  ParallaxFond,
} from "./motion";
import { Hero } from "./hero";
import { ProductCard } from "./product-card";
import {
  IconArrow,
  IconArrowUp,
  IconLeaf,
  IconMail,
  IconQuote,
  IconRuler,
  IconShield,
  IconSmile,
  IconWhatsApp,
} from "./icons";
import { QuickView } from "./quick-view";
import { Countdown } from "./countdown";
import { Universes } from "./universes";
import { waLink } from "@/lib/format";
import { PRODUCTS, PROMO_END, type Product } from "@/lib/products";

const REASSURANCE = [
  { t: "Livraison 24 h", s: "Dakar et banlieue, appel avant passage" },
  { t: "Payez à la livraison", s: "Espèces ou Wave au livreur" },
  { t: "Échange 7 jours", s: "Mauvaise taille, on échange" },
  { t: "Une vraie personne", s: "WhatsApp répondu dans la journée" },
];

const TICKER = [
  "Livraison 24 h sur Dakar",
  "Paiement à la livraison",
  "Wave & Orange Money",
  "Échange sous 7 jours",
  "Stock réel, photos réelles",
  "Conseils de taille sur WhatsApp",
];

const cdn = (f: string) => `https://mcommaman.com/cdn/shop/files/${f}`;

/* Les portes d'entrée du catalogue, reprises de la maquette boty : une grande
   tuile puis quatre petites, la légende au-dessus du nom. On entre par qui
   porte la pièce plutôt que par le rayon — le rayon, lui, a sa section plus
   bas. La première tuile occupe deux colonnes et deux rangées.

   Les photos sont celles du shooting maison, servies depuis `public/` : des
   enfants habillés, pas des vêtements sur cintre. Seules les chaussures
   gardent leur visuel de catalogue, qui montre mieux la paire qu'un pied.
   `pos` recadre : ces tuiles sont larges, les photos sont hautes. */
const PORTES = [
  {
    t: "Filles",
    s: "Robes & jupes",
    href: "/boutique?g=fille",
    src: "/images/portes/filles.webp",
    pos: "50% 28%",
  },
  {
    t: "Garçons",
    s: "Ensembles & sweats",
    href: "/boutique?g=garcon",
    src: "/images/portes/garcons.webp",
    /* Deux enfants en pied dans une tuile paysage : centrée, la coupe passait
       sous les visages. On garde le haut. */
    pos: "50% 15%",
  },
  {
    t: "Bébés",
    s: "0 à 1 an",
    href: "/boutique?age=0-1",
    src: "/images/portes/bebes.webp",
    pos: "48% 42%",
  },
  {
    t: "Chaussures",
    s: "Pour bien grandir",
    href: "/boutique?cat=Chaussures",
    src: cdn("chass1.png?v=1784826770&width=900"),
    pos: "50% 50%",
  },
  {
    t: "Grands",
    s: "10 à 15 ans",
    href: "/boutique?age=10-15",
    src: "/images/portes/grands.webp",
    pos: "56% 38%",
  },
];

const TABS = [
  { key: "tous", label: "Tous" },
  { key: "fille", label: "Fille" },
  { key: "garcon", label: "Garçon" },
  { key: "0-1", label: "Bébé" },
];

/* Reprise de la section « Pourquoi M comme Maman » de la maquette boty :
   deux visuels décalés, la promesse, et quatre engagements. */
const PROMESSES = [
  { Icone: IconLeaf, t: "Matières saines", s: "Coton doux et respirant, testé pour les peaux fragiles." },
  { Icone: IconRuler, t: "Coupes bien pensées", s: "Des tailles justes qui laissent les enfants bouger librement." },
  { Icone: IconShield, t: "Fait pour durer", s: "Coutures renforcées qui résistent aux jeux et aux lavages." },
  { Icone: IconSmile, t: "Choisis avec amour", s: "Chaque pièce est sélectionnée par notre équipe de mamans." },
];

const STORY = [
  {
    k: "01",
    t: "Un carnet d'adresses",
    s: "Le nom vient de là : des mamans qui se passaient les bonnes pièces, avant qu'il n'y ait la moindre boutique.",
  },
  {
    k: "02",
    t: "Choisi à Dakar",
    s: "Chaque référence est vue, touchée, essayée sur de vrais enfants avant d'entrer au catalogue.",
  },
  {
    k: "03",
    t: "Livré en 24 h",
    s: "Un appel avant le passage, un livreur qui attend l'essayage, un échange si la taille ne va pas.",
  },
];


/* Le mot des mamans, repris de la maquette boty : trois avis choisis parmi
   ceux de la boutique, la note et la référence de commande qui les rend
   vérifiables. Avis fictifs en attendant qu'ils remontent du back-office. */
const REVIEWS = [
  {
    stars: 5,
    who: "Aminata Fall",
    ref: "CMD-2418",
    text: "Commandé le matin, livré le lendemain à Sacré-Cœur. La taille correspond vraiment à l'âge et le tissu ne gratte pas : mon fils l'a gardé toute la journée.",
  },
  {
    stars: 5,
    who: "Bineta Sarr",
    ref: "CMD-2402",
    text: "La robe en plumetis fait son effet. Ma fille l'a portée pour la Tabaski, tout le monde a demandé où je l'avais trouvée.",
  },
  {
    stars: 4,
    who: "Khady Ba",
    ref: "CMD-2391",
    text: "Babies très jolies et solides. Ma pointure manquait, mais on m'a prévenue du réassort sur WhatsApp et je l'ai eue trois jours après.",
  },
];

/* Les étoiles restent des glyphes : le projet n'embarque aucune bibliothèque
   d'icônes tierce, et un ★ garde la même graisse partout. */
function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span
      role="img"
      aria-label={`Noté ${String(note).replace(".", ",")} sur 5`}
      className="shrink-0 text-[15px] leading-none tracking-[2px] text-gold"
    >
      {"★".repeat(pleines)}
      <span className="text-gold/25">{"★".repeat(5 - pleines)}</span>
    </span>
  );
}

/* Les deux façons d'atteindre la boutique. Le numéro est celui de `WHATSAPP`,
   écrit ici en clair parce qu'il s'affiche autant qu'il sert de lien. */
const CONTACT = [
  {
    canal: "WhatsApp",
    valeur: "+221 76 208 02 02",
    delai: "Réponse dans la journée",
    href: waLink("Bonjour, j'ai une question"),
    externe: true,
    Icone: IconWhatsApp,
    pastille: "bg-rose text-white",
  },
  {
    canal: "Courriel",
    valeur: "mamand202122@gmail.com",
    delai: "Réponse sous 24 h",
    href: "mailto:mamand202122@gmail.com",
    externe: false,
    Icone: IconMail,
    pastille: "bg-gold text-ink",
  },
];

/* Le mot qui traverse la bande promo, en très grand et presque effacé. Assez
   d'entrées pour qu'une passe dépasse la largeur de l'écran : la piste est
   doublée puis translatée de moitié, une passe trop courte laisserait un trou. */
const RUBAN = ["Rentrée des classes", "−15 %", "Ensembles", "−15 %"];

/* Date de fin lue dans `PROMO_END`, sans passer par `Date` : le serveur et le
   navigateur n'ont pas forcément le même fuseau, et la journée aurait pu
   basculer entre les deux rendus. */
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const FIN_PROMO = (() => {
  const [, mois, jour] = PROMO_END.slice(0, 10).split("-");
  return `${Number(jour)} ${MOIS[Number(mois) - 1]}`;
})();

const SHELL = "mx-auto w-full max-w-[1400px] px-5 md:px-8 lg:px-10";
const H2 = "text-[clamp(1.95rem,3.8vw,2.6rem)] font-extrabold tracking-[-.032em]";
const EYEBROW = "text-[11px] font-bold uppercase tracking-[.16em] text-rose";

export function Home() {
  const [tab, setTab] = useState("tous");
  const [quick, setQuick] = useState<Product | null>(null);

  /* Pastille glissante sous l'onglet actif : on mesure le bouton, on déplace la pastille. */
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [railRef, railSeen] = useInView<HTMLDivElement>("0px 0px -15% 0px");

  useEffect(() => {
    const place = () => {
      const el = tabRefs.current[tab];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [tab]);

  const shown = PRODUCTS.filter((p) =>
    tab === "tous" ? true : tab === "0-1" ? p.age === "0-1" : p.gender === tab || p.gender === "mixte"
  );

  return (
    <>
      <Hero />


      {/* ================================================== bandeau défilant */}
      <section className="w-full border-b border-line bg-mist">
        <div className="marquee-hold relative overflow-hidden py-4 text-[12.5px] font-semibold uppercase tracking-[.09em] text-muted">
          <Marquee items={TICKER} duration={38} />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-mist to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-mist to-transparent" />
        </div>
      </section>

      {/* ======================================================= réassurance */}
      <section className={`${SHELL} pt-4`}>
        <Reveal className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4" stagger={80}>
          {REASSURANCE.map((r) => (
            /* Pas de <GlowCard> ici : sa lueur suit le curseur et teinte le
               fond. Ces quatre cartes gardent leur ivoire, elles se contentent
               de se soulever. */
            <div
              key={r.t}
              className="rounded-2xl bg-mist px-5 py-5 transition-transform duration-400 ease-soft hover:-translate-y-1"
            >
              <div className="text-[13.5px] font-bold">{r.t}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{r.s}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* =================================================== portes d'entrée */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3" variant="blur">
          <div>
            <span className={EYEBROW}>Trouver vite</span>
            <h2 className={`${H2} mt-2.5`}>Trouvez le style de chaque enfant</h2>
          </div>
          <Link href="/boutique" className="group text-sm font-semibold text-rose">
            Tout le catalogue
            <span className="ml-1.5 inline-block transition-transform duration-300 ease-soft group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>

        {/* Une grande tuile et quatre petites. Au doigt, la grande prend les
            deux colonnes : réduite au quart de l'écran, sa photo ne montrait
            plus rien. */}
        <Reveal
          className="grid auto-rows-[168px] grid-cols-2 gap-3.5 sm:auto-rows-[200px] lg:auto-rows-[215px] lg:grid-cols-4"
          stagger={110}
        >
          {PORTES.map((p, i) => (
            <Link
              key={p.t}
              href={p.href}
              className={`group relative overflow-hidden rounded-[24px] ${
                i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover transition-transform duration-[1100ms] ease-soft group-hover:scale-107"
                style={{ backgroundImage: `url(${p.src})`, backgroundPosition: p.pos }}
              />
              {/* Deux voiles : l'un pose le texte, l'autre teinte la photo de
                  la couleur de la maison au survol. */}
              <div className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-0 bg-rose/0 transition-colors duration-500 ease-soft group-hover:bg-rose/15" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-[12px] font-bold uppercase tracking-[.1em] text-white/70">
                  {p.s}
                </div>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div
                    className={`font-extrabold tracking-tight ${
                      i === 0 ? "text-[clamp(1.8rem,3.6vw,2.6rem)]" : "text-xl"
                    }`}
                  >
                    {p.t}
                  </div>
                  {/* La pastille arrive de la gauche au survol — rien au doigt,
                      où le lien tout entier est déjà la cible. */}
                  <span className="mb-1 grid h-9 w-9 shrink-0 -translate-x-2 place-items-center rounded-full bg-white text-ink opacity-0 transition-all duration-400 ease-back group-hover:translate-x-0 group-hover:opacity-100">
                    <IconArrowUp className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* ================================================ carrousel produits */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={EYEBROW}>La sélection</span>
            <h2 className={`${H2} mt-2.5`}>Ils vont adorer les porter</h2>
          </div>

          <div className="relative flex gap-1 rounded-full bg-stone p-1.5">
            <span
              aria-hidden
              className="absolute bottom-1.5 left-0 top-1.5 rounded-full bg-ink transition-[transform,width] duration-450 ease-back"
              style={{ transform: `translateX(${pill.left}px)`, width: pill.width, opacity: pill.width ? 1 : 0 }}
            />
            {TABS.map((t) => (
              <button
                key={t.key}
                ref={(el) => {
                  tabRefs.current[t.key] = el;
                }}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`relative z-10 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors duration-300 sm:px-4.5 ${
                  tab === t.key ? "text-white" : "text-[#6b5a61] hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Le rail est toujours rendu — les pièces doivent être dans le HTML
            servi. La clé change quand la section entre à l'écran et à chaque
            changement d'onglet : les cartes sont recréées et la cascade rejoue,
            jamais dans le vide pendant que la section est encore hors champ. */}
        <div ref={railRef}>
          <Carousel label="Sélection de pièces" key={`${tab}-${railSeen}`}>
            {shown.map((p, i) => (
              <div key={p.id} className="w-[68vw] sm:w-[42vw] md:w-[30vw] lg:w-[280px] xl:w-[300px]">
                <ProductCard
                  product={p}
                  onQuickView={setQuick}
                  delay={railSeen ? i * 70 : undefined}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* ============================================================ promo */}
      {/* Bande pleine largeur, trois plans à trois vitesses : la photo traîne
          derrière le défilement, le mot géant part à contresens, le texte ne
          bouge pas. C'est cet écart, et lui seul, qui creuse la profondeur —
          un fond qui glisse d'un bloc ne se voit même pas.
          La photo est affichée telle quelle : ni aplat sombre, ni voile, ni
          grain. La bande reste basse, à la hauteur d'un bandeau. */}
      <section className="relative isolate mt-16 overflow-hidden text-white md:mt-20">
        <ParallaxFond
          vitesse={0.42}
          zoom={0.09}
          marge={0.28}
          className="absolute inset-0 overflow-hidden"
        >
          <Image
            src="/images/hero/duo-pyjamas.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_38%]"
          />
        </ParallaxFond>

        {/* Le mot qui traverse. Piste doublée, translatée de moitié : reprendre
            `.marquee` à la main plutôt que le composant, dont le petit cœur de
            séparation n'a pas de sens à cette taille de lettre. */}
        <ParallaxFond
          vitesse={-0.16}
          marge={0.22}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div aria-hidden className="flex h-full items-center">
            <div
              className="marquee text-[clamp(3.2rem,10vw,8.5rem)] font-extrabold uppercase leading-none tracking-[-.045em] text-white/[.07]"
              style={{ "--dur": "58s" } as React.CSSProperties}
            >
              {[0, 1].map((passe) => (
                <div key={passe} className="flex shrink-0">
                  {RUBAN.map((mot, i) => (
                    <span key={i} className="whitespace-nowrap px-8">
                      {mot}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ParallaxFond>

        <Reveal className={`${SHELL} relative py-7 text-center md:py-8`} variant="blur">
          <span className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-gold">
            <span aria-hidden className="h-px w-9 bg-gold/50" />
            Offre à durée limitée
            <span aria-hidden className="h-px w-9 bg-gold/50" />
          </span>

          <h2 className="mx-auto mt-4 max-w-[16ch] text-[clamp(2rem,5.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-.035em] text-balance">
            Rentrée des classes
            <span className="mt-1 block bg-linear-to-r from-white via-gold to-white bg-clip-text text-transparent">
              −15 % sur les ensembles
            </span>
          </h2>

          <div className="mt-6 flex justify-center">
            <Countdown endsAt={PROMO_END} />
          </div>

          <div className="mt-7 flex flex-col items-center gap-3">
            <Magnetic>
              <Link
                href="/boutique?cat=Ensembles"
                className="shine group flex items-center gap-2.5 rounded-full bg-rose px-8 py-4 text-[14.5px] font-bold text-white shadow-[0_18px_42px_-16px_rgba(224,65,127,.9)]"
              >
                Voir la sélection
                <IconArrow className="h-4 w-4 transition-transform duration-300 ease-soft group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <span className="text-[12.5px] text-white/55">
              Jusqu&apos;au {FIN_PROMO}, dans la limite des stocks.
            </span>
          </div>
        </Reveal>
      </section>

      {/* ============================================ pourquoi M comme Maman */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <Reveal className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16" variant="blur">
          {/* Deux visuels décalés : le premier descend, la paire cesse d'être
              un bloc et devient une composition. */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {[
              { f: "/images/products/Ensemble_enfant-26-net-retouche.png", décalage: "mt-8" },
              { f: "/images/products/Ensemble_enfant-121-net-retouche.png", décalage: "" },
            ].map((v) => (
              <div
                key={v.f}
                className={`group relative aspect-3/4 overflow-hidden rounded-[24px] bg-stone ${v.décalage}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1100ms] ease-soft group-hover:scale-105"
                  style={{ backgroundImage: `url(${v.f})` }}
                />
              </div>
            ))}
          </div>

          <div>
            <span className={EYEBROW}>Pourquoi M comme Maman</span>
            <h2 className={`${H2} mt-2.5`}>Notre histoire</h2>
            <p className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-muted text-pretty">
              Nous choisissons chaque vêtement comme s&apos;il était pour nos propres enfants :
              doux au toucher, solide dans le temps et pensé pour le confort. C&apos;est notre
              promesse.
            </p>

            <div className="mt-7 grid gap-3.5 sm:grid-cols-2">
              {PROMESSES.map(({ Icone, t, s }) => (
                <div key={t} className="rounded-2xl bg-mist p-5">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose/10 text-rose">
                    <Icone />
                  </span>
                  <div className="text-[13.5px] font-bold">{t}</div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ========================================================== univers */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <Reveal className="mb-9 text-center">
          <span className={EYEBROW}>Nos univers</span>
          <h2 className={`${H2} mx-auto mt-2.5 max-w-[18ch] text-balance`}>
            Chaque rayon, sa pièce du moment
          </h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-[14.5px] leading-relaxed text-muted text-pretty">
            Cinq rayons, et pour chacun ce qui est réellement en stock aujourd&apos;hui. La pile
            tourne seule ; survolez une carte pour l&apos;arrêter.
          </p>
        </Reveal>

        <Reveal variant="scale">
          <Universes />
        </Reveal>
      </section>

      {/* ========================================================= histoire */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <div className="overflow-hidden rounded-[26px] bg-mist md:rounded-[30px]">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            {/* Le visuel reste accroché pendant que les trois temps défilent. */}
            <div className="lg:sticky lg:top-[104px] lg:h-[min(78vh,620px)] lg:self-start">
              <Parallax speed={26} className="h-full">
                <div className="flex h-full min-h-[240px] items-end bg-[repeating-linear-gradient(135deg,#f2e9ed_0_14px,#f7f0f3_14px_28px)] p-6">
                  <span className="text-[11.5px] font-semibold leading-relaxed text-muted">
                    photo à réaliser — mère et enfant
                    <br />
                    séance homogène, lumière naturelle
                  </span>
                </div>
              </Parallax>
            </div>

            <div className="px-6 py-12 sm:px-10 lg:py-16 lg:pl-12 lg:pr-14">
              <span className={EYEBROW}>Notre histoire</span>
              <h2 className="mt-3 text-[clamp(2.1rem,5vw,3rem)] font-extrabold leading-[1.04] tracking-[-.035em]">
                Le monde
                <br />
                des mamans
              </h2>

              <div className="mt-10 flex flex-col gap-9">
                {STORY.map((s) => (
                  <Reveal key={s.k} variant="left">
                    <div className="flex gap-5 border-t border-line pt-6">
                      <span className="text-[13px] font-extrabold tabular-nums text-rose">{s.k}</span>
                      <div>
                        <div className="text-[17px] font-bold tracking-tight">{s.t}</div>
                        <p className="mt-2 max-w-[46ch] text-[14.5px] leading-[1.7] text-[#6b5a61] text-pretty">
                          {s.s}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className="mt-11 flex flex-wrap gap-3">
                <Link
                  href="/boutique"
                  className="shine rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
                >
                  Voir la sélection
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border-[1.5px] border-[#e5d9de] bg-white px-6 py-3.5 text-sm font-semibold transition-colors duration-300 hover:border-rose hover:text-rose"
                >
                  Nous écrire
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= avis */}
      <section className={`${SHELL} pt-16 md:pt-20`}>
        <Reveal className="mb-7 text-center">
          <span className={EYEBROW}>Elles nous font confiance</span>
          <h2 className={`${H2} mt-2.5 text-balance`}>Le mot des mamans</h2>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-muted">
            <Etoiles note={4.9} />
            4,9/5 sur <CountUp to={126} /> avis
          </p>
        </Reveal>

        {/* Trois cartes de même hauteur : le médaillon et la note en tête, la
            citation au milieu, la cliente en pied derrière un filet. Sous
            `sm`, elles s'empilent — un avis coupé ne se lit pas. */}
        <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-3" stagger={90}>
          {REVIEWS.map((r) => (
            <article
              key={r.ref}
              className="flex min-h-[210px] flex-col rounded-[22px] bg-mist p-6 transition-transform duration-400 ease-soft hover:-translate-y-1"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-soft">
                  <IconQuote className="h-4 w-4 text-rose" />
                </span>
                <Etoiles note={r.stars} />
              </div>

              <p className="flex-1 text-[14.5px] leading-[1.65] text-[#3d2f35] text-pretty">
                «&nbsp;{r.text}&nbsp;»
              </p>

              <div className="mt-5 border-t border-line pt-3.5">
                <div className="text-[13px] font-bold">{r.who}</div>
                <div className="mt-0.5 text-xs text-muted">Cliente vérifiée · {r.ref}</div>
              </div>
            </article>
          ))}
        </Reveal>

        {/* Pas de page « tous les avis » ici : le dépôt passe par WhatsApp,
            comme le reste de la relation client. */}
        <div className="mt-7 text-center">
          <a
            href={waLink("Bonjour, j'ai reçu ma commande et je voudrais laisser un avis")}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#e5d9de] bg-white px-6 py-3.5 text-sm font-semibold transition-colors duration-300 hover:border-rose hover:text-rose"
          >
            Donner mon avis
            <IconArrow className="h-4 w-4 transition-transform duration-300 ease-soft group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* ================================================== nous contacter */}
      <Reveal className={`${SHELL} pt-16 md:pt-20`} variant="scale">
        <div className="noise relative overflow-hidden rounded-[26px] bg-ink px-6 py-16 text-center text-white md:rounded-[34px] md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="aurora absolute -left-20 top-0 h-80 w-80 rounded-full bg-rose/40 blur-[90px]" />
            <div className="aurora absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold/30 blur-[90px] [animation-delay:-11s]" />
          </div>

          <div className="relative">
            <span className="text-[11px] font-bold uppercase tracking-[.16em] text-gold">
              Une question ?
            </span>
            <h2 className="mx-auto mt-4 max-w-[16ch] text-[clamp(2.1rem,6vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-.038em] text-balance">
              Nous contacter
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/70 text-pretty">
              Une taille, une commande en cours, une pièce que vous cherchez : écrivez sur WhatsApp
              ou par courriel, une vraie personne répond.
            </p>

            {/* Deux entrées plutôt qu'un formulaire : la conversation reprend là
                où la cliente a déjà l'habitude d'écrire. */}
            <div className="mx-auto mt-9 grid max-w-[720px] gap-3.5 sm:grid-cols-2">
              {CONTACT.map((c) => (
                <a
                  key={c.canal}
                  href={c.href}
                  {...(c.externe ? { target: "_blank", rel: "noreferrer" } : null)}
                  className="flex items-center gap-4 rounded-[22px] border border-white/15 bg-white/5 p-5 text-left transition-all duration-400 ease-soft hover:-translate-y-1 hover:border-white/35 hover:bg-white/10"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.pastille}`}
                  >
                    <c.Icone className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold uppercase tracking-[.1em] text-white/50">
                      {c.canal}
                    </span>
                    <span className="mt-0.5 block truncate text-[14.5px] font-semibold">{c.valeur}</span>
                    <span className="block text-xs text-white/50">{c.delai}</span>
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-6 text-[13px] text-white/50">
              Lundi au samedi, 9 h – 19 h · Dakar, Sénégal
            </p>
          </div>
        </div>
      </Reveal>

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
