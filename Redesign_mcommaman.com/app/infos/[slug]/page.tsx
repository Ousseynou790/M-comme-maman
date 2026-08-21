import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { LEGAL_PAGES, legalBySlug } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = legalBySlug(slug);
  return page ? { title: page.title } : { title: "Page introuvable" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1180px] px-10 pb-22 pt-10">
        <h1 className="text-5xl font-extrabold tracking-[-.035em]">Informations légales</h1>
        <p className="mb-7.5 mt-2.5 max-w-[560px] text-[15px] text-muted">
          Aucune de ces pages n&apos;existait sur l&apos;ancien site. Trois d&apos;entre elles sont
          obligatoires pour vendre en ligne.
        </p>

        <div className="grid grid-cols-[250px_1fr] items-start gap-10">
          <nav className="flex flex-col gap-1">
            {LEGAL_PAGES.map((p) => {
              const active = p.slug === page.slug;
              return (
                <Link
                  key={p.slug}
                  href={`/infos/${p.slug}`}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl px-4 py-3.5 text-sm transition-colors ${
                    active ? "bg-ink font-bold text-white" : "bg-mist font-medium text-[#4a3a41]"
                  }`}
                >
                  {p.title}
                  {p.required && (
                    <span
                      className={`text-[10.5px] font-bold uppercase tracking-[.06em] ${
                        active ? "text-gold" : "text-rose-deep"
                      }`}
                    >
                      Obligatoire
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <article className="anim-fade-up rounded-3xl border border-line px-10.5 py-9.5">
            <h2 className="text-[28px] font-extrabold tracking-[-.025em]">{page.title}</h2>
            <p className="mt-2 text-[12.5px] text-[#9c8d93]">Dernière mise à jour : 14 août 2026</p>
            <div className="mt-6 whitespace-pre-line text-[15px] leading-[1.75] text-[#4a3a41]">
              {page.body}
            </div>
          </article>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
