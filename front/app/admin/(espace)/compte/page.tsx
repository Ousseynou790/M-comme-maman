"use client";

import { useEffect, useState } from "react";
import { ErreurApi, envoyer } from "@/lib/api";
import { Button, Field, Input, PageHeader, Section } from "@/components/admin/ui";
import { IconCheck, IconLockAdmin } from "@/components/admin/icons";

/**
 * Mon compte, côté back-office.
 *
 * L'équipe se connecte avec un compte comme celui des clientes — c'est le même
 * modèle, distingué par le rôle. Tout ce qui la concerne se règle ici : son nom,
 * son téléphone, son mot de passe. Rien ne renvoie vers l'espace client.
 *
 * L'adresse électronique et le rôle s'affichent sans se modifier : l'une sert
 * d'identifiant, l'autre se décide plus haut. Le serveur refuserait de toute
 * façon un `PATCH` sur ces deux champs.
 */

type Utilisateur = {
  nom: string;
  email: string;
  role: "cliente" | "preparatrice" | "gerante";
  telephone: string;
  ville: string;
};

const ROLES: Record<Utilisateur["role"], string> = {
  cliente: "Cliente",
  preparatrice: "Préparatrice",
  gerante: "Gérante",
};

type Message = { ok: boolean; texte: string } | null;

/** Le message du serveur quand il en donne un, un repli lisible sinon. */
function raison(cause: unknown, repli: string): string {
  return cause instanceof ErreurApi ? cause.message : repli;
}

export default function Page() {
  const [moi, setMoi] = useState<Utilisateur | null>(null);
  const [lecture, setLecture] = useState(true);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [enregistre, setEnregistre] = useState(false);
  const [messageIdentite, setMessageIdentite] = useState<Message>(null);

  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [messageMotDePasse, setMessageMotDePasse] = useState<Message>(null);

  useEffect(() => {
    envoyer<{ utilisateur: Utilisateur | null }>("/api/compte/moi/")
      .then((reponse) => {
        setMoi(reponse.utilisateur);
        setNom(reponse.utilisateur?.nom ?? "");
        setTelephone(reponse.utilisateur?.telephone ?? "");
      })
      .catch(() => setMoi(null))
      .finally(() => setLecture(false));
  }, []);

  const modifie = moi ? nom.trim() !== moi.nom || telephone.trim() !== moi.telephone : false;

  const enregistrer = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessageIdentite(null);

    if (!nom.trim()) {
      setMessageIdentite({ ok: false, texte: "Le nom ne peut pas rester vide." });
      return;
    }

    setEnregistre(true);
    try {
      const brut = await envoyer<Utilisateur>("/api/compte/moi/", "PATCH", {
        nom: nom.trim(),
        telephone: telephone.trim(),
      });
      setMoi(brut);
      setNom(brut.nom);
      setTelephone(brut.telephone);
      setMessageIdentite({ ok: true, texte: "Enregistré." });
    } catch (cause) {
      setMessageIdentite({ ok: false, texte: raison(cause, "L'enregistrement n'a pas abouti.") });
    } finally {
      setEnregistre(false);
    }
  };

  const changerMotDePasse = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessageMotDePasse(null);

    /* Les deux contrôles que le serveur ne peut pas faire à notre place : il ne
       reçoit jamais la confirmation, et un champ vide ne mérite pas un
       aller-retour. */
    if (!actuel || !nouveau) {
      setMessageMotDePasse({ ok: false, texte: "Les deux mots de passe sont attendus." });
      return;
    }
    if (nouveau !== confirmation) {
      setMessageMotDePasse({
        ok: false,
        texte: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
      return;
    }
    if (nouveau === actuel) {
      setMessageMotDePasse({
        ok: false,
        texte: "Le nouveau mot de passe est identique à l'ancien.",
      });
      return;
    }

    setEnvoi(true);
    try {
      await envoyer("/api/compte/mot-de-passe/", "POST", { actuel, nouveau });
      setActuel("");
      setNouveau("");
      setConfirmation("");
      setMessageMotDePasse({ ok: true, texte: "Mot de passe modifié." });
    } catch (cause) {
      // Le serveur sait seul si l'ancien est le bon et si le nouveau tient : on
      // reprend son message plutôt que d'en inventer un plus vague.
      setMessageMotDePasse({ ok: false, texte: raison(cause, "Le changement n'a pas abouti.") });
    } finally {
      setEnvoi(false);
    }
  };

  if (lecture) return <p className="text-[13px] text-muted">Lecture du compte…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Mon compte"
        title={moi?.nom ?? "Mon compte"}
        sub="Votre accès au back-office."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <Section title="Identité">
          <form onSubmit={enregistrer} className="flex flex-col gap-3.5">
            <Field label="Nom">
              <Input value={nom} onChange={setNom} autoComplete="name" />
            </Field>

            <Field label="Téléphone">
              <Input
                type="tel"
                value={telephone}
                onChange={setTelephone}
                autoComplete="tel"
                placeholder="+221 77 000 00 00"
              />
            </Field>

            <div className="grid gap-3.5 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">
                  Adresse électronique
                </span>
                <p className="mt-1 text-[13.5px] font-bold">{moi?.email ?? "—"}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">
                  Rôle
                </span>
                <p className="mt-1 text-[13.5px] font-bold">{moi ? ROLES[moi.role] : "—"}</p>
              </div>
            </div>

            {messageIdentite && (
              <p
                className={`rounded-2xl px-4 py-3 text-[12.5px] font-semibold leading-relaxed ${
                  messageIdentite.ok ? "bg-[#e6f2ea] text-[#2e7d52]" : "bg-rose-soft text-rose-deep"
                }`}
              >
                {messageIdentite.texte}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" variant="rose" disabled={!modifie || enregistre}>
                {enregistre ? "Enregistrement…" : "Enregistrer"}
              </Button>
              {messageIdentite?.ok && !modifie && (
                <IconCheck className="h-4 w-4 text-[#2e7d52]" />
              )}
            </div>
          </form>
        </Section>

        <Section title="Mot de passe" sub="Il faut connaître l'actuel pour en poser un nouveau.">
          <form onSubmit={changerMotDePasse} className="flex flex-col gap-3.5">
            <Field label="Mot de passe actuel">
              <Input
                type="password"
                value={actuel}
                onChange={setActuel}
                autoComplete="current-password"
              />
            </Field>

            <Field
              label="Nouveau mot de passe"
              hint="Au moins huit caractères, et pas un mot courant."
            >
              <Input
                type="password"
                value={nouveau}
                onChange={setNouveau}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirmer le nouveau mot de passe">
              <Input
                type="password"
                value={confirmation}
                onChange={setConfirmation}
                autoComplete="new-password"
              />
            </Field>

            {messageMotDePasse && (
              <p
                className={`rounded-2xl px-4 py-3 text-[12.5px] font-semibold leading-relaxed ${
                  messageMotDePasse.ok
                    ? "bg-[#e6f2ea] text-[#2e7d52]"
                    : "bg-rose-soft text-rose-deep"
                }`}
              >
                {messageMotDePasse.texte}
              </p>
            )}

            <div>
              <Button type="submit" variant="rose" disabled={envoi}>
                <IconLockAdmin />
                {envoi ? "Enregistrement…" : "Modifier le mot de passe"}
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
