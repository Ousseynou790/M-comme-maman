"use client";

import { useState } from "react";
import Link from "next/link";
import { formatXOF, waLink } from "@/lib/format";
import { useCart } from "./cart-context";

const ZONES = [
  { t: "Dakar et banlieue", s: "24 h · offerte dès 25 000 F", cost: 2000, free: 25000 },
  { t: "Thiès, Mbour", s: "2 jours · 3 500 F", cost: 3500, free: Infinity },
  { t: "Autres régions", s: "3 à 4 jours · 3 500 F", cost: 3500, free: Infinity },
];

const METHODS = [
  { k: "wave", i: "W", chip: "#e8f1fd", fg: "#1a63c4", t: "Wave", s: "Redirection vers l'application Wave", fee: "1 %" },
  { k: "om", i: "OM", chip: "#fdeee4", fg: "#c25a12", t: "Orange Money", s: "Code de confirmation par SMS", fee: "1,5 %" },
  { k: "cb", i: "CB", chip: "#f1eefb", fg: "#5540a8", t: "Carte bancaire", s: "Page sécurisée du prestataire", fee: "2,9 %" },
  { k: "cod", i: "₣", chip: "#eaf6ef", fg: "#2e7d52", t: "Paiement à la livraison", s: "Espèces ou Wave au livreur, Dakar uniquement", fee: "sans frais" },
];

const FIELDS = [
  { l: "Nom complet", v: "Aminata Fall", span: 1 },
  { l: "Téléphone", v: "+221 77 000 00 00", span: 1 },
  { l: "Région", v: "Dakar", span: 1 },
  { l: "Ville", v: "Dakar", span: 1 },
  { l: "Quartier", v: "Sacré-Cœur 3", span: 1 },
  { l: "Point de repère", v: "En face de la pharmacie Mermoz", span: 1 },
  { l: "Instructions pour le livreur (facultatif)", v: "Appeler en arrivant, portail bleu", span: 2 },
];

