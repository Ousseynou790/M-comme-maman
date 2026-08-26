"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, LOGO, PRODUCTS, byId, countByAge } from "@/lib/products";
import { formatXOF } from "@/lib/format";
import { ScrollProgress } from "./motion";
import { useAuth } from "./auth-context";
import { useCart } from "./cart-context";
import { useFavorites } from "./favorites-context";
import { SearchOverlay } from "./search-overlay";
import {
  IconArrow,
  IconBag,
  IconChevron,
  IconClose,
  IconHeart,
  IconMenu,
  IconPackage,
  IconSearch,
  IconUser,
} from "./icons";

/* Le bandeau dit trois choses, une à la fois : entassées sur une ligne, aucune
   n'est lue. */
const ANNONCES = [
  "Livraison offerte à Dakar dès 25 000 F",
  "Wave, Orange Money ou paiement à la livraison",
  "Échange sous 7 jours si la taille ne va pas",
];

const NAV = [
  { href: "/boutique?g=fille", label: "Fille" },
  { href: "/boutique?g=garcon", label: "Garçon" },
  { href: "/boutique?age=0-1", label: "Bébé" },
  { href: "/boutique?cat=Chaussures", label: "Chaussures" },
  { href: "/avis", label: "Avis" },
  { href: "/contact", label: "Contact" },
];

const AGES = [
  { key: "0-1" as const, label: "Bébé", hint: "0 à 1 an" },
  { key: "2-10" as const, label: "Enfant", hint: "2 à 10 ans" },
  { key: "10-15" as const, label: "Grand", hint: "10 à 15 ans" },
];

/** La pièce mise en avant dans le menu déroulant. */
const COUP_DE_COEUR = "p8";

