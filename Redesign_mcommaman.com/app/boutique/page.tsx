import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Catalogue } from "@/components/catalogue";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Tout le catalogue M comme Maman : ensembles, robes, bas, t-shirts et chaussures pour enfants de 0 à 15 ans. Livraison 24 h sur Dakar.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="mx-auto max-w-[1400px] px-10 py-20 text-muted">Chargement…</div>}>
          <Catalogue />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
