"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { slugify } from "@/lib/admin/seed";
import type { AdminCategory } from "@/lib/admin/types";
import {
  Button,
  DeleteButton,
  Field,
  Input,
  Modal,
  Note,
  PageHeader,
  Pagination,
  Section,
  Textarea,
  Toggle,
  usePagination,
} from "@/components/admin/ui";
import { IconPlus } from "@/components/admin/icons";

const vide = (): AdminCategory => ({
  id: `cat-${Date.now().toString(36)}`,
  slug: "",
  label: "",
  description: "",
  image: "",
  links: [],
  active: true,
  order: 99,
});

export default function Page() {
  const { categories, products, saveCategory, deleteCategory, hydrated } = useAdmin();
  const [edite, setEdite] = useState<AdminCategory | null>(null);

  const compte = (slug: string) =>
    products.filter((p) => slugify(p.category) === slug).length;

  const ordonnes = [...categories].sort((a, b) => a.order - b.order);
  const { page, pages, setPage, tranche, debut, total } = usePagination(
    ordonnes,
    9,
    (c) => c.id
  );

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture des catégories…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Catégories"
        sub="Les rayons de la boutique et leurs renvois. Une catégorie désactivée disparaît de la navigation sans que ses fiches soient touchées."
      >
        <Button variant="rose" onClick={() => setEdite(vide())}>
          <IconPlus />
          Nouvelle catégorie
        </Button>
      </PageHeader>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {tranche.map((c) => (
          <Section key={c.id} className={c.active ? "" : "opacity-60"}>
            <div className="flex items-start gap-3.5">
              <span
                className="h-16 w-14 shrink-0 rounded-xl bg-stone bg-cover bg-center"
                style={c.image ? { backgroundImage: `url(${c.image})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[14.5px] font-extrabold tracking-tight">{c.label}</h2>
                  {!c.active && (
                    <span className="shrink-0 rounded-full bg-stone px-2 py-0.5 text-[10.5px] font-bold text-muted">
                      Masqué
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  /{c.slug} · {compte(c.slug)} fiche{compte(c.slug) > 1 ? "s" : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                  {c.description || "Sans description."}
                </p>
              </div>
            </div>

            {c.links.length > 0 && (
              <p className="mt-3.5 flex flex-wrap gap-1.5">
                {c.links.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted"
                  >
                    {categories.find((x) => x.slug === s)?.label ?? s}
                  </span>
                ))}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
              <Button size="sm" variant="ghost" onClick={() => setEdite(c)}>
                Modifier
              </Button>
              <DeleteButton onConfirm={() => deleteCategory(c.id)} />
            </div>
          </Section>
        ))}
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        debut={debut}
        affiches={tranche.length}
        onPage={setPage}
        unite="catégories"
      />

      <div className="mt-4">
        <Note>
          Le renvoi entre rayons est symétrique : lier « Chaussures » à « Robes & jupes » ajoute
          aussi le retour dans l&apos;autre sens. C&apos;est le magasin qui s&apos;en charge, pas ce
          formulaire.
        </Note>
      </div>

      {/* La clé remonte le formulaire à chaque rayon ouvert : pas d'état
          dérivé à recaler à la main. */}
      {edite && (
        <EditeurRayon
          key={edite.id}
          rayon={edite}
          rayons={categories}
          onClose={() => setEdite(null)}
          onSave={(c) => {
            saveCategory(c);
            setEdite(null);
          }}
        />
      )}
    </>
  );
}

function EditeurRayon({
  rayon,
  rayons,
  onClose,
  onSave,
}: {
  rayon: AdminCategory;
  rayons: AdminCategory[];
  onClose: () => void;
  onSave: (c: AdminCategory) => void;
}) {
  const [brouillon, setBrouillon] = useState<AdminCategory>(rayon);

  const maj = (patch: Partial<AdminCategory>) => setBrouillon({ ...brouillon, ...patch });
  const valide = brouillon.label.trim().length >= 3;

  return (
    <Modal open onClose={onClose} title={rayon.label || "Nouvelle catégorie"}>
      <div className="flex flex-col gap-4">
        <Field
          label="Libellé"
          hint={brouillon.label ? `Adresse : /boutique?cat=${slugify(brouillon.label)}` : undefined}
        >
          <Input
            value={brouillon.label}
            onChange={(v) => maj({ label: v, slug: slugify(v) })}
            placeholder="Robes & jupes"
          />
        </Field>

        <Field label="Description" hint="Une phrase, affichée en tête du rayon.">
          <Textarea
            value={brouillon.description}
            onChange={(v) => maj({ description: v })}
            rows={3}
            placeholder="Des coupes qui laissent courir, du 2 au 12 ans."
          />
        </Field>

        <Field label="Visuel" hint="Adresse d'une image. Facultatif.">
          <Input value={brouillon.image} onChange={(v) => maj({ image: v })} placeholder="https://…" />
        </Field>

        <div>
          <span className="mb-2 block text-[12px] font-bold">Rayons liés</span>
          <div className="flex flex-wrap gap-1.5">
            {rayons
              .filter((r) => r.slug && r.slug !== brouillon.slug)
              .map((r) => {
                const on = brouillon.links.includes(r.slug);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      maj({
                        links: on
                          ? brouillon.links.filter((s) => s !== r.slug)
                          : [...brouillon.links, r.slug],
                      })
                    }
                    className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                      on ? "bg-ink text-white" : "border border-line bg-white text-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
          </div>
        </div>

        <Toggle
          checked={brouillon.active}
          onChange={(v) => maj({ active: v })}
          label="Visible en boutique"
          hint="Masqué, le rayon sort de la navigation ; ses fiches restent publiées."
        />

        <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="rose" disabled={!valide} onClick={() => onSave(brouillon)}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
