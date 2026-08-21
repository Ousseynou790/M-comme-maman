"use client";

import { useState } from "react";
import { ProductForm } from "./product-form";

type Cell = string | [label: string, bg: string, fg: string];

type Panel = {
  title: string;
  sub: string;
  cta: string;
  cols: string;
  head: string[];
  rows: Cell[][];
};

const PANELS: Record<string, Panel> = {
  commandes: {
    title: "Commandes",
    sub: "12 commandes ce mois, 3 en attente de préparation.",
    cta: "Exporter",
    cols: "1.1fr 1.4fr 1fr 1fr .9fr",
    head: ["Numéro", "Cliente", "Paiement", "Statut", "Total"],
    rows: [
      ["MCM-2026-0042", "Aminata Fall — Sacré-Cœur", "Wave", ["Payée", "#eaf6ef", "#2e7d52"], "26 000 F"],
      ["MCM-2026-0041", "Fatou Ndiaye — Ouakam", "À la livraison", ["À préparer", "#fdf3dc", "#8a6a12"], "12 000 F"],
      ["MCM-2026-0040", "Bineta Sow — Thiès", "Orange Money", ["Expédiée", "#eef3fd", "#33538f"], "21 500 F"],
      ["MCM-2026-0039", "Khady Ba — Mermoz", "Wave", ["Livrée", "#f4f1f2", "#5d5157"], "9 000 F"],
      ["MCM-2026-0038", "Ndeye Diop — WhatsApp", "À la livraison", ["Annulée", "#fbeaf1", "#b3306a"], "7 500 F"],
    ],
  },
  produits: {
    title: "Produits",
    sub: "12 publiés, 5 en brouillon. Un brouillon n'apparaît jamais en boutique.",
    cta: "Nouveau produit",
    cols: "1.8fr 1fr .9fr .8fr .9fr",
    head: ["Produit", "Référence", "Prix", "Stock", "Statut"],
    rows: [
      ["Robe chasuble rose à volant plumetis", "RBP-0040", "12 000 F", "8", ["Publié", "#eaf6ef", "#2e7d52"]],
      ["Ensemble pyjama à illustration", "PYJ-1380", "12 000 F", "4", ["Publié", "#eaf6ef", "#2e7d52"]],
      ["Babies vernies à bride", "CHS-2210", "3 000 F", "11", ["Publié", "#eaf6ef", "#2e7d52"]],
      ["Safari enfant", "SAF-0000", "0 F", "0", ["Brouillon", "#fdf3dc", "#8a6a12"]],
      ["Ensemble enfant-190", "ENS-0190", "50 F", "2", ["Brouillon", "#fdf3dc", "#8a6a12"]],
      ["Ensemble pyjama rouge et vichy", "PYJ-0190", "8 500 F", "0", ["Rupture", "#fbeaf1", "#b3306a"]],
    ],
  },
  stock: {
    title: "Stock",
    sub: "Chaque mouvement est tracé : vente, réapprovisionnement, retour, ajustement.",
    cta: "Réapprovisionner",
    cols: "1.6fr 1fr 1fr 1fr 1fr",
    head: ["Variante", "Mouvement", "Motif", "Reste", "Date"],
    rows: [
      ["Pyjama illustration — 4 ans", "−1", "Vente MCM-0042", "3", "Aujourd'hui"],
      ["Robe de fête écrue — 6 ans", "+12", "Réapprovisionnement", "12", "Hier"],
      ["Babies vernies — pointure 24", "−2", "Vente MCM-0040", "5", "Hier"],
      ["Pyjama rouge vichy — 2 ans", "−1", "Vente MCM-0039", "0", "12 août"],
      ["T-shirt raglan — 6 ans", "+1", "Retour client", "7", "11 août"],
    ],
  },
  promotions: {
    title: "Promotions",
    sub: "Le compte à rebours de la page d'accueil lit la date de fin saisie ici.",
    cta: "Créer un code",
    cols: "1fr 1fr 1fr 1.2fr 1fr",
    head: ["Code", "Type", "Valeur", "Fin", "Utilisations"],
    rows: [
      ["RENTREE15", "Pourcentage", "−15 %", "8 septembre 2026", "23 / 200"],
      ["BIENVENUE", "Montant fixe", "−2 000 F", "Sans limite", "104"],
      ["TABASKI", "Pourcentage", "−20 %", ["Expiré", "#f4f1f2", "#5d5157"], "318"],
    ],
  },
};

