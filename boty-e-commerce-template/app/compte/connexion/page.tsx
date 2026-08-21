"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LogIn, Lock, Mail } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useAuth } from "@/components/boty/auth-context"
import { AuthSplit, FormAlert, FormField, PasswordField, SubmitButton } from "@/components/boty/form-kit"

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionContent />
    </Suspense>
  )
}

function ConnexionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("suite") ?? "/compte"
  const { login, account, hydrated } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (hydrated && account) router.replace(redirectTo)
  }, [hydrated, account, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Renseignez votre adresse e-mail et votre mot de passe.")
      return
    }

    setPending(true)
    const result = await login(email, password)
    setPending(false)

    if (!result.ok) {
      setError(result.error ?? "La connexion a échoué.")
      return
    }
    router.push(redirectTo)
  }

  const inscriptionHref = `/compte/inscription${
    redirectTo !== "/compte" ? `?suite=${encodeURIComponent(redirectTo)}` : ""
  }`

  return (
    <main className="min-h-screen">
      <Header />

      <AuthSplit
        eyebrow="Espace client"
        title="Bon retour parmi nous"
        description="Connectez-vous pour retrouver vos commandes et vos favoris."
        image="/images/mcm/real/hero-garcon-cargo-dakar-v2.png"
        quote="Ils grandissent vite. Votre boutique s'en souvient."
        footer={
          <span className="text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href={inscriptionHref} className="font-medium text-primary underline underline-offset-4">
              Créer un compte
            </Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <FormAlert>{error}</FormAlert>}

          <FormField
            label="Adresse e-mail"
            icon={Mail}
            type="email"
            placeholder="aissatou@example.sn"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <PasswordField
              label="Mot de passe"
              icon={Lock}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Mot de passe oublié ? Écrivez-nous au{" "}
              <span className="whitespace-nowrap text-foreground">+221 77 000 00 00</span>
            </p>
          </div>

          <SubmitButton pending={pending} pendingLabel="Connexion…" icon={LogIn}>
            Se connecter
          </SubmitButton>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center rounded-full border border-foreground/15 px-8 py-3.5 text-sm text-foreground boty-transition hover:bg-foreground/5"
          >
            Continuer sans compte
          </Link>
        </form>
      </AuthSplit>

      <Footer />
    </main>
  )
}
