import type { ComponentType } from "react"
import {
  Check,
  Clock3,
  Home,
  MapPin,
  PackageCheck,
  PackageOpen,
  Sparkles,
  Truck,
  X,
} from "lucide-react"
import { ORDER_STEPS, type ShopOrderStatus } from "./orders-context"

const icons: Record<Exclude<ShopOrderStatus, "annulee">, ComponentType<{ className?: string }>> = {
  recue: PackageCheck,
  preparation: PackageOpen,
  expediee: Truck,
  livree: Home,
}

const messages: Record<Exclude<ShopOrderStatus, "annulee">, { eyebrow: string; title: string; copy: string }> = {
  recue: {
    eyebrow: "C’est parti",
    title: "Votre commande a rejoint notre atelier.",
    copy: "Nous vérifions chaque détail avant de commencer sa préparation.",
  },
  preparation: {
    eyebrow: "Entre de bonnes mains",
    title: "On prépare vos merveilles.",
    copy: "Les articles sont contrôlés, pliés avec soin puis glissés dans leur colis.",
  },
  expediee: {
    eyebrow: "Plus très loin",
    title: "Votre colis est en route.",
    copy: "Le livreur vous contactera avant son passage pour faciliter la remise.",
  },
  livree: {
    eyebrow: "Belle arrivée",
    title: "Votre commande est arrivée !",
    copy: "Nous espérons que les petits vont adorer leurs nouvelles tenues.",
  },
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function StepIcon({
  status,
  state,
}: {
  status: Exclude<ShopOrderStatus, "annulee">
  state: "done" | "current" | "waiting"
}) {
  const Icon = icons[status]

  return (
    <span
      className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 transition sm:h-14 sm:w-14 ${
        state === "done"
          ? "border-primary/15 bg-primary text-primary-foreground"
          : state === "current"
            ? "border-primary/20 bg-popover text-primary shadow-[0_0_0_8px_rgba(224,101,78,0.08)]"
            : "border-background bg-muted text-muted-foreground/55"
      }`}
    >
      {state === "done" ? <Check className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
      {state === "current" && (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-popover bg-primary">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
        </span>
      )}
    </span>
  )
}

export function OrderJourney({
  status,
  createdAt,
  city,
  zone,
}: {
  status: ShopOrderStatus
  createdAt: string
  city: string
  zone: "dakar" | "regions"
}) {
  if (status === "annulee") {
    return (
      <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-destructive/15 bg-destructive/8 p-7 boty-shadow sm:p-9">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-destructive/8" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground">
            <X className="h-7 w-7" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-destructive">Parcours interrompu</p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">Cette commande a été annulée.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Si cette annulation est une erreur, notre équipe peut vous aider à remettre la commande en route.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const currentIndex = ORDER_STEPS.findIndex((step) => step.value === status)
  const progress = Math.round(((currentIndex + 1) / ORDER_STEPS.length) * 100)
  const message = messages[status]
  const nextStep = ORDER_STEPS[currentIndex + 1]
  const ActiveIcon = icons[status]

  return (
    <section className="mb-7 overflow-hidden rounded-[2rem] bg-card boty-shadow">
      <div className="relative isolate overflow-hidden bg-[linear-gradient(120deg,#34292B_0%,#4A373A_58%,#E0654E_150%)] px-6 py-7 text-primary-foreground sm:px-9 sm:py-9">
        <div className="hero-grain absolute inset-0 -z-10 opacity-[0.08]" />
        <span className="absolute -right-14 -top-20 -z-10 h-64 w-64 rounded-full border-[42px] border-white/5" />
        <span className="absolute -bottom-24 right-40 -z-10 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <ActiveIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/65">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {message.eyebrow}
              </p>
              <h2 className="mt-2 text-balance font-serif text-2xl leading-tight sm:text-3xl">{message.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{message.copy}</p>
            </div>
          </div>

          <div className="min-w-[150px] rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">Progression</span>
              <strong className="font-serif text-2xl font-medium">{progress}%</strong>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <span className="block h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-8">
        {/* Le trajet devient vertical sur petit écran pour garder des textes lisibles. */}
        <ol className="space-y-0 sm:hidden">
          {ORDER_STEPS.map((step, index) => {
            const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "waiting"
            return (
              <li key={step.value} className="grid grid-cols-[48px_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <StepIcon status={step.value} state={state} />
                  {index < ORDER_STEPS.length - 1 && (
                    <span className={`min-h-8 w-px flex-1 ${index < currentIndex ? "bg-primary" : "border-l border-dashed border-border"}`} />
                  )}
                </div>
                <div className="pb-7 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-semibold ${state === "waiting" ? "text-muted-foreground" : "text-foreground"}`}>
                      {step.label}
                    </h3>
                    {state === "current" && (
                      <span className="rounded-full bg-primary/12 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                        Maintenant
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.hint}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="relative hidden sm:block">
          <div className="absolute left-[12.5%] right-[12.5%] top-7 h-1 rounded-full bg-background">
            <span
              className="block h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${(currentIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <ol className="relative grid grid-cols-4 gap-3">
            {ORDER_STEPS.map((step, index) => {
              const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "waiting"
              return (
                <li key={step.value} className="flex flex-col items-center text-center">
                  <StepIcon status={step.value} state={state} />
                  <h3 className={`mt-4 text-sm font-semibold ${state === "waiting" ? "text-muted-foreground" : "text-foreground"}`}>
                    {step.label}
                  </h3>
                  <p className="mt-1 max-w-[170px] text-xs leading-relaxed text-muted-foreground">{step.hint}</p>
                  {state === "current" && (
                    <span className="mt-2 rounded-full bg-primary/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                      Maintenant
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mt-2 grid gap-2 rounded-2xl bg-background p-3 sm:mt-7 sm:grid-cols-3 sm:p-2">
          <div className="flex items-center gap-3 rounded-xl bg-popover/65 px-3 py-3">
            <Clock3 className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Commandée le</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{formatShortDate(createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-popover/65 px-3 py-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Destination</p>
              <p className="mt-0.5 truncate text-xs font-medium text-foreground">{city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-popover/65 px-3 py-3">
            {nextStep ? <Truck className="h-4 w-4 shrink-0 text-primary" /> : <Check className="h-4 w-4 shrink-0 text-accent" />}
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {nextStep ? "Prochaine étape" : "Parcours terminé"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">
                {nextStep?.label ?? "Commande remise"}
                {nextStep && status === "recue" ? (zone === "dakar" ? " · 24 à 48h" : " · 2 à 5 jours") : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
