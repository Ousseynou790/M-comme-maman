"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CountUp, Magnetic, SplitText, useSpotlight } from "./motion";
import { IconArrow, IconWhatsApp } from "./icons";
import { formatXOF, waLink } from "@/lib/format";
import { HERO_SLIDES, HERO_VIGNETTES, byId } from "@/lib/products";

/* ------------------------------------------------------------------ la parole
   Tout le texte du bandeau tient ici : la pastille, trois lignes de titre dont
   la dernière porte l'accent, et le chapô. Changer l'accroche, c'est changer
   ces quatre constantes. Les photos, elles, sont dans `HERO_SLIDES`
   (lib/products.ts). */

const EYEBROW = "Nouvelle collection · 2026";
const TITRE_HAUT = "Des looks \n qui suivent";
const TITRE_ACCENT = "leurs aventures.";
const CHAPO =
  "Des pièces joyeuses, faciles à vivre et choisies avec le regard exigeant d’une maman.";

/* Le titre ne bouge pas d'une photo à l'autre : c'est la promesse de la
   boutique, pas une légende. Seuls la photo, son étiquette et la pièce
   proposée en dessous changent. */

/** Temps d'affichage d'une photo. La barre de progression lit la même valeur. */
const DUREE = 6500;

/** Un halo par photo : le fond se teinte de ce que la photo a de dominant. */
const HALOS = ["bg-gold-soft/85", "bg-rose-soft/85", "bg-gold-soft/85"];

