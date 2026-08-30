import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ReviewsPage } from "@/components/reviews-page";

export const metadata: Metadata = {
  title: "Avis",
  description:
    "Les avis des clientes de M comme Maman : choix des pièces, livraison à Dakar, conseils de taille.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <ReviewsPage />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
