"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, UserRound } from "lucide-react"

/* Commandes et favoris restent accessibles par les icônes de l'en-tête : les
   répéter ici alourdissait la barre sans rien apporter. */
const LINKS = [
  { href: "/compte", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/compte/profil", label: "Mon profil", icon: UserRound },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Espace client" className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
      {LINKS.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm boty-transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground/70 hover:text-foreground boty-shadow"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
