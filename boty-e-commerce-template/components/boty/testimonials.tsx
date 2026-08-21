"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Quote } from "lucide-react"
import { useReviews } from "./reviews-context"
import { StarRow } from "./review-form"

/**
 * Le mot des mamans.
 *
 * La section n'affiche que de vrais avis déposés par des clientes ayant été
 * livrées. Tant qu'il n'y en a pas, elle invite à en écrire un plutôt que de
 * montrer des témoignages inventés.
 */
export function Testimonials() {
  const { shopReviews, aggregate, hydrated } = useReviews()
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), {
      threshold: 0.15,
    })
    const el = sectionRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  const avis = shopReviews().slice(0, 3)
  const note = aggregate({ kind: "shop" })

  return (
    <section className="bg-background py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={sectionRef} className="mb-6 text-center sm:mb-7">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-primary">
            Elles nous font confiance
          </span>
          <h2 className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Le mot des mamans
          </h2>
          {note.count > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <StarRow rating={note.average} />
              {note.average}/5 sur {note.count} avis
            </p>
          )}
        </div>

        {/* Avant l'hydratation, on ne sait pas encore ce qui existe : on n'affiche rien. */}
        {hydrated && avis.length === 0 && (
          <div className="mx-auto max-w-xl rounded-[1.4rem] bg-card px-6 py-10 text-center boty-shadow">
            <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-primary/10">
              <Quote className="h-4 w-4 text-primary" />
            </span>
            <p className="font-serif text-xl text-foreground">Aucun avis pour le moment</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les avis viennent des clientes livrées. Vous avez reçu votre commande ? Racontez-nous.
            </p>
            <Link
              href="/avis"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90"
            >
              Donner mon avis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {avis.length > 0 && (
          <>
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-4">
              {avis.map((t, index) => (
                <article
                  key={t.id}
                  className={`flex h-full min-h-[210px] w-[calc(100%_-_1.75rem)] shrink-0 snap-start flex-col rounded-[1.4rem] bg-card p-5 boty-shadow transition-all duration-700 ease-out sm:w-auto ${
                    visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10">
                      <Quote className="h-4 w-4 text-primary" />
                    </span>
                    <StarRow rating={t.rating} />
                  </div>

                  <p className="flex-1 text-sm leading-relaxed text-foreground/85">« {t.comment} »</p>

                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="text-sm font-medium text-foreground">{t.authorName}</p>
                    {t.orderRef && <p className="text-[11px] text-[#4f6a49]">Cliente vérifiée · {t.orderRef}</p>}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/avis"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm text-foreground boty-transition hover:bg-card"
              >
                Tous les avis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
