"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY } from "@/components/admin/shell";
import { IconLock, IconMail } from "@/components/icons";

/* Identifiants de démonstration, écrits en clair et affichés sous le
   formulaire : il n'y a rien à protéger tant qu'aucune donnée réelle ne passe
   par ici. Voir la note en bas de `components/admin/shell.tsx`. */
const EMAIL_DEMO = "ousseynou@mcommemaman.sn";
const MOT_DE_PASSE_DEMO = "mcm2026";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  /* Déjà entrée : on ne redemande pas. */
  useEffect(() => {
    try {
      if (window.localStorage.getItem(ADMIN_SESSION_KEY) === "1") router.replace("/admin");
    } catch {
      /* stockage indisponible : le formulaire reste affiché */
    }
  }, [router]);

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== EMAIL_DEMO || motDePasse !== MOT_DE_PASSE_DEMO) {
      setErreur("Identifiant ou mot de passe incorrect.");
      return;
    }
    try {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "1");
    } catch {
      setErreur("Le navigateur refuse d'enregistrer la session.");
      return;
    }
    router.replace("/admin");
  };

  const champ =
    "w-full rounded-2xl border-[1.5px] border-[#ece3e7] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[#b3a5aa] focus:border-rose";

  return (
    <div className="grid min-h-screen place-items-center bg-[#faf8f9] px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[.16em] text-rose">
            Administration
          </span>
          <h1 className="mt-2.5 text-[28px] font-extrabold leading-tight tracking-[-.035em]">
            Back-office
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">
            Commandes, catalogue, promotions et contenu de la page d&apos;accueil.
          </p>
        </div>

        <form
          onSubmit={envoyer}
          className="rounded-[24px] border border-line bg-white p-6 sm:p-7"
        >
          {erreur && (
            <p className="anim-fade-up mb-4 rounded-2xl bg-rose-soft px-4 py-3 text-[13px] font-semibold text-rose-deep">
              {erreur}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold">Adresse e-mail</span>
            <span className="relative block">
              <IconMail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErreur("");
                }}
                placeholder="vous@mcommemaman.sn"
                className={champ}
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[12.5px] font-bold">Mot de passe</span>
            <span className="relative block">
              <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <input
                type="password"
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => {
                  setMotDePasse(e.target.value);
                  setErreur("");
                }}
                placeholder="••••••••"
                className={champ}
              />
            </span>
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-rose py-3.5 text-[14px] font-bold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5"
          >
            Entrer
          </button>

          <p className="mt-5 rounded-2xl bg-gold-soft px-4 py-3.5 text-[12px] leading-relaxed text-[#5c4a2a]">
            Démonstration : <strong>{EMAIL_DEMO}</strong>, mot de passe{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-bold">{MOT_DE_PASSE_DEMO}</code>.
            Ce n&apos;est pas une authentification — rien n&apos;est vérifié côté serveur.
          </p>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-muted">
          <Link href="/" className="font-semibold transition-colors hover:text-rose">
            Retour à la boutique
          </Link>
        </p>
      </div>
    </div>
  );
}
