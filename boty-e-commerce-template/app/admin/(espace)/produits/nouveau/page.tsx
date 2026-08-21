"use client"

import { emptyProduct, ProductStudio } from "@/components/admin/product-studio"

export default function NouveauProduitPage() {
  return <ProductStudio mode="create" initial={emptyProduct()} />
}
