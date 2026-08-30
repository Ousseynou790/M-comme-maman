import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Checkout startAt={2} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
