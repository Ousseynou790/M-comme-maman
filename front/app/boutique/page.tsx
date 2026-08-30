import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Catalogue } from "@/components/catalogue";
import { lireCatalogue, lireRayons } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Tout le catalogue M comme Maman : ensembles, robes, bas, t-shirts et chaussures pour enfants de 2 à 14 ans. Livraison 24 h sur Dakar.",
};

/* La page interroge le serveur, le composant se contente d'afficher. Le rendu
   part donc rempli, sans attendre le JavaScript. */
export default async function Page() {
  const [produits, rayons] = await Promise.all([
    lireCatalogue({ univers: "enfant" }),
    lireRayons("enfant"),
  ]);

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="mx-auto max-w-[1400px] px-10 py-20 text-muted">Chargement…</div>}>
          <Catalogue produits={produits} rayons={rayons} />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
