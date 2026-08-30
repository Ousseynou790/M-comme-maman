"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import type { AdminColor, SizeValue } from "@/lib/admin/types";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Section,
} from "@/components/admin/ui";
import { IconPlus, IconTrash, IconX } from "@/components/admin/icons";

/**
 * La bibliothèque : le vocabulaire commun des fiches.
 *
 * Tailles, coloris, matières et photothèque se règlent une fois ici et se
 * choisissent ensuite dans l'éditeur de fiche. C'est ce qui empêche « rose
 * poudré » et « Rose Poudre » de cohabiter dans le même catalogue.
 */
export default function Page() {
  const {
    library,
    products,
    saveSizes,
    setSizeGuide,
    saveColor,
    deleteColor,
    setMaterials,
    addMedia,
    removeMedia,
    hydrated,
  } = useAdmin();

  const [taille, setTaille] = useState("");
  const [repere, setRepere] = useState("");
  const [couleur, setCouleur] = useState({ name: "", hex: "#e0417f" });
  const [matiere, setMatiere] = useState("");
  const [media, setMedia] = useState({ src: "", name: "" });
  const [guide, setGuide] = useState(library.sizeGuide);

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture de la configuration…</p>;

  /* Combien de fiches se servent d'une valeur : on ne supprime pas à l'aveugle. */
  const fichesAvecTaille = (v: string) => products.filter((p) => p.sizes.includes(v)).length;
  const fichesAvecCouleur = (n: string) => products.filter((p) => p.colors.includes(n)).length;

  const ajouterTaille = () => {
    const v = taille.trim();
    if (!v || library.sizes.some((s) => s.value === v)) return;
    saveSizes([...library.sizes, { value: v, age: repere.trim() }]);
    setTaille("");
    setRepere("");
  };

  const retirerTaille = (v: string) => saveSizes(library.sizes.filter((s) => s.value !== v));

  const majRepere = (v: string, age: string) =>
    saveSizes(library.sizes.map((s: SizeValue) => (s.value === v ? { ...s, age } : s)));

  const ajouterCouleur = () => {
    const nom = couleur.name.trim();
    if (!nom) return;
    saveColor({ id: `col-${Date.now().toString(36)}`, name: nom, hex: couleur.hex } as AdminColor);
    setCouleur({ name: "", hex: "#e0417f" });
  };

  const ajouterMatiere = () => {
    const m = matiere.trim();
    if (!m || library.materials.includes(m)) return;
    setMaterials([...library.materials, m]);
    setMatiere("");
  };

  const ajouterMedia = () => {
    const src = media.src.trim();
    if (!src) return;
    addMedia([{ src, name: media.name.trim() || src.split("/").pop() || "visuel" }]);
    setMedia({ src: "", name: "" });
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Configuration"
        sub="Ce qui se règle une fois et se réutilise partout : tailles, coloris, matières, photothèque."
      />

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        {/* ---------------------------------------------------------- tailles */}
        <Section
          title="Tailles"
          sub="Une lettre ou un nombre, rien d'autre. Le repère d'âge est une aide au choix, pas une taille."
        >
          <div className="flex flex-wrap items-end gap-2.5">
            <Field label="Valeur" className="w-24">
              <Input value={taille} onChange={setTaille} placeholder="4" />
            </Field>
            <Field label="Repère (facultatif)" className="min-w-[140px] flex-1">
              <Input value={repere} onChange={setRepere} placeholder="4 ans" />
            </Field>
            <Button variant="ink" onClick={ajouterTaille} disabled={!taille.trim()}>
              <IconPlus />
              Ajouter
            </Button>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {library.sizes.map((s) => {
              const usages = fichesAvecTaille(s.value);
              return (
                <li key={s.value} className="flex items-center gap-2.5 rounded-xl bg-mist px-3 py-2">
                  <span className="w-12 shrink-0 text-[13.5px] font-extrabold">{s.value}</span>
                  <input
                    value={s.age}
                    onChange={(e) => majRepere(s.value, e.target.value)}
                    placeholder="repère…"
                    aria-label={`Repère de la taille ${s.value}`}
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[12.5px] outline-none transition-colors focus:border-line focus:bg-white"
                  />
                  <span className="shrink-0 text-[11.5px] text-muted">
                    {usages} fiche{usages > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => retirerTaille(s.value)}
                    disabled={usages > 0}
                    title={usages > 0 ? "Utilisée par des fiches" : "Retirer"}
                    aria-label={`Retirer la taille ${s.value}`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white hover:text-rose-deep disabled:opacity-25"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 border-t border-line pt-4">
            <Field label="Guide des tailles" hint="Adresse de l'image affichée sur la fiche produit.">
              <div className="flex gap-2.5">
                <Input value={guide} onChange={setGuide} placeholder="https://…" />
                <Button variant="ink" onClick={() => setSizeGuide(guide.trim())}>
                  Enregistrer
                </Button>
              </div>
            </Field>
          </div>
        </Section>

        {/* --------------------------------------------------------- coloris */}
        <Section title="Coloris" sub="Le nom commercial et sa pastille, réutilisés par toutes les fiches.">
          <div className="flex flex-wrap items-end gap-2.5">
            <Field label="Nom" className="min-w-[160px] flex-1">
              <Input
                value={couleur.name}
                onChange={(v) => setCouleur((c) => ({ ...c, name: v }))}
                placeholder="Rose poudré"
              />
            </Field>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold">Teinte</span>
              <input
                type="color"
                value={couleur.hex}
                onChange={(e) => setCouleur((c) => ({ ...c, hex: e.target.value }))}
                aria-label="Teinte du coloris"
                className="h-[42px] w-14 cursor-pointer rounded-xl border-[1.5px] border-[#ece3e7] bg-white p-1"
              />
            </label>
            <Button variant="ink" onClick={ajouterCouleur} disabled={!couleur.name.trim()}>
              <IconPlus />
              Ajouter
            </Button>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {library.colors.map((c) => {
              const usages = fichesAvecCouleur(c.name);
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-mist px-3 py-2">
                  <span
                    className="h-6 w-6 shrink-0 rounded-full"
                    style={{ background: c.hex, boxShadow: "0 0 0 1px #e5d9de" }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{c.name}</span>
                  <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{c.hex}</span>
                  <span className="shrink-0 text-[11.5px] text-muted">
                    {usages} fiche{usages > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteColor(c.id)}
                    disabled={usages > 0}
                    title={usages > 0 ? "Utilisé par des fiches" : "Retirer"}
                    aria-label={`Retirer le coloris ${c.name}`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white hover:text-rose-deep disabled:opacity-25"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* -------------------------------------------------------- matières */}
        <Section
          title="Matières"
          sub="Proposées en saisie rapide sous la description d'une fiche."
        >
          <div className="flex flex-wrap items-end gap-2.5">
            <Field label="Matière" className="min-w-[180px] flex-1">
              <Input value={matiere} onChange={setMatiere} placeholder="100 % coton peigné" />
            </Field>
            <Button variant="ink" onClick={ajouterMatiere} disabled={!matiere.trim()}>
              <IconPlus />
              Ajouter
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {library.materials.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-2 rounded-full bg-mist px-3.5 py-2 text-[12.5px] font-semibold"
              >
                {m}
                <button
                  type="button"
                  onClick={() => setMaterials(library.materials.filter((x) => x !== m))}
                  aria-label={`Retirer ${m}`}
                  className="text-muted transition-colors hover:text-rose-deep"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {library.materials.length === 0 && (
              <p className="text-[13px] text-muted">Aucune matière enregistrée.</p>
            )}
          </div>
        </Section>

        {/* ----------------------------------------------------- photothèque */}
        <Section
          title="Photothèque"
          sub="Les visuels partagés par les fiches et les rayons."
        >
          <div className="flex flex-wrap items-end gap-2.5">
            <Field label="Adresse de l'image" className="min-w-[200px] flex-1">
              <Input
                value={media.src}
                onChange={(v) => setMedia((m) => ({ ...m, src: v }))}
                placeholder="https://…"
              />
            </Field>
            <Field label="Nom" className="min-w-[120px]">
              <Input
                value={media.name}
                onChange={(v) => setMedia((m) => ({ ...m, name: v }))}
                placeholder="robe-plumetis"
              />
            </Field>
            <Button variant="ink" onClick={ajouterMedia} disabled={!media.src.trim()}>
              <IconPlus />
              Ajouter
            </Button>
          </div>

          {library.media.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">La photothèque est vide.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {library.media.map((m) => (
                <div
                  key={m.id}
                  className="group relative aspect-3/4 overflow-hidden rounded-xl bg-stone bg-cover bg-center"
                  style={{ backgroundImage: `url(${m.src})` }}
                >
                  <button
                    type="button"
                    onClick={() => removeMedia(m.id)}
                    aria-label={`Retirer ${m.name}`}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-2 py-1 text-[10px] font-semibold text-white">
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
