"use client"

import { useState } from "react"
import { Check, RotateCcw, Save } from "lucide-react"
import { formatPrice } from "@/lib/products"
import { useAdmin } from "@/lib/admin/store"
import type { StoreSettings } from "@/lib/admin/types"
import { HeroStudio } from "@/components/admin/hero-studio"
import {
  ActionButton,
  FloatingField,
  FloatingTextarea,
  PageHeader,
  Panel,
  StepperField,
  ToggleField,
} from "@/components/admin/ui"

export default function ReglagesPage() {
  const { settings, updateSettings, resetDemoData } = useAdmin()
  const [draft, setDraft] = useState<StoreSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const save = () => {
    updateSettings(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Réglages de la boutique"
        description="Identité, livraison et affichage. Ces valeurs alimentent le back-office et la vitrine."
      >
        <ActionButton variant="ghost" disabled={!dirty} onClick={() => setDraft(settings)}>
          Annuler
        </ActionButton>
        <ActionButton variant="primary" disabled={!dirty} onClick={save}>
          <Save className="h-4 w-4" /> Enregistrer
        </ActionButton>
      </PageHeader>

      {saved && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-accent/12 px-4 py-3 text-sm text-[#4f6a49] animate-scale-fade-in">
          <Check className="h-4 w-4" /> Réglages enregistrés.
        </p>
      )}

      <div className="mb-5">
        <HeroStudio />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Identité">
          <div className="space-y-4">
            <FloatingField label="Nom de la boutique" value={draft.storeName} onChange={(e) => set("storeName", e.target.value)} />
            <FloatingField label="Signature" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
            <FloatingField
              label="E-mail de contact"
              type="email"
              value={draft.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
            <FloatingField label="Téléphone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
            <FloatingField
              label="Devise affichée"
              value={draft.currency}
              onChange={(e) => set("currency", e.target.value)}
              hint="Utilisée dans tous les montants du back-office."
            />
          </div>
        </Panel>

        <Panel title="Livraison">
          <div className="space-y-4">
            <FloatingField
              label="Franco de port à partir de"
              type="number"
              value={draft.freeShippingThreshold}
              onChange={(e) => set("freeShippingThreshold", Number(e.target.value) || 0)}
              suffix={draft.currency}
              hint={`Actuellement : livraison offerte dès ${formatPrice(draft.freeShippingThreshold)}.`}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingField
                label="Frais Dakar"
                type="number"
                value={draft.shippingDakar}
                onChange={(e) => set("shippingDakar", Number(e.target.value) || 0)}
                suffix={draft.currency}
              />
              <FloatingField
                label="Frais régions"
                type="number"
                value={draft.shippingRegions}
                onChange={(e) => set("shippingRegions", Number(e.target.value) || 0)}
                suffix={draft.currency}
              />
            </div>
            <StepperField
              label="Seuil d'alerte de stock"
              value={draft.lowStockThreshold}
              onChange={(v) => set("lowStockThreshold", v)}
            />
          </div>
        </Panel>

        <Panel title="Vitrine">
          <div className="space-y-3">
            <ToggleField
              label="Accepter les commandes"
              description="Désactivez pendant les congés : la boutique reste consultable."
              checked={draft.acceptOrders}
              onChange={(v) => set("acceptOrders", v)}
            />
            <ToggleField
              label="Afficher le bandeau promotionnel"
              description="La bande verte en haut de la boutique."
              checked={draft.showPromoBanner}
              onChange={(v) => set("showPromoBanner", v)}
            />
            <FloatingTextarea
              label="Texte du bandeau"
              rows={3}
              maxLength={120}
              value={draft.promoBannerText}
              onChange={(e) => set("promoBannerText", e.target.value)}
            />
          </div>
        </Panel>

        <Panel title="Données de démonstration">
          <p className="text-sm text-muted-foreground">
            Le catalogue, les commandes et les clientes sont générés localement puis conservés dans le stockage de ce
            navigateur. La réinitialisation efface vos modifications et régénère le jeu d&apos;origine.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {confirmReset ? (
              <>
                <ActionButton variant="ghost" onClick={() => setConfirmReset(false)}>
                  Annuler
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => {
                    resetDemoData()
                    setConfirmReset(false)
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Confirmer la réinitialisation
                </ActionButton>
              </>
            ) : (
              <ActionButton variant="outline" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" /> Réinitialiser les données
              </ActionButton>
            )}
          </div>
        </Panel>
      </div>
    </>
  )
}