export function Header() {
  const { count, pulse, openDrawer } = useCart();
  const { account } = useAuth();
  const { count: favoris } = useFavorites();

  /* Avant l'hydratation, `account` vaut `null` des deux côtés : le premier rendu
     montre l'icône neutre, les initiales prennent sa place ensuite. */
  const initiales = account
    ? account.name
        .split(" ")
        .filter(Boolean)
        .map((mot) => mot[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [annonce, setAnnonce] = useState(0);

  /* Raccourcis : Ctrl/Cmd+K partout, « / » quand on n'est pas en train d'écrire. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const cible = event.target as HTMLElement | null;
      const saisie =
        cible?.tagName === "INPUT" || cible?.tagName === "TEXTAREA" || cible?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "/" && !saisie) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Le premier rendu affiche toujours la première annonce : serveur et client
     partent du même texte, la rotation ne commence qu'après. */
  useEffect(() => {
    const t = window.setInterval(() => setAnnonce((a) => (a + 1) % ANNONCES.length), 4600);
    return () => window.clearInterval(t);
  }, []);

  /* Changer de page referme le menu — sinon il reste ouvert par-dessus. */
  useEffect(() => setMenuOpen(false), [pathname]);

  const actif = (href: string) => pathname === href.split("?")[0] && !href.includes("?");
  const lien = (href: string) =>
    `whitespace-nowrap text-[13.5px] font-medium transition-colors hover:text-rose ${
      actif(href) ? "text-rose" : "text-ink/75"
    }`;

  const vedette = byId(COUP_DE_COEUR);

  return (
    <>
      {/* Bandeau et barre restent solidaires en haut de l'écran au défilement. */}
      <header className="sticky top-0 z-50">
        <div className="overflow-hidden bg-ink px-4 py-2.5 text-center text-[11.5px] text-white/90 sm:text-xs">
          <span key={annonce} className="anim-tick inline-block">
            {ANNONCES[annonce]}
          </span>
        </div>

        <div className="border-b border-line bg-cream/92 backdrop-blur-md">
          <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-10">
            <div className="relative flex h-16 items-center justify-between gap-3 lg:grid lg:h-[4.75rem] lg:grid-cols-[auto_1fr_auto] lg:gap-8">
              {/* ------------------------------------------- menu au doigt */}
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={menuOpen}
                className="-ml-2 grid h-11 w-11 place-items-center text-ink/75 transition-colors hover:text-rose lg:hidden"
              >
                {menuOpen ? <IconClose /> : <IconMenu />}
              </button>

              {/* ------------------------------------------------- le logo */}
              <Link href="/" aria-label="M comme Maman — accueil" className="shrink-0">
                <Image
                  src={LOGO}
                  alt="M comme Maman"
                  width={180}
                  height={52}
                  priority
                  className="h-9 w-auto object-contain md:h-11"
                />
              </Link>

              {/* --------------------------------- navigation, grand écran */}
              <nav className="hidden items-center justify-center gap-7 lg:flex xl:gap-9">
                {/* « Boutique » ouvre le rayon complet ; le panneau s'ouvre au
                    survol et au clavier (focus-within), jamais au clic seul. */}
                <div className="group">
                  <Link
                    href="/boutique"
                    className={`flex items-center gap-1.5 ${lien("/boutique")} ${
                      pathname === "/boutique" ? "text-rose" : ""
                    }`}
                  >
                    Boutique
                    <IconChevron className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" />
                  </Link>

                  {/* Le panneau se cale sur la rangée d'en-tête, pas sur
                      « Boutique » : centré sur le lien, il sortait du cadre par
                      la gauche dès 1280 px. `-mt-8 pt-8` ménage une bande
                      transparente entre le lien et la carte — sans elle, la
                      souris quitte le survol en descendant et le panneau se
                      referme au milieu du trajet. */}
                  <div className="pointer-events-none absolute left-1/2 top-full z-40 -mt-8 w-[min(820px,calc(100vw-3rem))] -translate-x-1/2 translate-y-2 pt-8 opacity-0 transition-[opacity,transform] duration-300 ease-soft group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="grid grid-cols-[1fr_1fr_1.15fr] gap-8 rounded-[24px] border border-line bg-cream p-6 shadow-[0_40px_80px_-40px_rgba(36,26,32,.45)]">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">
                          Les rayons
                        </div>
                        <div className="mt-3 flex flex-col">
                          {CATEGORIES.map((c) => (
                            <Link
                              key={c}
                              href={`/boutique?cat=${encodeURIComponent(c)}`}
                              className="group/l flex items-center justify-between rounded-lg py-1.5 pr-2 text-[13.5px] font-medium transition-colors hover:text-rose"
                            >
                              {c}
                              <IconArrow className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover/l:translate-x-0 group-hover/l:opacity-100" />
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">
                          Par âge
                        </div>
                        <div className="mt-3 flex flex-col gap-1">
                          {AGES.map((a) => (
                            <Link
                              key={a.key}
                              href={`/boutique?age=${a.key}`}
                              className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-stone"
                            >
                              <span>
                                <span className="block text-[13.5px] font-semibold">{a.label}</span>
                                <span className="block text-[12px] text-muted">{a.hint}</span>
                              </span>
                              <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[11.5px] font-bold text-rose">
                                {countByAge(a.key)}
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/boutique"
                          className="mt-3 flex items-center gap-1.5 px-3 text-[13px] font-bold text-rose"
                        >
                          Les {PRODUCTS.length} pièces
                          <IconArrow className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {vedette && (
                        <Link href={`/p/${vedette.slug}`} className="group/v block">
                          {/* Les pièces sont photographiées sur cintre, en
                              portrait : un cadre paysage n'en montrerait que
                              l'ourlet. Carré, calé sur le haut du vêtement. */}
                          <div className="relative aspect-square overflow-hidden rounded-[18px] bg-stone">
                            <div
                              className="absolute inset-0 bg-cover transition-transform duration-700 ease-soft group-hover/v:scale-105"
                              style={{ backgroundImage: `url(${vedette.image})`, backgroundPosition: "50% 22%" }}
                            />
                            <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                              Coup de cœur
                            </span>
                          </div>
                          <div className="mt-2.5 text-[13.5px] font-semibold leading-snug transition-colors group-hover/v:text-rose">
                            {vedette.name}
                          </div>
                          <div className="mt-0.5 text-[13px] font-extrabold tabular-nums">
                            {formatXOF(vedette.price)}
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {NAV.map((n) => (
                  <Link key={n.label} href={n.href} className={lien(n.href)}>
                    {n.label}
                  </Link>
                ))}
              </nav>

              {/* -------------------------------------- actions, à droite */}
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Rechercher"
                  className="grid h-11 w-11 place-items-center text-ink/70 transition-colors hover:text-rose xl:hidden"
                >
                  <IconSearch />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Rechercher"
                  className="hidden items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2.5 text-[13px] text-muted transition-colors hover:border-rose/40 hover:text-ink xl:flex"
                >
                  <IconSearch className="h-4 w-4" />
                  <span>Rechercher</span>
                  <kbd className="rounded border border-line px-1.5 text-[10.5px] leading-4 text-muted">/</kbd>
                </button>

                <Link
                  href="/favoris"
                  aria-label={
                    favoris > 0 ? `Mes favoris, ${favoris} article${favoris > 1 ? "s" : ""}` : "Mes favoris"
                  }
                  title="Mes favoris"
                  className="relative grid h-11 w-11 place-items-center text-ink/75 transition-colors hover:text-rose"
                >
                  <IconHeart />
                  {favoris > 0 && (
                    <span className="anim-pop absolute right-1 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose px-1 text-[10.5px] font-bold tabular-nums text-white">
                      {favoris}
                    </span>
                  )}
                </Link>

                <Link
                  href="/commandes"
                  aria-label="Mes commandes"
                  title="Suivre mes commandes"
                  className="grid h-11 w-11 place-items-center text-ink/75 transition-colors hover:text-rose"
                >
                  <IconPackage />
                </Link>

                <Link
                  href={account ? "/compte" : "/compte/connexion"}
                  aria-label={account ? "Mon espace client" : "Se connecter"}
                  title={account ? account.name : "Se connecter"}
                  className="grid h-11 w-11 place-items-center text-ink/75 transition-colors hover:text-rose"
                >
                  {initiales ? (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-rose text-[11.5px] font-extrabold text-white">
                      {initiales}
                    </span>
                  ) : (
                    <IconUser />
                  )}
                </Link>

                <button
                  type="button"
                  onClick={openDrawer}
                  aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
                  className="relative grid h-11 w-11 place-items-center text-ink/75 transition-colors hover:text-rose"
                >
                  <IconBag />
                  {count > 0 && (
                    <span
                      key={pulse}
                      className="anim-pop absolute right-1 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose px-1 text-[10.5px] font-bold tabular-nums text-white"
                    >
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ------------------------------------------ menu au doigt, déplié */}
            <div
              className={`overflow-hidden transition-[max-height] duration-400 ease-soft lg:hidden ${
                menuOpen ? "max-h-[44rem]" : "max-h-0"
              }`}
            >
              <div className="flex flex-col border-t border-line py-2">
                <Link
                  href="/boutique"
                  className="py-3 text-[15px] font-semibold transition-colors hover:text-rose"
                >
                  Toute la boutique · {PRODUCTS.length} pièces
                </Link>
                {NAV.map((n) => (
                  <Link
                    key={n.label}
                    href={n.href}
                    className="py-3 text-[15px] font-medium text-ink/80 transition-colors hover:text-rose"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link
                  href="/favoris"
                  className="flex items-center gap-2 py-3 text-[15px] font-medium text-ink/80 transition-colors hover:text-rose"
                >
                  Mes favoris
                  {favoris > 0 && <span className="text-[13px] text-muted">({favoris})</span>}
                </Link>
                <Link
                  href="/commandes"
                  className="py-3 text-[15px] font-medium text-ink/80 transition-colors hover:text-rose"
                >
                  Mes commandes
                </Link>
                <Link
                  href={account ? "/compte" : "/compte/connexion"}
                  className="py-3 text-[15px] font-medium text-ink/80 transition-colors hover:text-rose"
                >
                  {account ? "Mon espace client" : "Se connecter"}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-4 pb-2">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c}
                      href={`/boutique?cat=${encodeURIComponent(c)}`}
                      className="rounded-full bg-stone px-3.5 py-1.5 text-[13px] font-medium"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollProgress />
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
