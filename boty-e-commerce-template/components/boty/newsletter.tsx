"use client"

import type React from "react"
import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
    }
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-primary mb-4 block">
            La lettre des mamans
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4 text-balance">
            Restons en contact
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Nouveautés, offres privées et conseils pour habiller vos enfants — directement dans votre boîte mail.
          </p>

          {isSubscribed ? (
            <div className="inline-flex items-center gap-3 bg-primary/10 rounded-full px-8 py-4">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Bienvenue dans la famille M comme Maman&nbsp;!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 bg-background border border-border rounded-full px-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary boty-transition"
                required
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-medium boty-transition hover:bg-primary/90"
              >
                S&apos;inscrire
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 boty-transition" />
              </button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Désinscription possible à tout moment. Nous respectons votre boîte mail.
          </p>
        </div>
      </div>
    </section>
  )
}
