"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Sprout, Ruler, ShieldCheck, Smile } from "lucide-react"

const features = [
  {
    icon: Sprout,
    title: "Matières saines",
    description: "Coton doux et respirant, testé pour les peaux fragiles.",
  },
  {
    icon: Ruler,
    title: "Coupes bien pensées",
    description: "Des tailles justes qui laissent les enfants bouger librement.",
  },
  {
    icon: ShieldCheck,
    title: "Fait pour durer",
    description: "Coutures renforcées qui résistent aux jeux et aux lavages.",
  },
  {
    icon: Smile,
    title: "Choisis avec amour",
    description: "Chaque pièce est sélectionnée par notre équipe de mamans.",
  },
]

/** Section « Notre Histoire » : deux visuels en parallaxe et les quatre promesses. */
export function FeatureSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 },
    )
    const el = sectionRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={sectionRef}
          className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Images */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden boty-shadow mt-8">
              <Image
                src="/images/mcm/real/enf2-net.png"
                alt="Deux enfants en ensemble safari M comme Maman"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden boty-shadow">
              <Image
                src="/images/mcm/real/Ensemble_enfant-26-net-retouche.png"
                alt="Ensemble enfant du catalogue"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-primary mb-4 block">
              Pourquoi M comme Maman
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 text-balance leading-tight">
              Notre Histoire
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
              Nous choisissons chaque vêtement comme s&apos;il était pour nos propres enfants : doux au toucher, solide dans le temps et pensé pour le confort. C&apos;est notre promesse.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {features.map((feature) => (
                <div key={feature.title} className="bg-card rounded-2xl p-5">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                    <feature.icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-snug">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
