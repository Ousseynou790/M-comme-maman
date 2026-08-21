import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/boty/cart-context'
import { FavoritesProvider } from '@/components/boty/favorites-context'
import { OrdersProvider } from '@/components/boty/orders-context'
import { ReviewsProvider } from '@/components/boty/reviews-context'
import { AuthProvider } from '@/components/boty/auth-context'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700']
});

const fraunces = Fraunces({ 
  subsets: ["latin"],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700', '900']
});

export const metadata: Metadata = {
  title: 'M comme Maman — Vêtements enfants & bébés',
  description: "La boutique en ligne des mamans : des vêtements enfants et bébés de qualité, durables et pleins de douceur. Livraison partout au Sénégal.",
  keywords: ['vêtements enfants', 'vêtements bébés', 'mode enfant', 'Sénégal', 'Dakar', 'coton bio', 'boutique enfants'],
  openGraph: {
    title: 'M comme Maman — Le vestiaire joyeux des petits',
    description: 'Des vêtements enfants et bébés choisis avec amour à Dakar.',
    locale: 'fr_SN',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FBF6F0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="bg-background">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <AuthProvider>
          <FavoritesProvider>
            <OrdersProvider>
              <ReviewsProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </ReviewsProvider>
            </OrdersProvider>
          </FavoritesProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