export function Hero() {
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);

  const slide = HERO_SLIDES[actif];
  const vedette = byId(slide.piece);

  /* L'inclinaison est portée par un calque au-dessus de l'arche : posée sur
     l'arche elle-même, elle se battrait avec l'animation d'entrée, qui écrit
     déjà dans `transform`. */
  const inclinaison = useSpotlight<HTMLDivElement>(5);

  /* Minuteur relancé à chaque changement : cliquer une barre redonne le temps
     de plein, au lieu d'enchaîner sur le reliquat du tour précédent. */
  useEffect(() => {
    if (pause) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(
      () => setActif((a) => (a + 1) % HERO_SLIDES.length),
      DUREE
    );
    return () => window.clearTimeout(t);
  }, [actif, pause]);

  return (
    <section className="hero-canvas relative isolate overflow-hidden">
      {/* Fond : une trame de points qui s'éteint sur les bords, deux halos très
          lents. Rien de tout cela ne doit se remarquer — seulement se sentir. */}
      <div aria-hidden className="hero-dots pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-rose/15 blur-[120px]" />
        <div className="aurora absolute -right-32 bottom-0 h-[440px] w-[440px] rounded-full bg-gold/25 blur-[110px] [animation-delay:-11s]" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 pb-16 pt-12 md:px-8 md:pt-14 lg:min-h-[calc(100svh-118px)] lg:grid-cols-12 lg:items-center lg:gap-0 lg:px-10 lg:pb-0 lg:pt-0">
        {/* --------------------------------------------------------- le texte
            Les deux colonnes partagent la colonne 7 : le titre passe devant
            l'arche, et le bandeau gagne la profondeur qu'une grille sagement
            découpée n'a jamais. */}
        <div className="relative z-20 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:py-16">
          <span className="anim-hero inline-flex items-center gap-2.5 rounded-full border border-line bg-white/75 px-4 py-2 text-[11.5px] font-bold backdrop-blur-sm sm:text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose" />
            </span>
            {EYEBROW}
          </span>

          <h1 className="mt-6 max-w-[16ch] text-[clamp(2.4rem,5.6vw,4.6rem)] font-extrabold leading-[.94] tracking-[-.045em] sm:mt-7">
            <SplitText text={TITRE_HAUT} delay={120} />
            <br />
            {/* Le trait est posé hors du masque : `word-mask` coupe ce qui
                dépasse, il l'aurait avalé. */}
            <span className="relative inline-block">
              <span className="word-mask">
                <span
                  className="bg-linear-to-r from-rose via-[#ff7fae] to-gold bg-clip-text text-transparent"
                  style={{ animationDelay: "540ms" }}
                >
                  {TITRE_ACCENT}
                </span>
              </span>
              <svg
                viewBox="0 0 300 16"
                fill="none"
                aria-hidden
                className="pointer-events-none absolute -bottom-2.5 left-0 w-full sm:-bottom-4"
              >
                <defs>
                  <linearGradient id="trait-hero" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#e0417f" />
                    <stop offset="1" stopColor="#f0c24a" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 11C50 4.2 108 3 154 6.4c44 3.2 92 4.6 142 1.4"
                  stroke="url(#trait-hero)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  className="anim-draw"
                  style={{ "--len": 320 } as React.CSSProperties}
                />
              </svg>
            </span>
          </h1>

          {/* `mt-11` et non `mt-8` : le trait dessiné descend sous la dernière
              ligne du titre, il lui faut cet air-là. */}
          <p className="anim-hero mt-11 max-w-[46ch] text-[15px] leading-[1.7] text-muted text-pretty sm:text-base [animation-delay:760ms]">
            {CHAPO}
          </p>

          <div className="anim-hero mt-8 flex flex-col gap-3 sm:flex-row sm:items-center [animation-delay:820ms]">
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="/boutique"
                className="shine group flex items-center justify-center gap-2.5 rounded-full bg-rose px-8 py-4 text-[14.5px] font-bold text-white shadow-[0_18px_42px_-16px_rgba(224,65,127,.85)]"
              >
                Découvrir la boutique
                <IconArrow className="h-4 w-4 transition-transform duration-300 ease-soft group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic strength={7} className="w-full sm:w-auto">
              <a
                href={waLink("Bonjour, je voudrais un conseil de taille")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-full border border-ink/15 bg-white/70 px-7 py-4 text-[14.5px] font-bold backdrop-blur-sm transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-cream"
              >
                <IconWhatsApp className="h-[18px] w-[18px] text-[#25d366]" />
                Contactez-nous sur WhatsApp
              </a>
            </Magnetic>
          </div>

          <div className="anim-hero mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 [animation-delay:900ms]">
            <div className="flex -space-x-3">
              {HERO_VIGNETTES.map((src, i) => (
                <span
                  key={src}
                  className="relative h-11 w-11 overflow-hidden rounded-full ring-3 ring-cream"
                  style={{ zIndex: HERO_VIGNETTES.length - i }}
                >
                  <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                </span>
              ))}
            </div>
            <div>
              <div className="text-[13px] tracking-[3px] text-gold">★★★★★</div>
              <div className="mt-0.5 text-[12.5px] font-medium text-muted">
                <CountUp to={126} /> avis de mamans · 4,9 sur 5
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- l'arche
            Une seule photo à la fois, cadrée en arche : la forme fait le
            travail que trois visuels empilés faisaient mal. Les photos se
            relaient toutes seules, et s'arrêtent dès qu'on s'en approche. */}
        <div
          className="relative z-10 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:py-16"
          onPointerEnter={() => setPause(true)}
          onPointerLeave={() => setPause(false)}
          onFocusCapture={() => setPause(true)}
          onBlurCapture={() => setPause(false)}
        >
          <div className="relative mx-auto w-full max-w-[420px] lg:ml-auto lg:mr-0 lg:max-w-[480px]">
            <div
              aria-hidden
              className={`absolute -inset-5 rounded-t-full blur-2xl transition-colors duration-1000 ${HALOS[actif]}`}
            />

            <div ref={inclinaison} className="tilt">
              <div className="anim-arch relative aspect-4/5 overflow-hidden rounded-t-[999px] rounded-b-[32px] bg-stone shadow-[0_60px_110px_-55px_rgba(36,26,32,.6)] ring-1 ring-ink/5">
                {/* Les trois photos restent empilées : un fondu enchaîné ne peut
                    pas se faire si l'ancienne est démontée avant la nouvelle. */}
                {HERO_SLIDES.map((s, i) => (
                  <Image
                    key={s.src}
                    src={s.src}
                    alt={i === actif ? s.alt : ""}
                    aria-hidden={i !== actif}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 90vw, 480px"
                    style={{ objectPosition: s.pos }}
                    className={`object-cover transition-[opacity,transform] duration-[1400ms] ease-soft ${
                      i === actif ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
                    }`}
                  />
                ))}

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/12 via-transparent to-transparent"
                />
              </div>
            </div>

            {/* Le sceau de la boutique, calé dans le bas de l'arche et débordant
                sur la droite. Il reste dans la hauteur de la photo : posé plus
                bas, il venait toucher les barres. */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-5 -right-5 z-20 hidden h-[112px] w-[112px] place-items-center rounded-full bg-ink text-cream shadow-[0_22px_46px_-20px_rgba(36,26,32,.75)] sm:grid lg:-right-7"
            >
              <svg viewBox="0 0 100 100" className="anim-seal absolute inset-0 h-full w-full">
                <defs>
                  <path
                    id="sceau-hero"
                    d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0"
                  />
                </defs>
                <text
                  className="fill-cream/75"
                  style={{ fontSize: 8.6, fontWeight: 700, letterSpacing: ".1em" }}
                >
                  <textPath href="#sceau-hero">
                    LIVRAISON 24 H · DAKAR · STOCK RÉEL ·
                  </textPath>
                </text>
              </svg>
              <span className="text-center text-[10px] font-extrabold uppercase leading-[1.15] tracking-[.08em]">
                24 h
                <span className="mt-0.5 block text-[8.5px] font-bold text-cream/60">
                  chez vous
                </span>
              </span>
            </div>

            {/* La pièce du catalogue la plus proche de ce qui est porté. */}
            {vedette && (
              <div className="anim-float absolute -left-3 bottom-6 z-20 hidden sm:block lg:-left-16 lg:bottom-10">
                <Link
                  key={vedette.id}
                  href={`/p/${vedette.slug}`}
                  className="anim-fade-up group flex w-[252px] items-center gap-3 rounded-2xl border border-line bg-cream/95 p-2.5 shadow-[0_30px_60px_-28px_rgba(36,26,32,.5)] backdrop-blur"
                >
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-stone">
                    <Image src={vedette.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">
                      Dans le même esprit
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] font-semibold">
                      {vedette.name}
                    </span>
                    <span className="block text-[13px] font-extrabold text-rose">
                      {formatXOF(vedette.price)}
                    </span>
                  </span>
                  <IconArrow className="h-4 w-4 shrink-0 -translate-x-1 text-muted opacity-0 transition-all duration-300 ease-soft group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </div>
            )}
          </div>

          {/* Étiquette et barres : de quoi savoir où on en est, et reprendre la
              main. La barre en cours se remplit sur la durée du minuteur. */}
          <div className="anim-hero mx-auto mt-7 flex w-full max-w-[420px] items-center justify-between gap-4 lg:ml-auto lg:mr-0 lg:max-w-[480px] [animation-delay:1s]">
            <div className="min-w-0">
              <div key={actif} className="anim-tick text-[13px] font-bold">
                {slide.tag}
              </div>
              <div className="mt-0.5 text-[11.5px] font-medium tabular-nums text-muted">
                {String(actif + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setActif(i)}
                  aria-label={`Voir la photo « ${s.tag} »`}
                  aria-current={i === actif}
                  /* La barre fait 3 px de haut, le bouton 32 : au doigt, une
                     cible de 3 px est inatteignable. */
                  className="group grid h-8 place-items-center px-0.5"
                >
                  <span
                    className={`relative block h-[3px] overflow-hidden rounded-full bg-ink/12 transition-all duration-500 ease-soft ${
                      i === actif ? "w-14" : "w-6 group-hover:bg-ink/30"
                    }`}
                  >
                    {i === actif && (
                      <span
                        key={actif}
                        className="hero-fill absolute inset-0 block bg-rose"
                        style={{
                          animationDuration: `${DUREE}ms`,
                          animationPlayState: pause ? "paused" : "running",
                        }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
