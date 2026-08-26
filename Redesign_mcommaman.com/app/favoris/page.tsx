import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { FavoritesPage } from "@/components/favorites-page";

/* Liste personnelle : rien à indexer. */
export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <FavoritesPage />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
