import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { CoinMaman } from "@/components/coin-maman";
import { lireCatalogue } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Coin Maman",
  description:
    "Tissus au coupon et voiles choisis à Dakar. Bazin riche, wax, soie et voiles brodés — pour les mamans qui repartent avec de quoi se coudre quelque chose.",
};

export default async function Page() {
  const produits = await lireCatalogue({ univers: "maman" });

  return (
    <>
      <Header />
      <main>
        <CoinMaman produits={produits} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
