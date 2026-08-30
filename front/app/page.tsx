import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Home } from "@/components/home";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Home />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
