"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Mail, MapPin, Phone, ShieldCheck, User, UserPlus } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { useAuth } from "@/components/boty/auth-context"
import {
  AuthSplit,
  CheckboxField,
  FormAlert,
  FormField,
  FormSection,
  PasswordField,
  PasswordStrength,
  SubmitButton,
} from "@/components/boty/form-kit"

type FieldName = "name" | "email" | "phone" | "password" | "confirm" | "terms"

export default function InscriptionPage() {
  return (
    <Suspense fallback={null}>
      <InscriptionContent />
    </Suspense>
  )
}

function InscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("suite") ?? "/compte"
  const { register, account, hydrated } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [optIn, setOptIn] = useState(true)
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Déjà connectée : cette page n'a plus lieu d'être.
  useEffect(() => {
    if (hydrated && account) router.replace(redirectTo)
  }, [hydrated, account, redirectTo, router])

  const errors = useMemo(() => {
    const list: Partial<Record<FieldName, string>> = {}
    if (name.trim().length < 3) list.name = "Indiquez votre nom complet."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) list.email = "Cette adresse ne semble pas valide."
    if (!/^[0-9+\s().-]{9,}$/.test(phone.trim())) list.phone = "Un numéro joignable, par exemple 77 123 45 67."
    if (password.length < 8) list.password = "Au moins 8 caractères."
    if (confirm !== password) list.confirm = "Les deux mots de passe diffèrent."
    if (!terms) list.terms = "Merci d'accepter les conditions générales."
    return list
  }, [name, email, phone, password, confirm, terms])

  // Un message n'apparaît qu'une fois le champ quitté : on ne gronde pas pendant la frappe.
  const markTouched = (field: FieldName) => setTouched((s) => new Set(s).add(field))
  const errorOf = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)
  const validOf = (field: FieldName) => touched.has(field) && !errors[field]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(new Set<FieldName>(["name", "email", "phone", "password", "confirm", "terms"]))
    setServerError(null)
    if (Object.keys(errors).length > 0) return

    setPending(true)
    const result = await register({ name, email, phone, city, password, marketingOptIn: optIn })
    setPending(false)

    if (!result.ok) {
      setServerError(result.error ?? "La création du compte a échoué.")
      return
    }
    router.push(redirectTo)
  }

  const connexionHref = `/compte/connexion${redirectTo !== "/compte" ? `?suite=${encodeURIComponent(redirectTo)}` : ""}`

  return (
    <main className="min-h-screen">
      <Header />

      <AuthSplit
        eyebrow="Nouvelle cliente"
        title="Créer mon compte"
        description="Deux minutes, et la boutique se souvient de vous."
        image="/images/mcm/real/hero-fille-polo-dakar-v2.png"
        quote="Le vestiaire des petits, gardé au chaud pour vous."
        footer={
          <span className="text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href={connexionHref} className="font-medium text-primary underline underline-offset-4">
              Se connecter
            </Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {serverError && <FormAlert>{serverError}</FormAlert>}

          <FormSection title="Vous">
            <FormField
              label="Nom et prénom"
              icon={User}
              placeholder="Aïssatou Diop"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
              error={errorOf("name")}
              valid={validOf("name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Adresse e-mail"
                icon={Mail}
                type="email"
                placeholder="aissatou@example.sn"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                error={errorOf("email")}
                valid={validOf("email")}
              />
              <FormField
                label="Téléphone"
                icon={Phone}
                inputMode="tel"
                placeholder="77 123 45 67"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => markTouched("phone")}
                error={errorOf("phone")}
                valid={validOf("phone")}
              />
            </div>
            <FormField
              label="Ville ou quartier"
              icon={MapPin}
              optional
              placeholder="Sacré-Cœur 3, Dakar"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              hint="Pré-remplira vos futures commandes."
            />
          </FormSection>

          <FormSection title="Sécurité">
            <div>
              <PasswordField
                label="Mot de passe"
                icon={Lock}
                value={password}
                onChange={setPassword}
                onBlur={() => markTouched("password")}
                autoComplete="new-password"
                error={errorOf("password")}
              />
              <PasswordStrength password={password} />
            </div>
            <PasswordField
              label="Confirmer le mot de passe"
              icon={Lock}
              value={confirm}
              onChange={setConfirm}
              onBlur={() => markTouched("confirm")}
              autoComplete="new-password"
              error={errorOf("confirm")}
              valid={Boolean(confirm) && confirm === password}
            />
          </FormSection>

          <div className="space-y-3">
            <CheckboxField checked={optIn} onChange={setOptIn}>
              Je souhaite recevoir les nouveautés et les ventes privées par e-mail.
            </CheckboxField>
            <CheckboxField
              checked={terms}
              onChange={(v) => {
                setTerms(v)
                markTouched("terms")
              }}
              error={errorOf("terms")}
            >
              J&apos;accepte les conditions générales et la politique de confidentialité.
            </CheckboxField>
          </div>

          <div className="space-y-3">
            <SubmitButton pending={pending} pendingLabel="Création du compte…" icon={UserPlus}>
              Créer mon compte
            </SubmitButton>

            <p className="flex gap-2 rounded-2xl bg-background px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Maquette : le compte est enregistré dans ce navigateur, pas sur un serveur. Le mot de passe est haché
              avec un sel, mais n&apos;utilisez pas ici un mot de passe qui vous sert ailleurs.
            </p>
          </div>
        </form>
      </AuthSplit>

      <Footer />
    </main>
  )
}
