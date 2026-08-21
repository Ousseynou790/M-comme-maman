"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Timer } from "lucide-react"
import { computeRemaining, type PromoCampaign, type Remaining } from "@/lib/promo"
import { Parallax } from "./parallax"

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[56px] rounded-2xl border border-border/60 bg-popover/75 px-3 py-2 text-center backdrop-blur-md sm:min-w-[66px] sm:px-4 sm:py-2.5">
      {/* Chiffres tabulaires : la largeur ne saute pas à chaque seconde. */}
      <span className="block font-serif text-2xl leading-none tabular-nums text-foreground sm:text-3xl">{value}</span>
      <span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
        {label}
      </span>
    </div>
  )
}

export function PromoCountdown({ campaign, headline }: { campaign: PromoCampaign; headline: string }) {
  // Null au premier rendu : le serveur ne peut pas connaître l'heure du visiteur.
  const [remaining, setRemaining] = useState<Remaining | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(campaign.endsAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [campaign.endsAt])

  // L'opération est terminée : plus de bandeau, plus de fausse urgence.
  if (remaining?.over) return null

  const pad = (n: number) => String(n).padStart(2, "0")
  const units = remaining
    ? [
        { value: String(remaining.days), label: remaining.days > 1 ? "Jours" : "Jour" },
        { value: pad(remaining.hours), label: "Heures" },
        { value: pad(remaining.minutes), label: "Min" },
        { value: pad(remaining.seconds), label: "Sec" },
      ]
    : [
        { value: "--", label: "Jours" },
        { value: "--", label: "Heures" },
        { value: "--", label: "Min" },
        { value: "--", label: "Sec" },
      ]

  const endLabel = new Date(campaign.endsAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  })

  return (
    /* Bande pleine largeur : la photo est affichée telle quelle, sans voile ni
       dégradé. */
    <section className="relative isolate overflow-hidden">
      <Parallax speed={0.45} zoom={0.10} margin={0.3} className="absolute inset-0 overflow-hidden">
        <Image src={campaign.image} alt="" fill sizes="100vw" className="object-cover" />
      </Parallax>

      <div className="relative mx-auto max-w-[1480px] px-6 py-7 text-center sm:py-8 lg:py-9">
        <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
          <Timer className="h-3.5 w-3.5" />
          {campaign.eyebrow}
        </span>

        <h2 className="mx-auto max-w-3xl text-balance font-serif text-3xl font-medium leading-[1.05] text-foreground sm:text-4xl">
          {campaign.title}
          <span className="mt-1 block text-primary">{headline}</span>
        </h2>

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
          {units.map((unit) => (
            <Unit key={unit.label} value={unit.value} label={unit.label} />
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Link
            href={campaign.ctaHref}
            className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-105"
          >
            {campaign.ctaLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <span className="text-xs tracking-wide text-muted-foreground">
            Jusqu&apos;au {endLabel}, dans la limite des stocks.
          </span>
        </div>
      </div>
    </section>
  )
}
