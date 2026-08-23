import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import { CartProvider } from "@/components/cart-context";
import { OrdersProvider } from "@/components/orders-context";

export const metadata: Metadata = {
  title: {
    default: "M comme Maman — vêtements d'enfant à Dakar",
    template: "%s · M comme Maman",
  },
  description:
    "Vêtements d'enfant de 0 à 15 ans choisis pièce par pièce à Dakar. Livraison 24 h, paiement Wave, Orange Money ou à la livraison.",
  openGraph: {
    title: "M comme Maman — vêtements d'enfant à Dakar",
    description: "Le monde des mamans. Livraison 24 h sur Dakar, paiement mobile money.",
    locale: "fr_SN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <OrdersProvider>
            <CartProvider>{children}</CartProvider>
          </OrdersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
