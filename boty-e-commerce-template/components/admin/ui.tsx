"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react"
import { Check, ChevronDown, Minus, Plus, Search, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrderStatus, ProductStatus } from "@/lib/admin/types"
import { STATUS_LABELS } from "@/lib/admin/store"

/* ------------------------------------------------------------------ */
/* Mise en page                                                        */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-popover/80 backdrop-blur-sm boty-shadow",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="font-serif text-lg font-medium leading-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
    </section>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow && (
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="font-serif text-3xl font-medium leading-none sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Boutons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "soft"

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-105 shadow-[0_10px_24px_-14px_var(--primary)]",
  soft: "bg-secondary text-foreground hover:bg-secondary/70",
  outline: "border border-border bg-transparent hover:bg-secondary/60",
  ghost: "hover:bg-secondary/60",
  danger: "border border-destructive/30 text-destructive hover:bg-destructive/10",
}

export function ActionButton({
  variant = "outline",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Pastilles d'état                                                    */
/* ------------------------------------------------------------------ */

const orderStatusStyles: Record<OrderStatus, string> = {
  en_attente: "bg-[#C79A6B]/15 text-[#8a6a3f]",
  payee: "bg-accent/15 text-accent",
  preparation: "bg-chart-3/25 text-[#a15c3a]",
  expediee: "bg-primary/12 text-primary",
  livree: "bg-accent/20 text-[#4f6a49]",
  annulee: "bg-destructive/10 text-destructive",
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", orderStatusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}

const productStatusStyles: Record<ProductStatus, string> = {
  publie: "bg-accent/15 text-[#4f6a49]",
  brouillon: "bg-muted text-muted-foreground",
  archive: "bg-destructive/10 text-destructive",
}

const productStatusLabels: Record<ProductStatus, string> = {
  publie: "Publié",
  brouillon: "Brouillon",
  archive: "Archivé",
}

export function ProductStatusPill({ status }: { status: ProductStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium", productStatusStyles[status])}>
      {productStatusLabels[status]}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Champs de formulaire — l'étiquette flotte quand le champ est rempli */
/* ------------------------------------------------------------------ */

export function FloatingField({
  label,
  hint,
  suffix,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; suffix?: ReactNode; error?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <div
        className={cn(
          "group relative rounded-2xl border bg-input/40 transition focus-within:border-primary focus-within:bg-popover focus-within:shadow-[0_0_0_4px_var(--ring)]/10",
          error ? "border-destructive/60" : "border-border",
        )}
      >
        <input
          id={id}
          {...props}
          placeholder={props.placeholder ?? " "}
          className="peer w-full bg-transparent px-4 pb-2.5 pt-6 text-sm text-foreground outline-none placeholder:text-transparent"
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:text-primary"
        >
          {label}
        </label>
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      {(hint || error) && (
        <p className={cn("mt-1.5 px-1 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Champs « libellé au-dessus » — utilisés par l'éditeur de produit    */
/* ------------------------------------------------------------------ */

export function StackedField({
  label,
  hint,
  suffix,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; suffix?: ReactNode; error?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-xl border bg-popover px-4 transition focus-within:border-foreground/45",
          error ? "border-destructive/60" : "border-border",
        )}
      >
        <input
          id={id}
          {...props}
          className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {suffix && <span className="ml-3 shrink-0 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {(hint || error) && (
        <p className={cn("mt-2 text-xs leading-relaxed", error ? "text-destructive" : "text-muted-foreground")}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function StackedTextarea({
  label,
  hint,
  maxLength,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode }) {
  const id = useId()
  const value = String(props.value ?? "")
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        {...props}
        maxLength={maxLength}
        className="w-full resize-y rounded-xl border border-border bg-popover px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-foreground/45"
      />
      {(hint || maxLength) && (
        <div className="mt-2 flex items-start justify-between gap-4 text-xs text-muted-foreground">
          <span className="leading-relaxed">{hint}</span>
          {maxLength && <span className="shrink-0">{value.length}/{maxLength}</span>}
        </div>
      )}
    </div>
  )
}

export function StackedSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  hint?: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none rounded-xl border border-border bg-popover py-3 pl-4 pr-10 text-sm outline-none transition focus:border-foreground/45"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Pavés de sélection : l'option retenue est remplie en sombre. */
export function OptionPills<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  hint,
}: {
  label?: string
  options: { value: T; label: string; swatch?: string; note?: string }[]
  value: T | T[]
  onChange: (value: T) => void
  multiple?: boolean
  hint?: ReactNode
}) {
  const selected = Array.isArray(value) ? value : [value]
  return (
    <div>
      {label && <span className="mb-2 block text-sm font-medium">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={multiple ? active : undefined}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition",
                active
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-border bg-popover text-foreground hover:border-foreground/40",
              )}
            >
              {option.swatch && (
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border",
                    active ? "border-background/40" : "border-border",
                  )}
                  style={{ background: option.swatch }}
                />
              )}
              <span className={cn(option.note ? "text-left leading-tight" : "")}>
                {option.label}
                {option.note && (
                  <span className={cn("mt-0.5 block text-[10px] leading-none", active ? "text-background/60" : "text-muted-foreground")}>
                    {option.note}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FloatingTextarea({
  label,
  hint,
  maxLength,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId()
  const value = String(props.value ?? "")
  return (
    <div className={className}>
      <div className="group relative rounded-2xl border border-border bg-input/40 transition focus-within:border-primary focus-within:bg-popover">
        <textarea
          id={id}
          {...props}
          maxLength={maxLength}
          placeholder={props.placeholder ?? " "}
          className="peer w-full resize-y bg-transparent px-4 pb-3 pt-6 text-sm leading-relaxed text-foreground outline-none placeholder:text-transparent"
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:text-primary"
        >
          {label}
        </label>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{hint}</span>
        {maxLength && (
          <span className={cn(value.length > maxLength * 0.9 && "text-primary")}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

/** Saisie d'une liste de valeurs sous forme de pastilles (tailles, couleurs…). */
export function ChipsField({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder = "Saisir puis Entrée",
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  const add = (raw: string) => {
    const value = raw.trim()
    if (!value || values.includes(value)) return
    onChange([...values, value])
    setDraft("")
  }

  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div className="rounded-2xl border border-border bg-input/40 p-2.5 transition focus-within:border-primary focus-within:bg-popover">
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium animate-scale-fade-in"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="text-muted-foreground transition hover:text-destructive"
                aria-label={`Retirer ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                add(draft)
              }
              if (e.key === "Backspace" && !draft && values.length) {
                onChange(values.slice(0, -1))
              }
            }}
            onBlur={() => add(draft)}
            placeholder={values.length ? "" : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
          />
        </div>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          <span className="py-1 text-[11px] text-muted-foreground">Raccourcis :</span>
          {suggestions
            .filter((s) => !values.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

/** Sélecteur segmenté : des options en pastilles plutôt qu'un menu déroulant. */
export function SegmentedField<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 3,
}: {
  label: string
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (value: T) => void
  columns?: number
}) {
  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-2xl border px-3 py-2.5 text-left text-sm transition",
                active
                  ? "border-primary bg-primary/10 text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
                  : "border-border bg-input/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
                {option.label}
              </span>
              {option.hint && <span className="mt-0.5 block text-[11px] text-muted-foreground">{option.hint}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-input/40 px-4 py-3 text-left transition hover:border-primary/40"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-primary" : "bg-border",
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-popover shadow transition-all",
            checked ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  )
}

export function StepperField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-input/40 px-4 py-3">
      <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid h-8 w-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary"
          aria-label="Diminuer"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full bg-transparent text-center font-serif text-2xl outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="grid h-8 w-8 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary"
          aria-label="Augmenter"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function StarField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div>
      <span className="mb-2 block px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Note affichée
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-input/40 px-4 py-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-5 w-5 transition",
                (hover || value) >= star ? "fill-primary text-primary scale-110" : "text-border",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{value}/5</span>
      </div>
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = "Rechercher…",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-input/40 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-popover"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className="w-full appearance-none rounded-full border border-border bg-input/40 py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-primary focus:bg-popover"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tiroir latéral                                                      */
/* ------------------------------------------------------------------ */

export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] animate-blur-in"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-popover shadow-2xl animate-scale-fade-in">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-serif text-xl font-medium leading-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-secondary"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="border-t border-border px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="font-serif text-lg">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Compte animé : les chiffres montent doucement à l'affichage. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (from === value) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const duration = 650
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (value - from) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    /* Onglet en arrière-plan : le navigateur suspend requestAnimationFrame et le
       chiffre resterait sur l'ancienne valeur. Ce filet le pose à l'arrivée. */
    const filet = window.setTimeout(() => setDisplay(value), duration + 80)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(filet)
    }
  }, [value])

  return <>{format(Math.round(display))}</>
}