const NAV = [
  { key: "commandes", label: "Commandes" },
  { key: "produits", label: "Produits" },
  { key: "stock", label: "Stock" },
  { key: "promotions", label: "Promotions" },
];

const KPIS = [
  { l: "Ventes du mois", v: "286 000 F", d: "+18 % sur juillet", fg: "#2e7d52" },
  { l: "Commandes", v: "12", d: "3 à préparer", fg: "#8a6a12" },
  { l: "Panier moyen", v: "23 800 F", d: "+2 100 F", fg: "#2e7d52" },
  { l: "Ruptures", v: "2", d: "À réapprovisionner", fg: "#b3306a" },
];

export function Admin() {
  const [tab, setTab] = useState("commandes");
  const [creating, setCreating] = useState(false);
  const panel = PANELS[tab];

  return (
    <div className="grid min-h-screen grid-cols-[230px_1fr] bg-[#faf8f9]">
      <aside className="bg-ink px-4.5 py-6.5 text-white">
        <div className="px-2.5 text-[15px] font-extrabold tracking-tight">Back-office</div>
        <div className="px-2.5 pb-5 pt-1 text-xs text-white/50">m comme maman</div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                setTab(n.key);
                setCreating(false);
              }}
              className={`rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                tab === n.key ? "bg-white/12 font-bold text-white" : "font-medium text-white/60"
              }`}
            >
              {n.label}
            </button>
          ))}
          {["Clients", "Contenu de la home"].map((label) => (
            <span key={label} className="rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/30">
              {label}
            </span>
          ))}
        </nav>
      </aside>

      <div className="px-9 pb-18 pt-8">
        {creating ? (
          <ProductForm onCancel={() => setCreating(false)} />
        ) : (
          <>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[30px] font-extrabold tracking-[-.03em]">{panel.title}</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">{panel.sub}</p>
          </div>
          <button
            onClick={() => tab === "produits" && setCreating(true)}
            className="rounded-full bg-rose px-5.5 py-3 text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            {panel.cta}
          </button>
        </div>

        <div className="mt-6.5 grid grid-cols-4 gap-3.5">
          {KPIS.map((k) => (
            <div key={k.l} className="rounded-[18px] border border-line bg-white p-5">
              <div className="text-[12.5px] font-semibold text-muted">{k.l}</div>
              <div className="mt-2 whitespace-nowrap text-[28px] font-extrabold tracking-[-.03em]">
                {k.v}
              </div>
              <div className="mt-1 text-xs font-semibold" style={{ color: k.fg }}>
                {k.d}
              </div>
            </div>
          ))}
        </div>

        <div key={tab} className="anim-fade-up mt-5.5 overflow-hidden rounded-[20px] border border-line bg-white">
          <div
            className="grid gap-4 bg-mist px-5.5 py-3.5 text-xs font-bold uppercase tracking-[.05em] text-muted"
            style={{ gridTemplateColumns: panel.cols }}
          >
            {panel.head.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {panel.rows.map((row, i) => (
            <div
              key={i}
              onClick={() => tab === "produits" && setCreating(true)}
              className={`grid items-center gap-4 border-t border-[#f4edf0] px-5.5 py-4 text-[13.5px] transition-colors ${
                tab === "produits" ? "cursor-pointer hover:bg-mist" : ""
              }`}
              style={{ gridTemplateColumns: panel.cols }}
            >
              {row.map((cell, j) =>
                Array.isArray(cell) ? (
                  <span key={j}>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{ background: cell[1], color: cell[2] }}
                    >
                      {cell[0]}
                    </span>
                  </span>
                ) : (
                  <span key={j} className="font-medium text-[#3d2f35]">
                    {cell}
                  </span>
                )
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-gold-soft px-5 py-4 text-[13px] leading-relaxed text-[#5c4a2a]">
          Tout produit naît en brouillon. Tant qu&apos;il n&apos;a pas un nom commercial, une photo et
          un prix supérieur à zéro, il ne peut pas être publié — c&apos;est ce garde-fou qui manquait
          quand « Safari enfant » est parti en ligne à 0 F.
        </div>
          </>
        )}
      </div>
    </div>
  );
}
