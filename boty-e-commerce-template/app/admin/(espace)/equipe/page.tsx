"use client"

import { useState } from "react"
import { Check, Shield, Trash2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLE_DESCRIPTIONS, ROLE_LABELS, useAdmin } from "@/lib/admin/store"
import type { TeamRole } from "@/lib/admin/types"
import {
  ActionButton,
  FloatingField,
  PageHeader,
  Panel,
  SegmentedField,
  SelectField,
  ToggleField,
} from "@/components/admin/ui"

const PERMISSIONS: { label: string; roles: TeamRole[] }[] = [
  { label: "Voir le tableau de bord", roles: ["proprietaire", "gestionnaire", "preparateur", "lecture"] },
  { label: "Créer et modifier des produits", roles: ["proprietaire", "gestionnaire"] },
  { label: "Faire avancer les commandes", roles: ["proprietaire", "gestionnaire", "preparateur"] },
  { label: "Consulter les fiches clientes", roles: ["proprietaire", "gestionnaire"] },
  { label: "Modifier les réglages de la boutique", roles: ["proprietaire", "gestionnaire"] },
  { label: "Inviter et retirer des membres", roles: ["proprietaire"] },
]

const ROLES: TeamRole[] = ["proprietaire", "gestionnaire", "preparateur", "lecture"]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })
}

export default function EquipePage() {
  const { team, inviteMember, updateMember, removeMember } = useAdmin()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamRole>("gestionnaire")
  const [sent, setSent] = useState(false)

  const canSubmit = name.trim().length > 2 && /.+@.+\..+/.test(email)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    inviteMember({ name: name.trim(), email: email.trim().toLowerCase(), role, active: true })
    setName("")
    setEmail("")
    setRole("gestionnaire")
    setSent(true)
    window.setTimeout(() => setSent(false), 2600)
  }

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Équipe & rôles"
        description="Qui accède à quoi dans l'arrière-boutique."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Membres" subtitle={`${team.filter((m) => m.active).length} actifs sur ${team.length}`} bodyClassName="px-0 py-0">
          <ul>
            {team.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 border-b border-border/40 px-5 py-4 last:border-0 sm:px-6"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    member.active ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {member.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Rejoint le {formatDate(member.invitedAt)}</p>
                </div>
                <SelectField
                  className="w-44"
                  value={member.role}
                  onChange={(value) => updateMember(member.id, { role: value })}
                  options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                />
                <button
                  type="button"
                  onClick={() => updateMember(member.id, { active: !member.active })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    member.active ? "bg-accent/15 text-[#4f6a49]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {member.active ? "Actif" : "Suspendu"}
                </button>
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  disabled={member.role === "proprietaire"}
                  className="grid h-8 w-8 place-items-center rounded-full text-destructive transition hover:bg-destructive/10 disabled:opacity-30"
                  aria-label={`Retirer ${member.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel title="Inviter un membre">
            <form onSubmit={submit} className="space-y-4">
              <FloatingField label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
              <FloatingField
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <SegmentedField<TeamRole>
                label="Rôle"
                columns={2}
                value={role}
                onChange={setRole}
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r], hint: ROLE_DESCRIPTIONS[r] }))}
              />
              <ActionButton variant="primary" className="w-full" type="submit" disabled={!canSubmit}>
                <UserPlus className="h-4 w-4" /> Envoyer l&apos;invitation
              </ActionButton>
              {sent && (
                <p className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/12 py-2 text-xs text-[#4f6a49] animate-scale-fade-in">
                  <Check className="h-3.5 w-3.5" /> Membre ajouté à l&apos;équipe
                </p>
              )}
              <p className="text-center text-[11px] text-muted-foreground">
                Maquette : aucun e-mail n&apos;est réellement envoyé.
              </p>
            </form>
          </Panel>

          <Panel title="Sécurité">
            <div className="space-y-3">
              <ToggleField
                label="Double authentification"
                description="À brancher sur un vrai fournisseur d'identité lors de la mise en production."
                checked={false}
                onChange={() => undefined}
              />
              <p className="flex gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                L&apos;accès actuel est simulé côté navigateur. Il faudra une authentification serveur et un contrôle
                des rôles côté API avant toute mise en ligne.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-5">
        <Panel title="Matrice des permissions" subtitle="Ce que chaque rôle peut faire" bodyClassName="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Action</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-3 text-center font-medium">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr key={permission.label} className="border-b border-border/40 last:border-0">
                    <td className="px-6 py-3">{permission.label}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-3 py-3 text-center">
                        {permission.roles.includes(r) ? (
                          <Check className="mx-auto h-4 w-4 text-accent" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
