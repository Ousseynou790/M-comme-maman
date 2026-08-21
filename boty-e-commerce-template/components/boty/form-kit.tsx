"use client"

import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Champ de saisie                                                     */
/* ------------------------------------------------------------------ */

export function FormField({
  label,
  icon: Icon,
  hint,
  error,
  valid,
  optional,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: LucideIcon
  hint?: ReactNode
  /** Message affiché seulement quand le champ a déjà été quitté une fois. */
  error?: string
  /** Coche discrète quand la saisie est correcte : le formulaire répond pendant la frappe. */
  valid?: boolean
  optional?: boolean
}) {
  const id = useId()

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {optional && <span className="text-xs text-muted-foreground">facultatif</span>}
      </label>

      <div
        className={`group flex items-center gap-2.5 rounded-2xl border bg-background px-4 boty-transition ${
          error
            ? "border-destructive/70 bg-destructive/[0.03]"
            : "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
        }`}
      >
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 boty-transition ${
              error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
            }`}
          />
        )}
        <input
          id={id}
          {...props}
          className="w-full bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        />
        {valid && !error && (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20 animate-scale-fade-in">
            <Check className="h-3 w-3 text-[#4f6a49]" />
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive animate-scale-fade-in">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/* Conservé pour les écrans qui l'utilisaient déjà. */
export const AuthField = FormField

export function TextareaField({
  label,
  hint,
  optional,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength,
}: {
  label: string
  hint?: ReactNode
  optional?: boolean
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {optional && <span className="text-xs text-muted-foreground">facultatif</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none boty-transition placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
      />
      {(hint || maxLength) && (
        <div className="mt-1.5 flex items-start justify-between gap-4 text-xs text-muted-foreground">
          <span>{hint}</span>
          {maxLength && <span className="shrink-0">{value.length}/{maxLength}</span>}
        </div>
      )}
    </div>
  )
}

/** Carte à cocher, style bouton radio : zone de livraison, moyen de paiement… */
export function ChoiceCard({
  active,
  title,
  hint,
  aside,
  icon: Icon,
  onClick,
}: {
  active: boolean
  title: string
  hint?: string
  aside?: ReactNode
  icon?: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left boty-transition ${
        active
          ? "border-primary bg-primary/[0.06] shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
          : "border-border hover:border-primary/40"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 boty-transition ${
          active ? "border-primary" : "border-border"
        }`}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-primary animate-scale-fade-in" />}
      </span>
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      {aside && <span className="shrink-0 text-sm font-medium text-foreground">{aside}</span>}
    </button>
  )
}

