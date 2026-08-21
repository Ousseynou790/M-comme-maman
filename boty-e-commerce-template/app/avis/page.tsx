"use client"

import Link from "next/link"
import { MessageSquareHeart } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useReviews } from "@/components/boty/reviews-context"
import { ReviewForm, ReviewList, StarRow } from "@/components/boty/review-form"
import { SectionCard } from "@/components/boty/form-kit"
import { getProduct } from "@/lib/products"

export default function AvisPage() {
  const { shopReviews, reviews, aggregate, hydrated } = useReviews()

  const surLaBoutique = shopReviews()
  const note = aggregate({ kind: "shop" })
  const surLesArticles = reviews.filter((r) => r.target.kind === "product").slice(0, 6)

  /* Répartition des notes, pour situer la moyenne d'un coup d'œil. */
  const total = note.count || 1

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-16">
        <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
          <div className="mb-8 text-center">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-primary">Paroles de clientes</span>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl lg:text-5xl">Avis sur M comme Maman</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Le choix des pièces, la livraison, les conseils de taille : dites-nous ce qui va et ce qui manque.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-6">
              <SectionCard
                title={`La boutique vue par ses clientes${note.count > 0 ? ` (${note.count})` : ""}`}
                description={
                  note.count > 0
                    ? "Avis laissés par des clientes dont la commande a été livrée."
                    : "Les avis apparaîtront ici dès la première livraison."
                }
              >
                {note.count > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-6 rounded-2xl bg-background px-5 py-4">
                    <div className="text-center">
                      <p className="font-serif text-4xl leading-none text-foreground">{note.average}</p>
                      <StarRow rating={note.average} className="mt-2 justify-center" />
                      <p className="mt-1 text-[11px] text-muted-foreground">{note.count} avis</p>
                    </div>

                    <ul className="min-w-[180px] flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((etoile) => (
                        <li key={etoile} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-3 text-right">{etoile}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full rounded-full bg-primary"
                              style={{ width: `${((note.distribution[etoile] ?? 0) / total) * 100}%` }}
                            />
                          </span>
                          <span className="w-5">{note.distribution[etoile] ?? 0}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hydrated && <ReviewList reviews={surLaBoutique} />}
              </SectionCard>

              {surLesArticles.length > 0 && (
                <SectionCard
                  title="Derniers avis sur les articles"
                  description="Retrouvez-les aussi sur chaque fiche produit."
                >
                  <ul className="space-y-3">
                    {surLesArticles.map((avis) => {
                      const article = avis.target.kind === "product" ? getProduct(avis.target.productId) : undefined
                      return (
                        <li key={avis.id} className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {article ? (
                              <Link
                                href={`/product/${article.id}`}
                                className="text-sm font-medium text-foreground boty-transition hover:text-primary"
                              >
                                {article.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground">Article retiré du catalogue</span>
                            )}
                            <StarRow rating={avis.rating} />
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{avis.comment}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {avis.authorName}
                            {avis.orderRef ? ` · achat vérifié` : ""}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                </SectionCard>
              )}
            </div>

            <SectionCard
              className="lg:sticky lg:top-24"
              title="Votre avis sur nos services"
              description="Une seule fois, modifiable à tout moment."
            >
              <p className="mb-5 flex gap-2.5 rounded-2xl bg-background px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <MessageSquareHeart className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Pour noter un article en particulier, rendez-vous sur sa fiche produit : le formulaire s&apos;y trouve
                sous la description.
              </p>

              <ReviewForm target={{ kind: "shop" }} titre="Votre note globale" />
            </SectionCard>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
