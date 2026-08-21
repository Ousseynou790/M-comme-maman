"use client"

import Link from "next/link"
import { Instagram, Facebook, MessageCircle, MapPin, Phone } from "lucide-react"
import { categories } from "@/lib/products"

const infoLinks = [
  { name: "Notre histoire", href: "/" },
  { name: "Nos engagements", href: "/" },
  { name: "Guide des tailles", href: "/" },
  { name: "Nous contacter", href: "/" },
]

const supportLinks = [
  { name: "Livraison", href: "/" },
  { name: "Retours & échanges", href: "/" },
  { name: "Suivi de commande", href: "/commandes" },
  { name: "Avis clientes", href: "/avis" },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-serif text-2xl font-semibold mb-4">M comme Maman</h2>
            <p className="text-sm text-background/70 leading-relaxed mb-6">
              Le monde des mamans. Des vêtements enfants et bébés de qualité, durables et pleins de tendresse.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="https://mcommaman.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center text-background/80 hover:bg-primary hover:text-primary-foreground boty-transition"
                  aria-label="Réseau social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-medium mb-4">Boutique</h3>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop?categorie=${c.slug}`}
                    className="text-sm text-background/70 hover:text-background boty-transition"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium mb-4">La maison</h3>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background boty-transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-medium mb-4">Aide</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background boty-transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 py-6 border-t border-background/15 text-sm text-background/70">
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Dakar, Sénégal
          </span>
          <span className="inline-flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" /> +221 77 000 00 00
          </span>
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> Du lundi au samedi, 9h — 19h
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-background/15 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/60">
            © {new Date().getFullYear()} M comme Maman. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-background/60 hover:text-background boty-transition">
              Confidentialité
            </Link>
            <Link href="/" className="text-sm text-background/60 hover:text-background boty-transition">
              Conditions générales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
