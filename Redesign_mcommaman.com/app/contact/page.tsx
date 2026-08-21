import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { waLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Nous écrire",
  description:
    "Une question sur une taille ou une commande ? WhatsApp au +221 76 208 02 02, réponse dans la journée.",
};

const FIELDS = [
  { l: "Nom", v: "Votre nom", span: 1, textarea: false },
  { l: "Téléphone", v: "+221 …", span: 1, textarea: false },
  { l: "Adresse e-mail", v: "vous@exemple.com", span: 2, textarea: false },
  { l: "Numéro de commande (facultatif)", v: "MCM-2026-…", span: 2, textarea: false },
  { l: "Votre message", v: "Bonjour, je cherche…", span: 2, textarea: true },
];

const CARDS = [
  { t: "Horaires", v: "Lundi au samedi\n9 h – 19 h" },
  { t: "Retrait sur place", v: "Sacré-Cœur 3, Dakar\nSur rendez-vous uniquement" },
  { t: "Courriel", v: "mamand202122@gmail.com\nRéponse sous 24 h" },
];

export default function Page() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1180px] px-10 pb-22 pt-10">
        <h1 className="text-5xl font-extrabold tracking-[-.035em]">Nous écrire</h1>
        <p className="mb-8.5 mt-2.5 max-w-[520px] text-[15px] text-muted">
          Une question sur une taille, une commande en cours, une pièce que vous cherchez : le plus
          rapide reste WhatsApp.
        </p>

        <div className="grid grid-cols-[1.1fr_.9fr] items-start gap-9">
          <form className="rounded-3xl border border-line p-7.5">
            <div className="grid grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <div key={f.l} style={{ gridColumn: `span ${f.span}` }}>
                  <label className="mb-2 block text-[12.5px] font-bold">{f.l}</label>
                  {f.textarea ? (
                    <textarea
                      rows={4}
                      placeholder={f.v}
                      className="w-full resize-none rounded-2xl border-[1.5px] border-[#ece3e7] px-4 py-3.5 text-sm outline-none placeholder:text-[#9c8d93] focus:border-rose"
                    />
                  ) : (
                    <input
                      placeholder={f.v}
                      className="w-full rounded-2xl border-[1.5px] border-[#ece3e7] px-4 py-3.5 text-sm outline-none placeholder:text-[#9c8d93] focus:border-rose"
                    />
                  )}
                </div>
              ))}
            </div>

            <label className="mt-5 flex items-center gap-3 text-[13px] text-muted">
              <input type="checkbox" className="h-4.5 w-4.5 rounded-md border-[1.5px] border-[#e5d9de]" />
              Je ne suis pas un robot
            </label>

            <button
              type="submit"
              className="mt-5.5 rounded-full bg-rose px-7.5 py-4 text-[14.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Envoyer le message
            </button>
          </form>

          <div className="flex flex-col gap-3.5">
            <a
              href={waLink("Bonjour, j'ai une question")}
              target="_blank"
              rel="noreferrer"
              className="block rounded-3xl bg-ink p-7 text-white transition-transform hover:-translate-y-0.5"
            >
              <div className="text-xs font-bold uppercase tracking-[.1em] text-gold">
                Réponse en quelques minutes
              </div>
              <div className="mt-2.5 text-2xl font-extrabold tracking-tight">
                WhatsApp
                <br />
                +221 76 208 02 02
              </div>
            </a>

            {CARDS.map((c) => (
              <div key={c.t} className="rounded-[20px] bg-mist px-6 py-5.5">
                <div className="text-[12.5px] font-bold uppercase tracking-[.08em] text-rose">{c.t}</div>
                <div className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-relaxed">
                  {c.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
