"use client";

import { useRef, useState } from "react";
import { formatXOF } from "@/lib/format";
import { useAdmin } from "@/lib/admin/store";
import type { HeroSlideConfig } from "@/lib/admin/types";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Section,
  Textarea,
  Toggle,
} from "@/components/admin/ui";
import { IconImage, IconPlus, IconTrash } from "@/components/admin/icons";

const slideVide = (): HeroSlideConfig => ({
  src: "",
  alt: "",
  pos: "50% 30%",
  tag: "",
  piece: "",
});

export default function Page() {
  const { settings, hero, updateSettings, updateHero, televerserMedia, hydrated } = useAdmin();

  /* Un seul champ de fichier pour toutes les photos de l'arche : celle qu'on
     remplace est retenue le temps de l'aller-retour. */
  const fichierRef = useRef<HTMLInputElement>(null);
  const cible = useRef(0);
  const [envoi, setEnvoi] = useState<number | null>(null);

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture des réglages…</p>;

  const majSlide = (i: number, patch: Partial<HeroSlideConfig>) =>
    updateHero({
      ...hero,
      slides: hero.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });

  const importerSlide = async (fichiers: FileList | null) => {
    const fichier = fichiers?.[0];
    if (!fichier) return;
    const i = cible.current;
    setEnvoi(i);
    const media = await televerserMedia(fichier, `accueil-${i + 1}`);
    setEnvoi(null);
    if (fichierRef.current) fichierRef.current.value = "";
    if (media) majSlide(i, { src: media.src });
  };

  const choisirPhoto = (i: number) => {
    cible.current = i;
    fichierRef.current?.click();
  };

  const nombre = (v: string) => Number(v.replace(/\D/g, "")) || 0;

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Réglages"
        sub="L'identité de la boutique, les frais de livraison, le bandeau et les photos d'accueil."
      />

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        {/* -------------------------------------------------------- identité */}
        <Section title="Identité" sub="Ce qui s'affiche en tête de la vitrine et dans les e-mails.">
          <div className="flex flex-col gap-4">
            <Field label="Nom de la boutique">
              <Input
                value={settings.storeName}
                onChange={(v) => updateSettings({ storeName: v })}
              />
            </Field>
            <Field label="Signature" hint="La phrase qui suit le nom.">
              <Input value={settings.tagline} onChange={(v) => updateSettings({ tagline: v })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Adresse e-mail de contact">
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(v) => updateSettings({ contactEmail: v })}
                />
              </Field>
              <Field label="Téléphone">
                <Input value={settings.phone} onChange={(v) => updateSettings({ phone: v })} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------- livraison */}
        <Section
          title="Livraison et stock"
          sub="Les mêmes montants que ceux affichés dans le tunnel de commande."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Livraison offerte à partir de"
              hint={`Aujourd'hui : ${formatXOF(settings.freeShippingThreshold)}`}
            >
              <Input
                value={String(settings.freeShippingThreshold)}
                onChange={(v) => updateSettings({ freeShippingThreshold: nombre(v) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Seuil de stock faible" hint="En dessous, le produit remonte au tableau de bord.">
              <Input
                value={String(settings.lowStockThreshold)}
                onChange={(v) => updateSettings({ lowStockThreshold: nombre(v) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Frais — Dakar">
              <Input
                value={String(settings.shippingDakar)}
                onChange={(v) => updateSettings({ shippingDakar: nombre(v) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Frais — régions">
              <Input
                value={String(settings.shippingRegions)}
                onChange={(v) => updateSettings({ shippingRegions: nombre(v) })}
                inputMode="numeric"
              />
            </Field>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <Toggle
              checked={settings.acceptOrders}
              onChange={(v) => updateSettings({ acceptOrders: v })}
              label="La boutique accepte les commandes"
              hint="Décoché, le tunnel se ferme — à utiliser pendant un inventaire ou un congé."
            />
          </div>
        </Section>

        {/* ---------------------------------------------------------- bandeau */}
        <Section title="Bandeau d'annonce" sub="La bande qui court en haut de la vitrine.">
          <Toggle
            checked={settings.showPromoBanner}
            onChange={(v) => updateSettings({ showPromoBanner: v })}
            label="Afficher le bandeau"
          />
          <div className="mt-4">
            <Field label="Texte" hint="Court : il défile, il ne se lit pas deux fois.">
              <Textarea
                value={settings.promoBannerText}
                onChange={(v) => updateSettings({ promoBannerText: v })}
                rows={2}
              />
            </Field>
          </div>
          {settings.showPromoBanner && settings.promoBannerText && (
            <p className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-center text-[12.5px] font-semibold text-white">
              {settings.promoBannerText}
            </p>
          )}
        </Section>

      </div>

      {/* -------------------------------------------------- bandeau d'accueil */}
      <div className="mt-4">
        <Section
          title="Photos d'accueil"
          sub="Les images de l'arche en haut de la page d'accueil. Le cadrage impose un sujet centré : le point de mise au point rattrape le reste."
          action={
            <Button
              size="sm"
              variant="contour"
              onClick={() => updateHero({ ...hero, slides: [...hero.slides, slideVide()] })}
            >
              <IconPlus />
              Ajouter une photo
            </Button>
          }
        >
          <Toggle
            checked={hero.custom}
            onChange={(v) => updateHero({ ...hero, custom: v })}
            label="Utiliser ces photos"
            hint="Décoché, les trois photos livrées avec le site restent en place."
          />

          {/* Le champ natif reste caché : les boutons en tiennent lieu. */}
          <input
            ref={fichierRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void importerSlide(e.target.files)}
          />

          {hero.slides.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">Aucune photo enregistrée.</p>
          ) : (
            <div className={`mt-5 grid gap-4 lg:grid-cols-3 ${hero.custom ? "" : "opacity-60"}`}>
              {hero.slides.map((s, i) => (
                <div key={i} className="rounded-2xl border border-line p-4">
                  <div
                    className="mb-3.5 aspect-4/5 rounded-xl bg-stone bg-cover"
                    style={
                      s.src
                        ? { backgroundImage: `url(${s.src})`, backgroundPosition: s.pos }
                        : undefined
                    }
                  />
                  <div className="flex flex-col gap-3">
                    <Button
                      size="sm"
                      variant="contour"
                      disabled={envoi !== null}
                      onClick={() => choisirPhoto(i)}
                    >
                      <IconImage />
                      {envoi === i ? "Envoi…" : s.src ? "Changer la photo" : "Importer une photo"}
                    </Button>
                    <Field label="Texte de remplacement" hint="Ce que lit une liseuse d'écran.">
                      <Input value={s.alt} onChange={(v) => majSlide(i, { alt: v })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Cadrage" hint="ex. 50% 30%">
                        <Input value={s.pos} onChange={(v) => majSlide(i, { pos: v })} />
                      </Field>
                      <Field label="Étiquette">
                        <Input value={s.tag} onChange={(v) => majSlide(i, { tag: v })} />
                      </Field>
                    </div>
                    <Field label="Pièce proposée" hint="L'article montré sous la photo.">
                      <Input value={s.piece} onChange={(v) => majSlide(i, { piece: v })} />
                    </Field>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateHero({ ...hero, slides: hero.slides.filter((_, j) => j !== i) })
                      }
                    >
                      <IconTrash />
                      Retirer cette photo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
