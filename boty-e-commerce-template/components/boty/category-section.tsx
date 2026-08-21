import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const tiles = [
  {
    slug: "filles",
    label: "Filles",
    caption: "Robes & jupes",
    image: "/images/mcm/real/short-fille-blanc-lisse.png",
    className: "lg:col-span-2 lg:row-span-2",
  },
  {
    slug: "garcons",
    label: "Garçons",
    caption: "Ensembles & sweats",
    image: "/images/mcm/real/Ensembleenfant-192-retouche.png",
    className: "",
  },
  {
    slug: "bebes",
    label: "Bébés",
    caption: "0 à 2 ans",
    image: "/images/mcm/real/Ensembleenfant-193-retouche.png",
    className: "",
  },
  {
    slug: "chaussures",
    label: "Chaussures",
    caption: "Pour bien grandir",
    image: "/images/mcm/real/chass1.png",
    className: "",
  },
  {
    slug: "accessoires",
    label: "Accessoires",
    caption: "Les petits plus",
    image: "/images/mcm/real/Ensembleenfant-194-retouche.png",
    className: "",
  },
]

export function CategorySection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-primary mb-3 block">
              Nos univers
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground text-balance">
              Trouvez le style de chaque enfant
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary boty-transition shrink-0"
          >
            Voir toute la boutique
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-3 sm:gap-4">
          {tiles.map((tile, index) => (
            <Link
              key={tile.slug}
              href={`/shop?categorie=${tile.slug}`}
              className={`group relative rounded-3xl overflow-hidden boty-shadow ${tile.className}`}
            >
              {/* Une vitesse par tuile : la grille respire au lieu de glisser d'un bloc. */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={tile.image || "/placeholder.svg"}
                  alt={tile.label}
                  fill
                  className="object-cover boty-transition group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <p className="text-xs text-background/80">{tile.caption}</p>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-background">
                    {tile.label}
                  </h3>
                  <span className="w-9 h-9 rounded-full bg-background/90 flex items-center justify-center text-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 boty-transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
