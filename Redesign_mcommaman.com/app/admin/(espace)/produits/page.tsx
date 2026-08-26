"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXOF } from "@/lib/format";
import { useAdmin } from "@/lib/admin/store";
import type { AdminProduct, ProductStatus } from "@/lib/admin/types";
import {
  Button,
  DeleteButton,
  Note,
  PageHeader,
  Pills,
  ProductChip,
  SearchField,
  Table,
} from "@/components/admin/ui";
import { IconEye, IconPencil, IconPlus, IconRefresh } from "@/components/admin/icons";

type Filtre = ProductStatus | "tous" | "rupture";

const FILTRES: { value: Filtre; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "publie", label: "Publiés" },
  { value: "brouillon", label: "Brouillons" },
  { value: "rupture", label: "Ruptures" },
  { value: "archive", label: "Archivés" },
];

export default function Page() {
  const router = useRouter();
  const { products, setStock, setProductStatus, duplicateProduct, deleteProduct, hydrated } =
    useAdmin();
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [recherche, setRecherche] = useState("");

  const compte = (f: Filtre) => {
    if (f === "tous") return products.length;
    if (f === "rupture") return products.filter((p) => p.status === "publie" && p.stock <= 0).length;
    return products.filter((p) => p.status === f).length;
  };

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return products
      .filter((p) => {
        if (filtre === "tous") return true;
        if (filtre === "rupture") return p.status === "publie" && p.stock <= 0;
        return p.status === filtre;
      })
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [products, filtre, recherche]);

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture du catalogue…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Produits"
        sub="Toute fiche naît en brouillon. Un brouillon n'apparaît jamais en boutique, et une fiche publiée sans stock se signale d'elle-même."
      >
        <Link href="/admin/produits/nouveau">
          <Button variant="rose">
            <IconPlus />
            Nouveau produit
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchField
          value={recherche}
          onChange={setRecherche}
          placeholder="Nom, référence ou rayon…"
        />
        <Pills
          value={filtre}
          onChange={setFiltre}
          options={FILTRES.map((f) => ({ ...f, count: compte(f.value) }))}
        />
      </div>

      <Table
        cols="2fr .9fr .8fr .7fr .9fr 1.1fr"
        head={["Produit", "Référence", "Prix", "Stock", "Statut", ""]}
        rows={liste}
        keyOf={(p) => p.id}
        pageSize={15}
        unite="fiches"
        empty={
          recherche || filtre !== "tous"
            ? "Aucune fiche ne correspond à ce filtre."
            : "Le catalogue est vide."
        }
        cells={(p: AdminProduct) => [
          <span key="n" className="flex min-w-0 items-center gap-3">
            <span
              className="h-11 w-9 shrink-0 rounded-lg bg-stone bg-cover bg-center"
              style={{ backgroundImage: `url(${p.image})` }}
            />
            <span className="min-w-0">
              <Link
                href={`/admin/produits/${p.id}`}
                className="line-clamp-1 font-bold transition-colors hover:text-rose"
              >
                {p.name}
              </Link>
              <span className="mt-0.5 block text-[11.5px] text-muted">
                {p.category} · {p.age} ans
              </span>
            </span>
          </span>,

          <span key="s" className="text-[12.5px] tabular-nums text-muted">
            {p.sku}
          </span>,

          <span key="p" className="font-extrabold tabular-nums">
            {formatXOF(p.price)}
          </span>,

          /* Le stock se corrige sans ouvrir la fiche : c'est le geste le plus
             fréquent du back-office. */
          <input
            key="stock"
            type="number"
            min={0}
            value={p.stock}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setStock(p.id, Math.max(0, Number(e.target.value) || 0))}
            aria-label={`Stock de ${p.name}`}
            className="w-16 rounded-lg border-[1.5px] border-[#ece3e7] bg-white px-2 py-1.5 text-[13px] tabular-nums outline-none transition-colors focus:border-rose"
          />,

          <ProductChip key="st" status={p.status} stock={p.stock} />,

          <span key="a" className="flex flex-wrap items-center justify-end gap-1">
            {p.status === "publie" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductStatus(p.id, "brouillon");
                }}
              >
                Dépublier
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductStatus(p.id, "publie");
                }}
              >
                <IconEye />
                Publier
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                duplicateProduct(p.id);
              }}
              title="Dupliquer en brouillon"
            >
              <IconRefresh />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/produits/${p.id}`);
              }}
              title="Modifier"
            >
              <IconPencil />
            </Button>
            <DeleteButton onConfirm={() => deleteProduct(p.id)} label="" />
          </span>,
        ]}
      />

      <div className="mt-4">
        <Note>
          Le catalogue de la vitrine (<code>lib/products.ts</code>) reste un tableau statique : ce
          que l&apos;on modifie ici ne s&apos;y reporte pas encore. Les deux se rejoindront quand
          les fiches viendront de la base.
        </Note>
      </div>
    </>
  );
}
