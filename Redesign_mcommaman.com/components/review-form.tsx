"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-context";
import { useOrders } from "./orders-context";
import { useReviews, type Review, type ReviewTarget } from "./reviews-context";
import { TextareaField } from "./form-kit";
import { IconCheck, IconTrash } from "./icons";

/**
 * Les étoiles restent des glyphes : le projet n'embarque aucune bibliothèque
 * d'icônes tierce, et un ★ garde la même graisse partout.
 */
export function StarRow({ rating, className = "" }: { rating: number; className?: string }) {
  const pleines = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`Noté ${String(rating).replace(".", ",")} sur 5`}
      className={`shrink-0 text-[15px] leading-none tracking-[2px] text-gold ${className}`}
    >
      {"★".repeat(pleines)}
      <span className="text-gold/25">{"★".repeat(5 - pleines)}</span>
    </span>
  );
}

/** Sélecteur d'étoiles cliquable, avec aperçu au survol. */
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [survol, setSurvol] = useState(0);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setSurvol(0)}>
      {[1, 2, 3, 4, 5].map((note) => (
        <button
          key={note}
          type="button"
          onMouseEnter={() => setSurvol(note)}
          onClick={() => onChange(note)}
          aria-label={`${note} étoile${note > 1 ? "s" : ""}`}
          aria-pressed={value === note}
          className={`text-2xl leading-none transition-transform duration-200 ease-back hover:scale-115 ${
            (survol || value) >= note ? "text-gold" : "text-line"
          }`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-[12.5px] font-semibold text-muted">{value}/5</span>}
    </div>
  );
}

const initiales = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * Formulaire d'avis.
 *
 * Pour un article, il faut l'avoir reçu : on cherche une commande livrée qui le
 * contient. Sans elle, le formulaire explique pourquoi il est fermé plutôt que
 * de disparaître sans un mot.
 */
export function ReviewForm({ target, titre }: { target: ReviewTarget; titre: string }) {
  const { account } = useAuth();
  const { orders } = useOrders();
  const { reviewBy, submit, remove } = useReviews();

  const existant = account ? reviewBy(account.email, target) : undefined;
  const [note, setNote] = useState(existant?.rating ?? 0);
  const [texte, setTexte] = useState(existant?.comment ?? "");
  const [envoye, setEnvoye] = useState(false);

  const livrees = orders.filter((o) => o.status === "livree");
  const commandeLiee =
    target.kind === "product"
      ? livrees.find((o) => o.lines.some((l) => l.productId === target.productId))
      : livrees[0];

  if (!account) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-[13px] leading-relaxed text-muted">
        <Link
          href="/compte/connexion?suite=/avis"
          className="font-bold text-rose underline underline-offset-4"
        >
          Connectez-vous
        </Link>{" "}
        pour laisser un avis.
      </p>
    );
  }

  if (!commandeLiee) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-[13px] leading-relaxed text-muted">
        {target.kind === "product"
          ? "Vous pourrez noter cet article une fois votre commande reçue."
          : "Vous pourrez donner votre avis sur la boutique après votre première réception."}{" "}
        <Link href="/commandes" className="font-bold text-rose underline underline-offset-4">
          Voir mes commandes
        </Link>
      </p>
    );
  }

  const valide = note > 0 && texte.trim().length >= 10;

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    submit({
      target,
      rating: note,
      comment: texte.trim(),
      authorName: account.name,
      authorEmail: account.email,
      orderRef: commandeLiee.ref,
    });
    setEnvoye(true);
    window.setTimeout(() => setEnvoye(false), 2600);
  };

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-4">
      <div>
        <span className="mb-2.5 block text-[12.5px] font-bold">{titre}</span>
        <StarPicker value={note} onChange={setNote} />
      </div>

      <TextareaField
        label="Votre commentaire"
        rows={4}
        maxLength={600}
        placeholder={
          target.kind === "product"
            ? "La taille, la matière, ce qui vous a plu ou déçu…"
            : "La livraison, l'accueil, les conseils de taille…"
        }
        value={texte}
        onChange={setTexte}
        hint="Au moins 10 caractères. Votre nom et la mention « achat vérifié » seront affichés."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!valide}
          className="inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-[13.5px] font-bold text-white transition-transform duration-400 ease-soft hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
        >
          <IconCheck className="h-4 w-4" />
          {existant ? "Modifier mon avis" : "Publier mon avis"}
        </button>

        {existant && (
          <button
            type="button"
            onClick={() => {
              remove(existant.id);
              setNote(0);
              setTexte("");
            }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[13.5px] font-semibold text-muted transition-colors hover:text-rose-deep"
          >
            <IconTrash className="h-4 w-4" />
            Supprimer
          </button>
        )}

        {envoye && (
          <span className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3f8a5f]">
            <IconCheck className="h-4 w-4" />
            Merci, votre avis est publié.
          </span>
        )}
      </div>
    </form>
  );
}

/** Liste d'avis, avec la mention d'achat vérifié. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Aucun avis pour le moment. Soyez la première à en laisser un.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((avis) => (
        <li key={avis.id} className="rounded-2xl border border-line bg-mist p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose text-[12px] font-extrabold text-white">
                {initiales(avis.authorName)}
              </span>
              <div>
                <p className="text-[13.5px] font-bold">{avis.authorName}</p>
                <p className="text-[11px] text-[#3f8a5f] tabular-nums">
                  Achat vérifié · {avis.orderRef}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StarRow rating={avis.rating} />
              <span className="text-[11px] text-muted">{dateLongue(avis.createdAt)}</span>
            </div>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#3d2f35]">{avis.comment}</p>
        </li>
      ))}
    </ul>
  );
}
