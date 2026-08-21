"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Info, Lock, Mail } from "lucide-react"
import { ADMIN_SESSION_KEY } from "@/components/admin/shell"
import { ActionButton, FloatingField } from "@/components/admin/ui"

const DEMO_EMAIL = "ousseynou@mcommemaman.sn"
const DEMO_PASSWORD = "mcm2026"

export default function ConnexionPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setError("Identifiants incorrects. Utilisez le compte de démonstration indiqué ci-dessous.")
      return
    }
    setLoading(true)
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ email, at: Date.now() }))
    router.replace("/admin")
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau visuel */}
      <div className="relative hidden overflow-hidden bg-[#30282a] lg:block">
        <Image
          src="/images/mcm/real/Ensemble_enfant-2.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="hero-grain absolute inset-0 opacity-25" />
        <div className="relative flex h-full flex-col justify-between p-12 text-[#fffaf5]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ef9d82] font-serif text-xl text-[#30282a]">
            M
          </span>
          <div>
            <h1 className="max-w-md text-balance font-serif text-5xl font-medium leading-[1.05]">
              La boutique se pilote ici.
            </h1>
            <p className="mt-4 max-w-sm text-white/65">
              Catalogue, commandes, clientes et statistiques : tout l&apos;arrière-boutique de M comme Maman en un seul
              endroit.
            </p>
          </div>
          <Link href="/" className="text-sm text-white/60 underline underline-offset-4 transition hover:text-white">
            Retour à la boutique
          </Link>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">
          <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
            Espace administration
          </span>
          <h2 className="font-serif text-3xl font-medium leading-tight">Bon retour parmi nous</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour gérer le catalogue et les commandes.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <FloatingField
              label="Adresse e-mail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              suffix={<Mail className="h-4 w-4" />}
            />
            <FloatingField
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffix={<Lock className="h-4 w-4" />}
              error={error ?? undefined}
            />
            <ActionButton variant="primary" className="w-full" disabled={loading} type="submit">
              {loading ? "Connexion…" : "Entrer dans l'espace"}
              <ArrowRight className="h-4 w-4" />
            </ActionButton>
          </form>

          <div className="mt-6 flex gap-3 rounded-2xl border border-dashed border-border px-4 py-3.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Compte de démonstration</p>
              <p className="mt-1">
                {DEMO_EMAIL} — mot de passe <code className="rounded bg-secondary px-1">{DEMO_PASSWORD}</code>
              </p>
              <p className="mt-2">
                Cette page est une maquette : la vérification se fait dans le navigateur et ne protège rien. Un vrai
                déploiement doit passer par une authentification côté serveur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
