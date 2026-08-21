"use client"

import { use } from "react"
import Link from "next/link"
import { ProductStudio } from "@/components/admin/product-studio"
import { ActionButton, EmptyState } from "@/components/admin/ui"
import { useAdmin } from "@/lib/admin/store"

export default function EditerProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { products, hydrated } = useAdmin()
  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <EmptyState
        title={hydrated ? "Produit introuvable" : "Chargement…"}
        description={
          hydrated
            ? "Cette fiche a peut-être été supprimée ou renommée."
            : "Récupération de la fiche depuis le stockage local."
        }
        action={
          <Link href="/admin/produits">
            <ActionButton variant="primary">Retour au catalogue</ActionButton>
          </Link>
        }
      />
    )
  }

  return <ProductStudio key={product.id} mode="edit" initial={product} />
}
