"use client";

import { useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { slugify } from "@/lib/admin/seed";
import type { AdminCategory } from "@/lib/admin/types";
import {
  Button,
  DeleteButton,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchField,
  Section,
  Textarea,
  Toggle,
} from "@/components/admin/ui";
import { IconCheck, IconPlus, IconTrash } from "@/components/admin/icons";

/**
 * Les rayons de la boutique, sur deux niveaux.
 *
 * Deux formulaires, parce que ce sont deux gestes différents. Celui d'une
 * catégorie ne parle jamais de parente : une catégorie n'en a pas, la question
 * n'a pas lieu d'être. Celui d'une sous-catégorie demande à quelles catégories
 * la rattacher — au pluriel, « Chaussures » ayant sa place sous « Enfants »
 * comme sous « Coin Maman ».
 */

type Genre = "categorie" | "sous-categorie";

const vide = (parentSlugs: string[] = []): AdminCategory => ({
  id: `cat-${Date.now().toString(36)}`,
  slug: "",
  label: "",
  description: "",
  image: "",
  parentSlugs,
  parentNoms: [],
  univers: "enfant",
  active: true,
  order: 99,
});

export default function Page() {
  const { categories, products, saveCategory, deleteCategory, hydrated } = useAdmin();
  const [edite, setEdite] = useState<{ rayon: AdminCategory; genre: Genre } | null>(null);
  /* La catégorie dont on choisit les sous-catégories, s'il y en a une d'ouverte. */
  const [rattache, setRattache] = useState<AdminCategory | null>(null);

  const compte = (slug: string) => products.filter((p) => slugify(p.category) === slug).length;

  const racines = categories
    .filter((c) => c.parentSlugs.length === 0)
    .sort((a, b) => a.order - b.order);

  const enfantsDe = (slug: string) =>
    categories.filter((c) => c.parentSlugs.includes(slug)).sort((a, b) => a.order - b.order);

  const sousCategories = categories.filter((c) => c.parentSlugs.length > 0);

  /* Le serveur refuse de supprimer un rayon qui porte encore des fiches ou des
     sous-catégories : les fiches deviendraient orphelines. On le sait avant de
     cliquer, autant le dire au lieu de laisser l'appel échouer. */
  const empeche = (c: AdminCategory) => {
    const fiches = compte(c.slug);
    const enfants = enfantsDe(c.slug).length;
    if (fiches > 0 && enfants > 0) {
      return `Contient ${fiches} fiche${fiches > 1 ? "s" : ""} et ${enfants} sous-catégorie${
        enfants > 1 ? "s" : ""
      } : déplacez-les d'abord.`;
    }
    if (fiches > 0) {
      return `Contient ${fiches} fiche${fiches > 1 ? "s" : ""} : déplacez-les dans un autre rayon d'abord.`;
    }
    if (enfants > 0) {
      return `Contient ${enfants} sous-catégorie${enfants > 1 ? "s" : ""} : supprimez-les d'abord.`;
    }
    return undefined;
  };

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture des catégories…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Catégories"
        sub="Les catégories forment le menu de la boutique. Les sous-catégories se rangent à l'intérieur, et peuvent appartenir à plusieurs d'entre elles."
      >
        <Button variant="contour" onClick={() => setEdite({ rayon: vide(), genre: "categorie" })}>
          <IconPlus />
          Nouvelle catégorie
        </Button>
        <Button
          variant="rose"
          disabled={racines.length === 0}
          title={
            racines.length === 0
              ? "Créez d'abord une catégorie : une sous-catégorie se range à l'intérieur d'une autre."
              : undefined
          }
          onClick={() => setEdite({ rayon: vide([]), genre: "sous-categorie" })}
        >
          <IconPlus />
          Nouvelle sous-catégorie
        </Button>
      </PageHeader>

      {racines.length === 0 ? (
        <EmptyState
          title="Aucune catégorie pour le moment"
          hint="Commencez par une catégorie — « Enfants », « Coin maman » — puis rangez des sous-catégories à l'intérieur."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {racines.map((racine) => {
            const enfants = enfantsDe(racine.slug);
            return (
              <Section key={racine.id} className={racine.active ? "" : "opacity-60"}>
                <div className="flex flex-wrap items-start gap-3.5">
                  <span
                    className="h-16 w-14 shrink-0 rounded-xl bg-stone bg-cover bg-center"
                    style={racine.image ? { backgroundImage: `url(${racine.image})` } : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-extrabold tracking-tight">{racine.label}</h2>
                      {!racine.active && (
                        <span className="rounded-full bg-stone px-2 py-0.5 text-[10.5px] font-bold text-muted">
                          Masquée
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      /{racine.slug} · {compte(racine.slug)} fiche
                      {compte(racine.slug) > 1 ? "s" : ""} · {enfants.length} sous-catégorie
                      {enfants.length > 1 ? "s" : ""}
                    </p>
                    {racine.description && (
                      <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                        {racine.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRattache(racine)}
                      title={`Choisir les sous-catégories de « ${racine.label} »`}
                    >
                      <IconPlus />
                      Sous-catégorie
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEdite({ rayon: racine, genre: "categorie" })}
                    >
                      Modifier
                    </Button>
                    <DeleteButton
                      onConfirm={() => deleteCategory(racine.id)}
                      empeche={empeche(racine)}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-line pt-3.5">
                  {enfants.length === 0 ? (
                    <p className="text-[12.5px] text-muted">
                      Aucune sous-catégorie. Le bouton ci-dessus en ajoute une dans ce rayon.
                    </p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-[#f4edf0]">
                      {enfants.map((enfant) => {
                        /* Une sous-catégorie rangée ailleurs aussi : on le dit,
                           sinon la modifier ici semblerait sans conséquence. */
                        const ailleurs = enfant.parentNoms.filter((n) => n !== racine.label);
                        return (
                          <li
                            key={enfant.id}
                            className={`flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${
                              enfant.active ? "" : "opacity-60"
                            }`}
                          >
                            <span
                              className="h-9 w-8 shrink-0 rounded-lg bg-stone bg-cover bg-center"
                              style={
                                enfant.image
                                  ? { backgroundImage: `url(${enfant.image})` }
                                  : undefined
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-[13.5px] font-bold">{enfant.label}</span>
                                {ailleurs.length > 0 && (
                                  <span className="rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold text-rose-deep">
                                    aussi dans {ailleurs.join(", ")}
                                  </span>
                                )}
                                {!enfant.active && (
                                  <span className="rounded-full bg-stone px-2 py-0.5 text-[10px] font-bold text-muted">
                                    Masquée
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-[11.5px] text-muted">
                                /{enfant.slug} · {compte(enfant.slug)} fiche
                                {compte(enfant.slug) > 1 ? "s" : ""}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setEdite({ rayon: enfant, genre: "sous-categorie" })
                                }
                              >
                                Modifier
                              </Button>
                              <DeleteButton
                                onConfirm={() => deleteCategory(enfant.id)}
                                empeche={empeche(enfant)}
                                label=""
                              />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Section>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[12.5px] text-muted">
        {racines.length} catégorie{racines.length > 1 ? "s" : ""} · {sousCategories.length}{" "}
        sous-catégorie{sousCategories.length > 1 ? "s" : ""}
      </p>

      {rattache && (
        <ChoixSousCategories
          key={rattache.id}
          categorie={rattache}
          rayons={categories}
          compte={compte}
          onClose={() => setRattache(null)}
          onEnregistrer={(modifiees) => {
            modifiees.forEach(saveCategory);
            setRattache(null);
          }}
          onCreer={() => {
            setRattache(null);
            setEdite({ rayon: vide([rattache.slug]), genre: "sous-categorie" });
          }}
        />
      )}

      {/* La clé remonte le formulaire à chaque rayon ouvert : pas d'état
          dérivé à recaler à la main. */}
      {edite && (
        <EditeurRayon
          key={edite.rayon.id}
          rayon={edite.rayon}
          genre={edite.genre}
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

/* ---------------------------------------------------- choix des rattachements */

/**
 * Les sous-catégories d'une catégorie, cochées ou non.
 *
 * On ne crée rien ici : on range. « Tee-shirts » existe déjà sous « Filles »,
 * il doit pouvoir servir aussi à « Garçons » sans être ressaisi — c'est tout
 * l'intérêt d'une appartenance multiple.
 *
 * Ne sont proposées que les catégories sans sous-catégories : en ranger une qui
 * en contient ferait de ses enfants un troisième niveau, que le serveur refuse.
 */
function ChoixSousCategories({
  categorie,
  rayons,
  compte,
  onClose,
  onEnregistrer,
  onCreer,
}: {
  categorie: AdminCategory;
  rayons: AdminCategory[];
  compte: (slug: string) => number;
  onClose: () => void;
  onEnregistrer: (modifiees: AdminCategory[]) => void;
  onCreer: () => void;
}) {
  const aDesEnfants = (slug: string) => rayons.some((r) => r.parentSlugs.includes(slug));

  const proposables = rayons
    .filter((r) => r.slug && r.slug !== categorie.slug && !aDesEnfants(r.slug))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const [choisies, setChoisies] = useState<string[]>(
    proposables.filter((r) => r.parentSlugs.includes(categorie.slug)).map((r) => r.slug),
  );
  const [recherche, setRecherche] = useState("");

  const visibles = proposables.filter((r) =>
    r.label.toLowerCase().includes(recherche.trim().toLowerCase()),
  );

  const basculer = (slug: string) =>
    setChoisies((courant) =>
      courant.includes(slug) ? courant.filter((s) => s !== slug) : [...courant, slug],
    );

  const enregistrer = () => {
    /* On ne renvoie que ce qui a bougé : réécrire les autres ferait autant
       d'appels inutiles, et chacun peut échouer. */
    const modifiees = proposables
      .filter((r) => r.parentSlugs.includes(categorie.slug) !== choisies.includes(r.slug))
      .map((r) => ({
        ...r,
        parentSlugs: choisies.includes(r.slug)
          ? [...r.parentSlugs, categorie.slug]
          : r.parentSlugs.filter((s) => s !== categorie.slug),
      }));
    onEnregistrer(modifiees);
  };

  const change = proposables.some(
    (r) => r.parentSlugs.includes(categorie.slug) !== choisies.includes(r.slug),
  );

  return (
    <Modal open onClose={onClose} title={`Sous-catégories de « ${categorie.label} »`}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-relaxed text-muted">
          Cochez celles qui appartiennent à cette catégorie. Une même sous-catégorie peut se ranger
          dans plusieurs — des tee-shirts vont aussi bien chez les filles que chez les garçons.
        </p>

        {proposables.length > 6 && (
          <SearchField value={recherche} onChange={setRecherche} placeholder="Chercher…" />
        )}

        {proposables.length === 0 ? (
          <p className="rounded-2xl bg-mist px-4 py-3.5 text-[12.5px] leading-relaxed text-muted">
            Aucune sous-catégorie n&apos;existe encore. Créez-en une, elle sera ensuite proposée
            ici pour toutes les autres catégories.
          </p>
        ) : (
          <ul className="flex max-h-[46vh] flex-col divide-y divide-[#f4edf0] overflow-auto">
            {visibles.map((r) => {
              const on = choisies.includes(r.slug);
              const ailleurs = r.parentNoms.filter((n) => n !== categorie.label);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => basculer(r.slug)}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] transition-colors ${
                        on ? "border-rose bg-rose text-white" : "border-[#e5d9de] bg-white"
                      }`}
                    >
                      {on && <IconCheck className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold">{r.label}</span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">
                        /{r.slug} · {compte(r.slug)} fiche{compte(r.slug) > 1 ? "s" : ""}
                        {ailleurs.length > 0 && ` · aussi dans ${ailleurs.join(", ")}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {visibles.length === 0 && (
              <li className="py-4 text-center text-[12.5px] text-muted">
                Rien ne correspond à cette recherche.
              </li>
            )}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line pt-4">
          <Button variant="contour" onClick={onCreer}>
            <IconPlus />
            Créer une sous-catégorie
          </Button>
          <span className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="rose" disabled={!change} onClick={enregistrer}>
              Enregistrer
            </Button>
          </span>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ éditeur */

function EditeurRayon({
  rayon,
  genre,
  rayons,
  onClose,
  onSave,
}: {
  rayon: AdminCategory;
  genre: Genre;
  rayons: AdminCategory[];
  onClose: () => void;
  onSave: (c: AdminCategory) => void;
}) {
  const { televerserMedia } = useAdmin();
  const [brouillon, setBrouillon] = useState<AdminCategory>(rayon);
  const [envoiImage, setEnvoiImage] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  const maj = (patch: Partial<AdminCategory>) => setBrouillon({ ...brouillon, ...patch });

  const nouveau = !rayon.slug;
  const sousCategorie = genre === "sous-categorie";

  const parentesPossibles = rayons.filter(
    (r) => r.parentSlugs.length === 0 && r.slug && r.slug !== brouillon.slug,
  );

  const valide =
    brouillon.label.trim().length >= 3 &&
    (!sousCategorie || brouillon.parentSlugs.length > 0);

  const basculer = (slug: string) =>
    maj({
      parentSlugs: brouillon.parentSlugs.includes(slug)
        ? brouillon.parentSlugs.filter((s) => s !== slug)
        : [...brouillon.parentSlugs, slug],
    });

  const choisirFichier = async (fichier: File | undefined) => {
    if (!fichier) return;
    setEnvoiImage(true);
    const media = await televerserMedia(fichier, brouillon.label || fichier.name);
    setEnvoiImage(false);
    if (media) maj({ image: media.src });
    if (fichierRef.current) fichierRef.current.value = "";
  };

  const titre = nouveau
    ? sousCategorie
      ? "Nouvelle sous-catégorie"
      : "Nouvelle catégorie"
    : sousCategorie
      ? `Sous-catégorie · ${rayon.label}`
      : `Catégorie · ${rayon.label}`;

  return (
    <Modal open onClose={onClose} title={titre}>
      <div className="flex flex-col gap-4">
        <Field
          label="Libellé"
          hint={brouillon.label ? `Adresse : /boutique?cat=${slugify(brouillon.label)}` : undefined}
        >
          <Input
            value={brouillon.label}
            onChange={(v) => maj({ label: v, slug: slugify(v) })}
            placeholder={sousCategorie ? "Robes & jupes" : "Enfants"}
          />
        </Field>

        {/* Le seul endroit où la question du rattachement se pose. Une
            catégorie n'a pas de parente : son formulaire n'en parle pas. */}
        {sousCategorie && (
          <div>
            <span className="mb-2 block text-[12px] font-bold">
              Ranger dans{" "}
              <span className="font-medium text-muted">
                — plusieurs choix possibles
              </span>
            </span>
            {parentesPossibles.length === 0 ? (
              <p className="rounded-2xl bg-mist px-4 py-3 text-[12.5px] leading-relaxed text-muted">
                Aucune catégorie où la ranger. Créez-en une d&apos;abord.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {parentesPossibles.map((r) => {
                  const on = brouillon.parentSlugs.includes(r.slug);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => basculer(r.slug)}
                      className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                        on ? "bg-ink text-white" : "border border-line bg-white text-muted"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
              {brouillon.parentSlugs.length === 0
                ? "Choisissez-en au moins une."
                : brouillon.parentSlugs.length === 1
                  ? "Elle apparaîtra dans cette catégorie."
                  : `Elle apparaîtra dans ces ${brouillon.parentSlugs.length} catégories.`}
            </p>
          </div>
        )}

        <Field label="Description" hint="Une phrase, affichée en tête du rayon.">
          <Textarea
            value={brouillon.description}
            onChange={(v) => maj({ description: v })}
            rows={3}
            placeholder="Des coupes qui laissent courir, du 2 au 12 ans."
          />
        </Field>

        {/* ------------------------------------------------------- visuel */}
        <div>
          <span className="mb-2 block text-[12px] font-bold">Visuel</span>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-20 w-16 shrink-0 rounded-xl bg-stone bg-cover bg-center"
              style={brouillon.image ? { backgroundImage: `url(${brouillon.image})` } : undefined}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fichierRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => choisirFichier(e.target.files?.[0])}
              />
              <Button
                variant="contour"
                size="sm"
                disabled={envoiImage}
                onClick={() => fichierRef.current?.click()}
              >
                {envoiImage ? "Envoi…" : brouillon.image ? "Changer l'image" : "Importer une image"}
              </Button>
              {brouillon.image && (
                <Button variant="ghost" size="sm" onClick={() => maj({ image: "" })}>
                  <IconTrash />
                  Retirer
                </Button>
              )}
            </div>
          </div>

          <Input
            className="mt-2.5"
            value={brouillon.image}
            onChange={(v) => maj({ image: v })}
            placeholder="…ou collez l'adresse d'une image déjà en ligne"
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            L&apos;image envoyée rejoint la photothèque et reste disponible pour les fiches.
          </p>
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
