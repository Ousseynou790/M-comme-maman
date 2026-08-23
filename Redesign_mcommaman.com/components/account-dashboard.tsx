"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXOF, waLink } from "@/lib/format";
import { zoneLabel } from "@/lib/livraison";
import { useAuth } from "./auth-context";
import { useCart } from "./cart-context";
import { useOrders } from "./orders-context";
import { OrderStatusBadge } from "./order-status-badge";
import { AccountNav } from "./account-nav";
import { IconArrow, IconBag, IconLogout, IconPackage, IconPin, IconUser, IconWhatsApp } from "./icons";

const SHELL = "mx-auto w-full max-w-[1180px] px-5 md:px-8 lg:px-10";

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

/** Les initiales servent d'avatar : deux lettres suffisent à se reconnaître. */
const initiales = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function AccountDashboard() {
  const router = useRouter();
  const { account, hydrated, logout } = useAuth();
  const { items, count, subtotal, optionLabel } = useCart();
  const { orders } = useOrders();

  /* `sortie` évite un aller-retour : après « Se déconnecter », le compte
     disparaît et l'effet de garde renverrait vers la page de connexion avant
     que le `replace("/")` n'ait eu lieu. */
  const [sortie, setSortie] = useState(false);

  useEffect(() => {
    if (hydrated && !account && !sortie) router.replace("/compte/connexion?suite=/compte");
  }, [hydrated, account, sortie, router]);

  /* Avant l'hydratation on ne sait pas encore qui est là : on rend la même
     ossature que le serveur, en attente. */
  if (!hydrated || !account) {
    return (
      <div className={`${SHELL} pb-22 pt-10`}>
        <div className="h-52 animate-pulse rounded-[30px] bg-mist" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.55fr_.75fr]">
          <div className="h-64 animate-pulse rounded-3xl bg-mist" />
          <div className="h-64 animate-pulse rounded-3xl bg-mist" />
        </div>
      </div>
    );
  }

  const prenom = account.name.split(" ")[0];
  const salutation = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";
  const parDefaut = account.addresses.find((a) => a.isDefault) ?? account.addresses[0] ?? null;
  const tailles = account.preferences.sizes;

  const deconnecter = () => {
    setSortie(true);
    logout();
    router.replace("/");
  };

  const derniere = orders[0] ?? null;

  const chiffres = [
    {
      valeur: String(orders.length),
      label: orders.length > 1 ? "Commandes passées" : "Commande passée",
      href: "/commandes",
      Icone: IconPackage,
    },
    {
      valeur: String(count),
      label: count > 1 ? "Articles au panier" : "Article au panier",
      href: "/panier",
      Icone: IconBag,
    },
    {
      valeur: String(account.addresses.length),
      label: account.addresses.length > 1 ? "Adresses enregistrées" : "Adresse enregistrée",
      href: "/compte/profil",
      Icone: IconPin,
    },
  ];

  return (
    <div className={`${SHELL} pb-22 pt-8`}>
      {/* ------------------------------------------------------ en-tête sombre */}
      <section className="noise anim-fade-up relative overflow-hidden rounded-[26px] bg-ink px-6 py-8 text-white sm:px-9 md:rounded-[30px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aurora absolute -left-16 -top-10 h-72 w-72 rounded-full bg-rose/40 blur-[90px]" />
          <div className="aurora absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-gold/25 blur-[90px] [animation-delay:-11s]" />
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose text-base font-extrabold sm:h-16 sm:w-16 sm:text-lg">
              {initiales(account.name)}
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[.16em] text-gold">
                Votre espace
              </span>
              <h1 className="mt-1.5 truncate text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold leading-tight tracking-[-.035em]">
                {salutation} {prenom}
              </h1>
              <p className="mt-1 truncate text-[13.5px] text-white/55">{account.email}</p>
            </div>
            <button
              type="button"
              onClick={deconnecter}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-[12.5px] font-semibold text-white/75 transition-colors duration-300 hover:border-white/50 hover:bg-white/10 hover:text-white"
            >
              <IconLogout className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>

          <div className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-3">
            {chiffres.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="flex items-center gap-4 bg-ink/70 px-5 py-4 transition-colors duration-300 hover:bg-white/10"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                  <c.Icone className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <strong className="block text-xl font-extrabold tabular-nums tracking-tight">
                    {c.valeur}
                  </strong>
                  <small className="text-[12px] text-white/55">{c.label}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6">
        <AccountNav />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_.75fr] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* --------------------------------------------- dernière commande */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-rose">Suivi</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight">Dernière commande</h2>
              </div>
              {orders.length > 0 && (
                <Link
                  href="/commandes"
                  className="group inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-rose"
                >
                  Toutes mes commandes
                  <IconArrow className="h-3.5 w-3.5 transition-transform duration-300 ease-soft group-hover:translate-x-1" />
                </Link>
              )}
            </header>

            {derniere ? (
              <Link
                href={`/commandes/${derniere.ref}`}
                className="group flex flex-wrap items-center gap-5 rounded-2xl bg-mist p-4 transition-colors duration-300 hover:bg-stone sm:flex-nowrap sm:p-5"
              >
                <div className="flex -space-x-2.5">
                  {derniere.lines.slice(0, 3).map((ligne, i) => (
                    <span
                      key={`${ligne.productId}-${i}`}
                      className="h-16 w-14 rounded-xl border-2 border-white bg-stone bg-cover bg-center"
                      style={{ backgroundImage: `url(${ligne.image})` }}
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-extrabold tabular-nums">{derniere.ref}</p>
                    <OrderStatusBadge status={derniere.status} />
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {dateLongue(derniere.createdAt)} · {derniere.lines.length} article
                    {derniere.lines.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="text-[14px] font-extrabold tabular-nums">
                    {formatXOF(derniere.total)}
                  </strong>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition-transform duration-300 ease-soft group-hover:translate-x-1">
                    <IconArrow className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-6 py-9 text-center">
                <p className="text-[13.5px] text-muted">
                  Vous n&apos;avez encore passé aucune commande.
                </p>
                <Link
                  href="/boutique"
                  className="mt-4 inline-block rounded-full border-[1.5px] border-[#e5d9de] px-6 py-3 text-[13.5px] font-semibold transition-colors duration-300 hover:border-rose hover:text-rose"
                >
                  Découvrir la boutique
                </Link>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ panier en cours */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-rose">En cours</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight">Mon panier</h2>
              </div>
              {items.length > 0 && (
                <Link
                  href="/panier"
                  className="group inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-rose"
                >
                  Voir le panier
                  <IconArrow className="h-3.5 w-3.5 transition-transform duration-300 ease-soft group-hover:translate-x-1" />
                </Link>
              )}
            </header>

            {items.length > 0 ? (
              <>
                <ul className="flex flex-col gap-4">
                  {items.slice(0, 3).map((i) => (
                    <li key={`${i.id}-${i.color}-${i.size}`} className="flex gap-3.5">
                      <Link
                        href={`/p/${i.slug}`}
                        className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone bg-cover bg-center"
                        style={{ backgroundImage: `url(${i.image})` }}
                        aria-label={i.name}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/p/${i.slug}`}
                          className="line-clamp-1 text-[13.5px] font-bold transition-colors hover:text-rose"
                        >
                          {i.name}
                        </Link>
                        <p className="mt-1 text-[12.5px] text-muted">
                          {optionLabel({ id: i.id, qty: i.qty, color: i.color, size: i.size })} · ×{i.qty}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13.5px] font-extrabold tabular-nums">
                        {formatXOF(i.price * i.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                {items.length > 3 && (
                  <p className="mt-3.5 text-[12.5px] text-muted">
                    et {items.length - 3} autre{items.length - 3 > 1 ? "s" : ""} article
                    {items.length - 3 > 1 ? "s" : ""}.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-[13px] text-muted">
                    Sous-total{" "}
                    <strong className="text-[15px] font-extrabold tabular-nums text-ink">
                      {formatXOF(subtotal)}
                    </strong>
                  </span>
                  <Link
                    href="/commande"
                    className="shine rounded-full bg-rose px-6 py-3 text-[13.5px] font-bold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
                  >
                    Finaliser ma commande
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-6 py-9 text-center">
                <p className="text-[13.5px] text-muted">Votre panier est vide pour le moment.</p>
                <Link
                  href="/boutique"
                  className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-[13.5px] font-semibold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
                >
                  Voir la sélection
                </Link>
              </div>
            )}
          </section>

          {/* -------------------------------------------- adresse par défaut */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-rose">Livraison</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight">Adresse par défaut</h2>
              </div>
              <Link
                href="/compte/profil"
                className="text-[12.5px] font-semibold text-muted transition-colors hover:text-rose"
              >
                Gérer mes adresses
              </Link>
            </header>

            {parDefaut ? (
              <div className="flex gap-4 rounded-2xl bg-mist p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-soft">
                  <IconPin className="h-4 w-4 text-rose" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold">{parDefaut.label}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {parDefaut.address} — {parDefaut.city} · {zoneLabel(parDefaut.zone)}
                  </p>
                  {parDefaut.notes && (
                    <p className="mt-1 text-[12px] italic text-muted">«&nbsp;{parDefaut.notes}&nbsp;»</p>
                  )}
                  <p className="mt-2.5 text-[12px] text-[#3f8a5f]">
                    Proposée automatiquement au moment de commander.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-6 py-9 text-center">
                <p className="text-[13.5px] text-muted">
                  Aucune adresse enregistrée. La saisir une fois évite de la retaper à chaque
                  commande.
                </p>
                <Link
                  href="/compte/profil"
                  className="mt-4 inline-block rounded-full border-[1.5px] border-[#e5d9de] px-6 py-3 text-[13.5px] font-semibold transition-colors duration-300 hover:border-rose hover:text-rose"
                >
                  Ajouter une adresse
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------------------ aside */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-[104px]">
          <section className="rounded-3xl bg-mist p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-soft">
                <IconUser className="h-5 w-5 text-rose" />
              </span>
              <Link
                href="/compte/profil"
                aria-label="Modifier mon profil"
                className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#e5d9de] bg-white transition-colors duration-300 hover:border-rose hover:text-rose"
              >
                <IconArrow className="h-4 w-4" />
              </Link>
            </div>

            <h2 className="mt-5 text-base font-extrabold tracking-tight">Mes informations</h2>

            <dl className="mt-5 flex flex-col gap-4 text-[13.5px]">
              <div>
                <dt className="text-[12px] text-muted">Téléphone</dt>
                <dd className="mt-0.5 font-bold">{account.phone || "À compléter"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Ville ou quartier</dt>
                <dd className="mt-0.5 font-bold">{account.city || "À compléter"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Tailles suivies</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {tailles.length ? (
                    tailles.map((t) => (
                      <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold">À compléter</span>
                  )}
                </dd>
              </div>
            </dl>

            <Link
              href="/compte/profil"
              className="mt-6 block rounded-full bg-ink px-5 py-3 text-center text-[13.5px] font-semibold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
            >
              Compléter mon profil
            </Link>
          </section>

          <section className="rounded-3xl border border-line bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-rose">Besoin d&apos;aide ?</p>
            <h2 className="mt-2 text-base font-extrabold tracking-tight">Une question sur une commande ?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Du lundi au samedi, 9 h – 19 h. Une vraie personne répond.
            </p>
            <a
              href={waLink("Bonjour, j'ai une question sur mon compte")}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-3 text-[13.5px] font-bold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
            >
              <IconWhatsApp className="h-4 w-4" />
              Écrire sur WhatsApp
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
