"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Star, Trash2 } from "lucide-react"
import { useAuth } from "./auth-context"
import { useOrders } from "./orders-context"
import { useReviews, type ReviewTarget } from "./reviews-context"
import { FormButton, TextareaField } from "./form-kit"

/** Sélecteur d'étoiles cliquable, avec aperçu au survol. */
export function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md"
}) {
  const [hover, setHover] = useState(0)
  const dimension = size === "sm" ? "h-5 w-5" : "h-7 w-7"

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((note) => (
        <button
          key={note}
          type="button"
          onMouseEnter={() => setHover(note)}
          onClick={() => onChange(note)}
          aria-label={`${note} étoile${note > 1 ? "s" : ""}`}
          aria-pressed={value === note}
          className="boty-transition hover:scale-110"
        >
          <Star
            className={`${dimension} boty-transition ${
              (hover || value) >= note ? "fill-primary text-primary" : "text-border"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

/** Étoiles en lecture seule. */
export function StarRow({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`flex ${className ?? ""}`} aria-label={`Noté ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((note) => (
        <Star
          key={note}
          className={`h-4 w-4 ${note <= Math.round(rating) ? "fill-primary text-primary" : "text-border"}`}
        />
      ))}
    </span>
  )
}

/**
 * Formulaire d'avis.
 *
 * Pour un article, la cliente doit l'avoir reçu : on cherche une commande
 * livrée qui le contient. Sans cela, le formulaire explique pourquoi il est
 * fermé plutôt que de disparaître sans un mot.
 */
export function ReviewForm({ target, titre }: { target: ReviewTarget; titre: string }) {
  const { account } = useAuth()
  const { orders } = useOrders()
  const { reviewBy, submit, remove } = useReviews()

  const existant = account ? reviewBy(account.email, target) : undefined
  const [rating, setRating] = useState(existant?.rating ?? 0)
  const [comment, setComment] = useState(existant?.comment ?? "")
  const [envoye, setEnvoye] = useState(false)

  const livrees = orders.filter((o) => o.status === "livree")
  const commandeLiee =
    target.kind === "product"
      ? livrees.find((o) => o.lines.some((l) => l.productId === target.productId))
      : livrees[0]

  if (!account) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
        <Link href="/compte/connexion" className="font-medium text-primary underline underline-offset-4">
          Connectez-vous
        </Link>{" "}
        pour laisser un avis.
      </p>
    )
  }

  if (!commandeLiee) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
        {target.kind === "product"
          ? "Vous pourrez noter cet article une fois votre commande livrée."
          : "Vous pourrez donner votre avis sur la boutique après votre première livraison."}
      </p>
    )
  }

  const valide = rating > 0 && comment.trim().length >= 10

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valide) return
    submit({
      target,
      rating,
      comment: comment.trim(),
      authorName: account.name,
      authorEmail: account.email,
      orderRef: commandeLiee.ref,
    })
    setEnvoye(true)
    window.setTimeout(() => setEnvoye(false), 2600)
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">{titre}</span>
        <StarPicker value={rating} onChange={setRating} />
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
        value={comment}
        onChange={setComment}
        hint="Au moins 10 caractères. Votre prénom et la mention « achat vérifié » seront affichés."
      />

      <div className="flex flex-wrap items-center gap-3">
        <FormButton type="submit" tone="primary" disabled={!valide} icon={Check}>
          {existant ? "Modifier mon avis" : "Publier mon avis"}
        </FormButton>

        {existant && (
          <FormButton
            tone="danger"
            icon={Trash2}
            onClick={() => {
              remove(existant.id)
              setRating(0)
              setComment("")
            }}
          >
            Supprimer
          </FormButton>
        )}

        {envoye && (
          <span className="inline-flex items-center gap-1.5 text-sm text-[#4f6a49] animate-scale-fade-in">
            <Check className="h-4 w-4" /> Merci, votre avis est publié.
          </span>
        )}
      </div>
    </form>
  )
}

/** Liste d'avis, avec la mention d'achat vérifié. */
export function ReviewList({ reviews }: { reviews: { id: string; rating: number; comment: string; authorName: string; orderRef?: string; createdAt: string }[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun avis pour le moment. Soyez la première à en laisser un.</p>
  }

  return (
    <ul className="space-y-4">
      {reviews.map((avis) => (
        <li key={avis.id} className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                {avis.authorName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{avis.authorName}</p>
                {avis.orderRef && (
                  <p className="text-[11px] text-[#4f6a49]">Achat vérifié · {avis.orderRef}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StarRow rating={avis.rating} />
              <span className="text-[11px] text-muted-foreground">
                {new Date(avis.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{avis.comment}</p>
        </li>
      ))}
    </ul>
  )
}