/** Carte de contenu, commune au profil, au tableau de bord et à la commande. */
export function SectionCard({
  title,
  description,
  step,
  action,
  children,
  className,
}: {
  title?: ReactNode
  description?: ReactNode
  /** Numéro affiché en pastille, pour un formulaire en étapes. */
  step?: number
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[1.6rem] bg-card p-6 boty-shadow sm:p-7 ${className ?? ""}`}>
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-3 font-serif text-xl text-foreground">
                {step !== undefined && (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {step}
                  </span>
                )}
                {title}
              </h2>
            )}
            {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

type ButtonTone = "primary" | "outline" | "ghost" | "danger"

const toneStyles: Record<ButtonTone, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-foreground/15 text-foreground hover:bg-foreground/5",
  ghost: "text-muted-foreground hover:text-foreground",
  danger: "border border-destructive/30 text-destructive hover:bg-destructive/10",
}

/** Bouton commun aux écrans du compte : même rayon, même hauteur, même transition. */
export function FormButton({
  tone = "outline",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium boty-transition disabled:cursor-not-allowed disabled:opacity-50 ${toneStyles[tone]} ${className ?? ""}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Mot de passe                                                        */
/* ------------------------------------------------------------------ */

export function PasswordField({
  label,
  error,
  hint,
  value,
  onChange,
  onBlur,
  autoComplete,
  placeholder,
  valid,
  icon: Icon,
}: {
  label: string
  error?: string
  hint?: ReactNode
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  autoComplete?: string
  placeholder?: string
  valid?: boolean
  icon?: LucideIcon
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>

      <div
        className={`group flex items-center gap-2.5 rounded-2xl border bg-background pl-4 pr-2 boty-transition ${
          error
            ? "border-destructive/70 bg-destructive/[0.03]"
            : "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
        }`}
      >
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 boty-transition ${
              error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
            }`}
          />
        )}
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {valid && !error && (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20">
            <Check className="h-3 w-3 text-[#4f6a49]" />
          </span>
        )}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground boty-transition hover:bg-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive animate-scale-fade-in">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/** Barre de robustesse + critères qui se cochent pendant la frappe. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const rules = [
    { label: "8 caractères", done: password.length >= 8 },
    { label: "une majuscule", done: /[A-Z]/.test(password) },
    { label: "un chiffre", done: /[0-9]/.test(password) },
    { label: "un symbole", done: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = rules.filter((r) => r.done).length + (password.length >= 12 ? 1 : 0)
  const labels = ["Très faible", "Faible", "Correct", "Bon", "Solide"]
  const colors = ["bg-destructive", "bg-destructive", "bg-[#C79A6B]", "bg-accent", "bg-accent"]
  const index = Math.max(0, Math.min(4, score - 1))

  return (
    <div className="mt-2.5 rounded-2xl bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full boty-transition ${i < score ? colors[index] : "bg-border"}`}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{labels[index]}</span>
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs boty-transition ${
              rule.done ? "text-[#4f6a49]" : "text-muted-foreground"
            }`}
          >
            <span
              className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
                rule.done ? "bg-accent/25" : "border border-dashed border-border"
              }`}
            >
              {rule.done && <Check className="h-2 w-2" />}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Autres briques                                                      */
/* ------------------------------------------------------------------ */

export function CheckboxField({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <span
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border boty-transition ${
            checked ? "border-primary bg-primary text-primary-foreground" : error ? "border-destructive" : "border-border"
          }`}
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">{children}</span>
      </label>
      {error && <p className="ml-8 mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function SubmitButton({
  pending,
  pendingLabel,
  icon: Icon,
  children,
  disabled,
}: {
  pending?: boolean
  pendingLabel?: string
  icon?: LucideIcon
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground boty-transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel ?? "Un instant…"}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </>
      )}
    </button>
  )
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive animate-scale-fade-in">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

/** Petit intertitre pour aérer un formulaire long. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 flex w-full items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
        <span className="h-px flex-1 bg-border" />
      </legend>
      {children}
    </fieldset>
  )
}

/* ------------------------------------------------------------------ */
/* Mise en page en deux volets                                         */
/* ------------------------------------------------------------------ */

const PROMISES = [
  "Vos commandes et leur suivi au même endroit",
  "Vos favoris gardés d'une visite à l'autre",
  "Vos adresses pré-remplies au moment de payer",
]

export function AuthSplit({
  eyebrow,
  title,
  description,
  image,
  quote,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  image: string
  quote: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-14">
      <div className="grid overflow-hidden rounded-[2rem] bg-card boty-shadow lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        {/* Volet visuel */}
        <div className="relative hidden min-h-[560px] overflow-hidden bg-[#30282a] lg:block">
          <Image src={image} alt="" fill sizes="420px" className="object-cover opacity-45" priority />
          <div className="hero-grain absolute inset-0 opacity-20" />
          <div className="relative flex h-full flex-col justify-between p-9 text-[#fffaf5]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ef9d82] font-serif text-lg text-[#30282a]">
              M
            </span>

            <div>
              <p className="text-balance font-serif text-3xl leading-tight">{quote}</p>
              <ul className="mt-7 space-y-3">
                {PROMISES.map((promise) => (
                  <li key={promise} className="flex items-start gap-2.5 text-sm text-white/70">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#ef9d82]/25">
                      <Check className="h-2.5 w-2.5 text-[#ef9d82]" />
                    </span>
                    {promise}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/shop" className="text-sm text-white/55 underline underline-offset-4 boty-transition hover:text-white">
              Retour à la boutique
            </Link>
          </div>
        </div>

        {/* Volet formulaire */}
        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-7">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</span>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>

          {children}

          {footer && <div className="mt-7 border-t border-border/60 pt-5 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* Conservé pour compatibilité : encadré simple, centré. */
export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-14 lg:py-20">
      <div className="mb-8 text-center">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</span>
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">{title}</h1>
        <p className="mt-2.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-[1.6rem] bg-card p-6 boty-shadow sm:p-8">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  )
}