export function Checkout({ startAt = 1 }: { startAt?: number }) {
  const { items, subtotal, bump, remove, optionLabel } = useCart();
  const [step, setStep] = useState(startAt);
  const [zone, setZone] = useState(0);
  const [method, setMethod] = useState("wave");

  const z = ZONES[zone];
  const shipping = subtotal >= z.free ? 0 : z.cost;
  const discount = Math.round(subtotal * 0.15);
  const total = subtotal + shipping - discount;

  const cta = [
    "Passer à la livraison",
    "Passer au paiement",
    `Payer ${formatXOF(total)}`,
    "Commande confirmée",
  ][step - 1];

  return (
    <div className="mx-auto max-w-[1180px] px-10 pb-22 pt-8">
      <div className="mb-7 flex items-center gap-3.5">
        {[
          { t: "Panier", i: 1 },
          { t: "Livraison", i: 2 },
          { t: "Paiement", i: 3 },
        ].map((s, idx, arr) => (
          <div key={s.i} className="flex items-center gap-3.5">
            <button
              onClick={() => setStep(s.i)}
              className={`flex items-center gap-2.5 text-[13.5px] font-bold ${step >= s.i ? "" : "text-[#9c8d93]"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  step >= s.i ? "bg-rose text-white" : "bg-line text-[#9c8d93]"
                }`}
              >
                {s.i}
              </span>
              {s.t}
            </button>
            {idx < arr.length - 1 && <span className="h-px w-8 bg-[#e5d9de]" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_400px] items-start gap-9">
        <div>
          {step === 1 && (
            <>
              <h1 className="text-[34px] font-extrabold tracking-[-.03em]">Votre panier</h1>
              <p className="mb-6 mt-1.5 text-sm text-muted">Commande possible sans créer de compte.</p>

              {items.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#e5d9de] p-14 text-center">
                  <div className="text-base font-bold">Votre panier est vide</div>
                  <p className="mt-2 text-sm text-muted">Tout est en français, y compris les états vides.</p>
                  <Link
                    href="/boutique"
                    className="mt-5 inline-block rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white"
                  >
                    Voir le catalogue
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((i) => (
                    <div
                      key={`${i.id}-${i.color}-${i.size}`}
                      className="flex gap-4.5 rounded-[20px] border border-line p-4"
                    >
                      <div
                        className="h-28 w-23 shrink-0 rounded-2xl bg-stone bg-cover bg-center"
                        style={{ backgroundImage: `url(${i.image})` }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between gap-4">
                          <div>
                            <div className="text-[15px] font-bold">{i.name}</div>
                            <div className="mt-1 text-[13px] text-muted">
                              {optionLabel({ id: i.id, qty: i.qty, color: i.color, size: i.size })}
                            </div>
                          </div>
                          <button onClick={() => remove(i.id)} className="text-[13px] text-[#9c8d93]">
                            Retirer
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="flex items-center gap-4 rounded-full border-[1.5px] border-[#e5d9de] px-3.5 py-1.5 text-sm font-semibold">
                            <button onClick={() => bump(i.id, -1)} aria-label="Retirer un">−</button>
                            <span className="tabular-nums">{i.qty}</span>
                            <button onClick={() => bump(i.id, 1)} aria-label="Ajouter un">+</button>
                          </span>
                          <span className="text-base font-extrabold">{formatXOF(i.price * i.qty)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[34px] font-extrabold tracking-[-.03em]">Livraison</h1>
              <p className="mb-6 mt-1.5 text-sm text-muted">
                L&apos;adressage se fait au quartier et au point de repère, pas au numéro de rue.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {FIELDS.map((f) => (
                  <div key={f.l} style={{ gridColumn: `span ${f.span}` }}>
                    <div className="mb-2 text-[12.5px] font-bold">{f.l}</div>
                    <input
                      defaultValue={f.v}
                      className="w-full rounded-2xl border-[1.5px] border-[#ece3e7] bg-white px-4 py-3.5 text-sm outline-none focus:border-rose"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6.5">
                <div className="mb-2.5 text-[12.5px] font-bold">Zone de livraison</div>
                <div className="flex flex-wrap gap-2.5">
                  {ZONES.map((zz, i) => (
                    <button
                      key={zz.t}
                      onClick={() => setZone(i)}
                      className={`flex flex-col gap-1 rounded-2xl border-[1.5px] px-4.5 py-3.5 text-left transition-colors ${
                        zone === i ? "border-rose bg-rose-soft" : "border-[#ece3e7] bg-white"
                      }`}
                    >
                      <span className="text-sm font-bold">{zz.t}</span>
                      <span className="text-[12.5px] text-muted">{zz.s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[34px] font-extrabold tracking-[-.03em]">Paiement</h1>
              <p className="mb-6 mt-1.5 text-sm text-muted">
                La commande n&apos;est validée qu&apos;à réception du webhook signé du prestataire.
              </p>
              <div className="flex flex-col gap-3">
                {METHODS.map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMethod(m.k)}
                    className={`flex items-center gap-4 rounded-[18px] border-[1.5px] px-5 py-4.5 text-left transition-colors ${
                      method === m.k ? "border-rose bg-rose-soft" : "border-[#ece3e7] bg-white"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                        method === m.k ? "border-rose bg-rose shadow-[inset_0_0_0_3px_#fff]" : "border-[#d8cbd1] bg-white"
                      }`}
                    />
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold"
                      style={{ background: m.chip, color: m.fg }}
                    >
                      {m.i}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold">{m.t}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{m.s}</span>
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#9c8d93]">{m.fee}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-gold-soft px-5 py-4 text-[13px] leading-relaxed text-[#5c4a2a]">
                Trois règles côté serveur : jamais de validation sur le retour navigateur, signature du
                webhook vérifiée, identifiant de transaction en clé unique pour absorber les doublons.
              </div>
            </>
          )}

          {step === 4 && (
            <div className="rounded-3xl border border-line p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ef] text-2xl text-[#2e7d52]">
                ✓
              </div>
              <h1 className="mt-5.5 text-[32px] font-extrabold tracking-[-.03em]">
                Commande MCM-2026-0043 confirmée
              </h1>
              <p className="mx-auto mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-[#6b5a61]">
                Un SMS et un e-mail de confirmation partent maintenant. Vous serez appelée au
                77 000 00 00 avant la livraison.
              </p>
              <div className="mt-6.5 flex justify-center gap-3">
                <Link href="/" className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white">
                  Retour à la boutique
                </Link>
                <a
                  href={waLink("Bonjour, je souhaite suivre ma commande MCM-2026-0043")}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-[1.5px] border-[#e5d9de] px-6 py-3.5 text-sm font-semibold"
                >
                  Suivre sur WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        <aside className="sticky top-30 rounded-3xl border border-line p-6.5">
          <div className="text-base font-extrabold tracking-tight">Récapitulatif</div>
          <div className="mt-4.5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-[#6b5a61]">
              <span>Sous-total</span>
              <span className="tabular-nums">{formatXOF(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#6b5a61]">
              <span>Livraison {zone === 0 ? "Dakar" : "régions"}</span>
              <span>{shipping === 0 ? "Offerte" : formatXOF(shipping)}</span>
            </div>
            <div className="flex justify-between text-[#2e7d52]">
              <span>Code RENTREE15</span>
              <span>−{formatXOF(discount)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3.5 text-xl font-extrabold">
              <span>Total</span>
              <span className="tabular-nums">{formatXOF(total)}</span>
            </div>
          </div>
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className="mt-5 w-full rounded-full bg-rose py-4 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(224,65,127,.65)] transition-transform hover:-translate-y-0.5"
          >
            {cta}
          </button>
          <p className="mt-3 text-center text-[12.5px] text-muted">
            Prix figés à la commande — une hausse ultérieure ne réécrit pas la facture.
          </p>
        </aside>
      </div>
    </div>
  );
}
