"use client"

import { useEffect, useRef, useState } from "react"
import { Truck, RefreshCcw, Sprout, HeartHandshake } from "lucide-react"

const badges = [
  {
    icon: Truck,
    title: "Livraison rapide",
    description: "24-48h à Dakar, partout au Sénégal",
  },
  {
    icon: RefreshCcw,
    title: "Retours gratuits",
    description: "Échange ou remboursement sous 14 jours",
  },
  {
    icon: Sprout,
    title: "Matières douces",
    description: "Coton sélectionné pour la peau des petits",
  },
  {
    icon: HeartHandshake,
    title: "Conseils de mamans",
    description: "Une équipe à votre écoute 7j/7",
  },
]

export function TrustBadges() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const el = sectionRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  return (
    <section className="py-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={sectionRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {badges.map((badge, index) => (
            <div
              key={badge.title}
              className={`flex items-center gap-3 rounded-2xl bg-card p-3.5 sm:p-4 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <badge.icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-medium text-sm sm:text-base text-foreground leading-tight">
                  {badge.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
