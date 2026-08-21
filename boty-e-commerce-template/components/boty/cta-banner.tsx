"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTABanner() {
  const [isVisible, setIsVisible] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 },
    )
    const el = bannerRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={bannerRef}
          className={`rounded-[2rem] overflow-hidden bg-primary text-primary-foreground grid lg:grid-cols-2 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Copy */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-foreground/70 mb-4">
              Offre de la rentrée
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-balance leading-tight">
              -15% sur votre première commande
            </h3>
            <p className="text-primary-foreground/85 leading-relaxed mb-8 max-w-md">
              Rejoignez la communauté M comme Maman et profitez de la livraison offerte à Dakar dès 25 000 FCFA.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-primary-foreground text-primary px-8 py-4 rounded-full text-sm font-medium boty-transition hover:bg-primary-foreground/90 w-fit"
            >
              J&apos;en profite
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Image */}
          <div className="relative min-h-[260px] overflow-hidden lg:min-h-0">
            <Image
              src="/images/mcm/real/promo-garcon-haut-blanc-dakar-v2.png"
              alt="Jeune garçon sénégalais portant une pièce du vestiaire M comme Maman"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
