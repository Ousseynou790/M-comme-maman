"use client";

import { useEffect, useMemo, useState } from "react";
import { formatXOF } from "@/lib/format";
import { SEGMENT_LABELS, computeCustomerStats, useAdmin } from "@/lib/admin/store";
import type { CustomerSegment } from "@/lib/admin/types";
import {
  Chip,
  Kpi,
  Modal,
  Note,
  OrderChip,
  PageHeader,
  Pills,
  SearchField,
  Table,
  dateLongue,
} from "@/components/admin/ui";

type Filtre = CustomerSegment | "toutes";

const TEINTES: Record<CustomerSegment, { bg: string; fg: string }> = {
  nouvelle: { bg: "#eef3fd", fg: "#33538f" },
  fidele: { bg: "#eaf6ef", fg: "#2e7d52" },
  vip: { bg: "#fbeaf1", fg: "#b3306a" },
  endormie: { bg: "#f4f1f2", fg: "#5d5157" },
};

export default function Page() {
  const { customers, orders, hydrated } = useAdmin();
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [recherche, setRecherche] = useState("");
  const [ouverte, setOuverte] = useState<string | null>(null);

  /* La palette de commandes renvoie ici avec ?q=… : on lit l'adresse à la main
     plutôt qu'avec useSearchParams, qui obligerait à un <Suspense>. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setRecherche(q);
  }, []);

  const stats = useMemo(() => computeCustomerStats(customers, orders), [customers, orders]);

  const compte = (f: Filtre) =>
    f === "toutes" ? stats.length : stats.filter((s) => s.segment === f).length;

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return stats
      .filter((s) => filtre === "toutes" || s.segment === filtre)
      .filter(
        (s) =>
          !q ||
          s.customer.name.toLowerCase().includes(q) ||
          s.customer.city.toLowerCase().includes(q) ||
          s.customer.email.toLowerCase().includes(q)
      );
  }, [stats, filtre, recherche]);

  const fiche = stats.find((s) => s.customer.id === ouverte) ?? null;
  const sesCommandes = fiche
    ? orders
        .filter((o) => o.customerId === fiche.customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  const total = stats.reduce((somme, s) => somme + s.spent, 0);
  const optIn = customers.filter((c) => c.marketingOptIn).length;

  if (!hydrated) return <p className="text-[13px] text-muted">Lecture du fichier clientes…</p>;

  return (
    <>
      <PageHeader
        eyebrow="Relation client"
        title="Clients"
        sub="Le segment se déduit des commandes : trois commandes font une fidèle, 120 000 F une VIP, trois mois sans rien une endormie."
      />

      <div className="mb-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Clientes" value={String(customers.length)} />
        <Kpi
          label="Chiffre d'affaires cumulé"
          value={formatXOF(total)}
          hint="commandes encaissées"
        />
        <Kpi
          label="Panier moyen par cliente"
          value={formatXOF(stats.length ? Math.round(total / stats.length) : 0)}
        />
        <Kpi
          label="Acceptent les messages"
          value={`${optIn}/${customers.length}`}
          hint={optIn ? "consentement recueilli" : "personne pour l'instant"}
          tone={optIn ? "#2e7d52" : "#7a6b72"}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchField
          value={recherche}
          onChange={setRecherche}
          placeholder="Nom, ville ou adresse e-mail…"
        />
        <Pills
          value={filtre}
          onChange={setFiltre}
          options={[
            { value: "toutes" as Filtre, label: "Toutes", count: compte("toutes") },
            ...(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map((s) => ({
              value: s as Filtre,
              label: SEGMENT_LABELS[s],
              count: compte(s),
            })),
          ]}
        />
      </div>

      <Table
        cols="1.5fr 1fr .7fr .9fr 1fr .8fr"
        head={["Cliente", "Ville", "Commandes", "Dépensé", "Dernière", "Segment"]}
        rows={liste}
        keyOf={(s) => s.customer.id}
        pageSize={20}
        unite="clientes"
        onRow={(s) => setOuverte(s.customer.id)}
        empty="Aucune cliente ne correspond à ce filtre."
        cells={(s) => [
          <span key="n" className="block min-w-0">
            <span className="block truncate font-bold">{s.customer.name}</span>
            <span className="mt-0.5 block truncate text-[11.5px] text-muted">
              {s.customer.email}
            </span>
          </span>,
          <span key="v" className="truncate text-[13px]">
            {s.customer.city}
          </span>,
          <span key="c" className="font-extrabold tabular-nums">
            {s.orders}
          </span>,
          <span key="d" className="font-extrabold tabular-nums">
            {formatXOF(s.spent)}
          </span>,
          <span key="l" className="text-[12.5px] text-muted">
            {s.lastOrder ? dateLongue(s.lastOrder) : "jamais"}
          </span>,
          <Chip key="s" bg={TEINTES[s.segment].bg} fg={TEINTES[s.segment].fg}>
            {SEGMENT_LABELS[s.segment]}
          </Chip>,
        ]}
      />

      <div className="mt-4">
        <Note>
          Ce fichier vient de la démonstration. Les comptes créés sur la vitrine vivent dans le
          navigateur de chaque cliente (<code>mcm-comptes-v1</code>) et ne remontent pas ici. Le
          jour où ils seront en base, la case «&nbsp;accepte les messages&nbsp;» devra être une vraie
          preuve de consentement, datée.
        </Note>
      </div>

      {fiche && (
        <Modal open onClose={() => setOuverte(null)} title={fiche.customer.name} wide>
          <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr] sm:items-start">
            <div className="rounded-2xl bg-mist p-4">
              <Chip bg={TEINTES[fiche.segment].bg} fg={TEINTES[fiche.segment].fg}>
                {SEGMENT_LABELS[fiche.segment]}
              </Chip>
              <p className="mt-3 text-[13px]">{fiche.customer.email}</p>
              <p className="mt-1 text-[13px] tabular-nums">{fiche.customer.phone}</p>
              <p className="mt-1 text-[13px] text-muted">{fiche.customer.city}</p>
              <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
                Cliente depuis le {dateLongue(fiche.customer.createdAt)}
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                {fiche.customer.marketingOptIn
                  ? "Accepte de recevoir les nouveautés."
                  : "Ne souhaite pas être contactée."}
              </p>
              <p className="mt-3 border-t border-line pt-3 text-[13px]">
                <strong className="text-[17px] font-extrabold tabular-nums">
                  {formatXOF(fiche.spent)}
                </strong>
                <span className="block text-[12px] text-muted">
                  sur {fiche.orders} commande{fiche.orders > 1 ? "s" : ""}
                </span>
              </p>
            </div>

            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">
                Ses commandes
              </p>
              {sesCommandes.length === 0 ? (
                <p className="text-[13px] text-muted">Aucune commande à son nom.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {sesCommandes.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-mist px-4 py-3"
                    >
                      <span className="text-[13px] font-bold tabular-nums">{o.ref}</span>
                      <OrderChip status={o.status} />
                      <span className="text-[12px] text-muted">{dateLongue(o.createdAt)}</span>
                      <span className="ml-auto text-[13px] font-extrabold tabular-nums">
                        {formatXOF(o.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
