import { Header } from "@/components/boty/header"
import { Hero } from "@/components/boty/hero"
import { TrustBadges } from "@/components/boty/trust-badges"
import { FeatureSection } from "@/components/boty/feature-section"
import { ProductGrid } from "@/components/boty/product-grid"
import { PromoSection } from "@/components/boty/promo-section"
import { CategorySection } from "@/components/boty/category-section"
import { Testimonials } from "@/components/boty/testimonials"
import { Newsletter } from "@/components/boty/newsletter"
import { Footer } from "@/components/boty/footer"

export default function HomePage() {
  return (
    <main className="bg-background">
      <Header />
      <Hero />
      <TrustBadges />
      <PromoSection />
      <CategorySection />
      <ProductGrid />
      <FeatureSection />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}

