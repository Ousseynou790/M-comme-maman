"use client";

import { use } from "react";
import Link from "next/link";
import { useAdmin } from "@/lib/admin/store";
import { ProductForm } from "@/components/product-form";
import { Button, EmptyState } from "@/components/admin/ui";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products, hydrated } = useAdmin();
  const fiche = products.find((p) => p.id === id);

  /* Avant l'hydratation, la graine est déjà là : une fiche introuvable à ce
     moment-là l'est vraiment. On attend quand même la relecture du stockage,
     sinon une fiche créée dans une session précédente s'annoncerait absente. */
  if (!hydrated) return <p className="text-[13px] text-muted">Ouverture de la fiche…</p>;

  if (!fiche) {
    return (
      <EmptyState
        title="Fiche introuvable"
        hint="Elle a peut-être été supprimée depuis un autre onglet."
        action={
          <Link href="/admin/produits">
            <Button variant="rose">Retour aux produits</Button>
          </Link>
        }
      />
    );
  }

  return <ProductForm key={fiche.id} product={fiche} />;
}
