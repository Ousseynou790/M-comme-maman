import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1180px] px-10 py-28 text-center">
        <div className="text-xs font-bold uppercase tracking-[.14em] text-rose">Erreur 404</div>
        <h1 className="mt-4 text-5xl font-extrabold tracking-[-.035em]">Cette page n&apos;existe pas</h1>
        <p className="mx-auto mt-4 max-w-[440px] text-[15px] leading-relaxed text-muted">
          Le lien est peut-être ancien. Le catalogue tient sur une seule page, vous y retrouverez tout.
        </p>
        <Link
          href="/boutique"
          className="mt-7 inline-block rounded-full bg-rose px-7 py-4 text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Voir le catalogue
        </Link>
      </main>
      <Footer />
    </>
  );
}
