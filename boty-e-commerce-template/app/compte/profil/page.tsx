"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Lock, Mail, MapPin, Phone, Plus, Star, Trash2, User, X } from "lucide-react"
import { Header } from "@/components/boty/header"
import { Footer } from "@/components/boty/footer"
import { AccountNav } from "@/components/boty/account-nav"
import { useAuth } from "@/components/boty/auth-context"
import { CheckboxField, FormButton, FormField, PasswordField, SectionCard } from "@/components/boty/form-kit"
import { DELIVERY_ZONES, type DeliveryZone } from "@/lib/shipping"

const SIZE_CHOICES = [
  "0-3 mois",
  "3-6 mois",
  "6-9 mois",
  "9-12 mois",
  "2 ans",
  "4 ans",
  "6 ans",
  "8 ans",
  "10 ans",
  "12 ans",
]

export default function ProfilPage() {
  const router = useRouter()
  const {
    account,
    hydrated,
    updateProfile,
    updatePreferences,
    addAddress,
    removeAddress,
    setDefaultAddress,
    changePassword,
    deleteAccount,
  } = useAuth()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [savedInfo, setSavedInfo] = useState(false)

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [label, setLabel] = useState("")
  const [zone, setZone] = useState<DeliveryZone>("dakar")
  const [addressCity, setAddressCity] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [addressNotes, setAddressNotes] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [nextPassword, setNextPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (hydrated && !account && !leaving) router.replace("/compte/connexion?suite=/compte/profil")
  }, [hydrated, account, leaving, router])

  useEffect(() => {
    if (!account) return
    setName(account.name)
    setPhone(account.phone)
    setCity(account.city)
  }, [account])

  if (!hydrated || !account) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-[1480px] px-5 py-20 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-52 rounded-full bg-card" />
            <div className="h-64 rounded-3xl bg-card" />
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const infoDirty = name !== account.name || phone !== account.phone || city !== account.city

  const saveInfo = () => {
    updateProfile({ name: name.trim(), phone: phone.trim(), city: city.trim() })
    setSavedInfo(true)
    window.setTimeout(() => setSavedInfo(false), 2200)
  }

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (addressCity.trim().length < 2 || addressLine.trim().length < 5) return
    addAddress({
      label: label.trim() || "Adresse",
      zone,
      city: addressCity.trim(),
      address: addressLine.trim(),
      notes: addressNotes.trim(),
    })
    setLabel("")
    setAddressCity("")
    setAddressLine("")
    setAddressNotes("")
    setShowAddressForm(false)
  }

  const toggleSize = (size: string) => {
    const current = account.preferences.sizes
    updatePreferences({
      sizes: current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
    })
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (nextPassword.length < 8) {
      setPasswordMessage({ ok: false, text: "Le nouveau mot de passe doit faire au moins 8 caractères." })
      return
    }
    const result = await changePassword(currentPassword, nextPassword)
    if (result.ok) {
      setCurrentPassword("")
      setNextPassword("")
      setPasswordMessage({ ok: true, text: "Mot de passe modifié." })
    } else {
      setPasswordMessage({ ok: false, text: result.error ?? "La modification a échoué." })
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pb-20 pt-14 lg:pt-16">
        <div className="mx-auto max-w-[1480px] px-5 lg:px-8">
          <div className="mb-8">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-primary">Espace client</span>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mon profil</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos informations, vos adresses de livraison et vos préférences.
            </p>
          </div>

          <AccountNav />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-6">
            <SectionCard title="Informations personnelles">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nom et prénom" icon={User} value={name} onChange={(e) => setName(e.target.value)} />
                <FormField
                  label="Adresse e-mail"
                  icon={Mail}
                  value={account.email}
                  readOnly
                  hint="L'adresse sert d'identifiant, elle ne se change pas ici."
                  className="opacity-70"
                />
                <FormField label="Téléphone" icon={Phone} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <FormField label="Ville ou quartier" icon={MapPin} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <FormButton tone="primary" onClick={saveInfo} disabled={!infoDirty} icon={Check}>
                  Enregistrer
                </FormButton>
                {infoDirty && (
                  <FormButton
                    tone="ghost"
                    onClick={() => {
                      setName(account.name)
                      setPhone(account.phone)
                      setCity(account.city)
                    }}
                  >
                    Annuler les modifications
                  </FormButton>
                )}
                {savedInfo && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-[#4f6a49] animate-scale-fade-in">
                    <Check className="h-4 w-4" /> Enregistré
                  </span>
                )}
              </div>
            </SectionCard>

            {/* Adresses */}
            <SectionCard
              title="Carnet d'adresses"
              description="L'adresse par défaut sera proposée automatiquement à la commande."
            >
              {account.addresses.length === 0 && !showAddressForm && (
                <p className="mb-4 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
                  Aucune adresse enregistrée pour le moment.
                </p>
              )}

              <ul className="space-y-3">
                {account.addresses.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-2xl border p-4 ${
                      entry.isDefault ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <MapPin className="h-4 w-4 shrink-0 text-primary" />
                          {entry.label}
                          {entry.isDefault && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                              par défaut
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.address} — {entry.city} ·{" "}
                          {entry.zone === "dakar" ? "Dakar et banlieue" : "Autres régions"}
                        </p>
                        {entry.notes && <p className="mt-1 text-xs italic text-muted-foreground">« {entry.notes} »</p>}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {!entry.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(entry.id)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground boty-transition hover:text-primary"
                          >
                            <Star className="h-3.5 w-3.5" /> Par défaut
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAddress(entry.id)}
                          aria-label={`Supprimer l'adresse ${entry.label}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground boty-transition hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {showAddressForm ? (
                <form onSubmit={submitAddress} className="mt-4 space-y-4 rounded-2xl bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Nouvelle adresse</p>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      aria-label="Fermer le formulaire"
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground boty-transition hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Nom de l'adresse"
                      icon={Star}
                      placeholder="Maison, bureau…"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-foreground">Zone</span>
                      <select
                        value={zone}
                        onChange={(e) => setZone(e.target.value as DeliveryZone)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none boty-transition focus:border-primary"
                      >
                        {DELIVERY_ZONES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <FormField
                      label={zone === "dakar" ? "Quartier ou commune" : "Ville"}
                      placeholder={zone === "dakar" ? "Sacré-Cœur 3" : "Thiès"}
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                    />
                    <FormField
                      label="Adresse ou point de repère"
                      icon={MapPin}
                      placeholder="Villa 42, en face de la pharmacie"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                  </div>

                  <FormField
                    label="Instructions pour le livreur"
                    optional
                    placeholder="Appeler avant d'arriver"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                  />

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground boty-transition hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" /> Enregistrer l&apos;adresse
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-6 py-3 text-sm font-medium text-muted-foreground boty-transition hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" /> Ajouter une adresse
                </button>
              )}
            </SectionCard>

            {/* Préférences */}
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
            <SectionCard
              title="Préférences"
              description="Les tailles suivies nous aident à vous signaler les bonnes nouveautés."
            >
              <span className="mb-2 block text-sm font-medium text-foreground">Tailles de mes enfants</span>
              <div className="flex flex-wrap gap-2">
                {SIZE_CHOICES.map((size) => {
                  const active = account.preferences.sizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      aria-pressed={active}
                      className={`rounded-full px-4 py-2 text-sm boty-transition ${
                        active
                          ? "bg-foreground text-background"
                          : "border border-border text-foreground hover:border-foreground/40"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 space-y-3">
                <CheckboxField
                  checked={account.preferences.newsletter}
                  onChange={(checked) => {
                    updatePreferences({ newsletter: checked })
                    updateProfile({ marketingOptIn: checked })
                  }}
                >
                  Recevoir les nouveautés et ventes privées par e-mail.
                </CheckboxField>
              </div>
            </SectionCard>

            {/* Sécurité */}
            <SectionCard title="Sécurité">
              <form onSubmit={submitPassword} className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  label="Mot de passe actuel"
                  icon={Lock}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                />
                <PasswordField
                  label="Nouveau mot de passe"
                  icon={Lock}
                  value={nextPassword}
                  onChange={setNextPassword}
                  autoComplete="new-password"
                  hint="Au moins 8 caractères."
                />
                <div className="sm:col-span-2">
                  {passwordMessage && (
                    <p className={`mb-3 text-sm ${passwordMessage.ok ? "text-[#4f6a49]" : "text-destructive"}`}>
                      {passwordMessage.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full border border-foreground/15 px-6 py-3 text-sm text-foreground boty-transition hover:bg-foreground/5"
                  >
                    Modifier le mot de passe
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-border/60 pt-5">
                {confirmDelete ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLeaving(true)
                        deleteAccount()
                        router.replace("/")
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/30 px-5 py-3 text-sm font-medium text-destructive boty-transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Confirmer la suppression
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm text-muted-foreground boty-transition hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm text-muted-foreground underline underline-offset-4 boty-transition hover:text-destructive"
                  >
                    Supprimer mon compte
                  </button>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  La suppression retire le compte de ce navigateur. Vos commandes déjà passées restent visibles dans le
                  suivi.
                </p>
              </div>
            </SectionCard>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
