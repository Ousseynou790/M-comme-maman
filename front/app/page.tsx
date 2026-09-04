import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Home } from "@/components/home";
import { lireCatalogue } from "@/lib/catalogue";

export default async function Page() {
  const products = await lireCatalogue({ univers: "enfant" });
  return (
    <>
      <Header />
      <main>
        <Home products={products} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
