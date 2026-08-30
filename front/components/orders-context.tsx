"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MethodKey } from "@/lib/livraison";
import type { ZoneKey } from "./auth-context";

const CLE_COMMANDES = "mcm-commandes-v1";

export type OrderStatus = "recue" | "preparation" | "expediee" | "livree" | "annulee";

/* Les quatre temps du parcours, dans l'ordre. « annulee » n'en fait pas partie :
   c'est une sortie de route, pas une étape. */
export const ORDER_STEPS: { value: Exclude<OrderStatus, "annulee">; label: string; hint: string }[] = [
  { value: "recue", label: "Commande reçue", hint: "Nous avons bien reçu votre demande." },
  { value: "preparation", label: "En préparation", hint: "Les pièces sont rassemblées et emballées." },
  { value: "expediee", label: "En route", hint: "Le colis est confié au livreur." },
  { value: "livree", label: "Livrée", hint: "Bonne découverte !" },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recue: "Commande reçue",
  preparation: "En préparation",
  expediee: "En route",
  livree: "Livrée",
  annulee: "Annulée",
};

export interface OrderLine {
  productId: string;
  /** Pour reconstruire le lien vers la fiche, `/p/[slug]`. */
  slug: string;
  name: string;
  image: string;
  /** La variante achetée. Absente des commandes passées avant le serveur :
      on repasse alors par le slug pour recommander. */
  variante?: number;
  /** Le choix en toutes lettres, figé : « Rose poudré · 2 ans ». Si le coloris
      disparaît du catalogue, la commande garde ce qui a été acheté. */
  option: string;
  price: number;
  quantity: number;
}

export interface Order {
  ref: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  /** Remise appliquée, 0 sans code. */
  discount: number;
  /** Le code saisi, chaîne vide sans code. */
  promoCode: string;
  total: number;
  customer: { name: string; phone: string; email: string };
  delivery: { zone: ZoneKey; city: string; address: string; notes: string };
  payment: MethodKey;
}

export type NewOrder = Omit<Order, "ref" | "createdAt" | "status">;

type Ctx = {
  orders: Order[];
  placeOrder: (order: NewOrder) => Order;
  getOrder: (ref: string) => Order | undefined;
  cancelOrder: (ref: string) => void;
  /** La cliente confirme avoir reçu son colis. */
  confirmDelivery: (ref: string) => void;
  hydrated: boolean;
};

const OrdersContext = createContext<Ctx | null>(null);

/* Référence lisible et croissante, du même format que celles du back-office.
   Elle repose sur le nombre de commandes déjà passées dans ce navigateur :
   côté serveur, ce sera une séquence en base. */
function construireRef(deja: number): string {
  return `MCM-${new Date().getFullYear()}-${String(deja + 1).padStart(4, "0")}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Lecture différée : le premier rendu doit rester identique côté serveur et
     client, comme pour le panier et les comptes. */
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_COMMANDES);
      if (brut) {
        const lu: unknown = JSON.parse(brut);
        if (Array.isArray(lu)) setOrders(lu as Order[]);
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart d'un historique vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CLE_COMMANDES, JSON.stringify(orders));
    } catch {
      /* quota dépassé : la commande reste affichée, seule la persistance est perdue */
    }
  }, [orders, hydrated]);

  /* Miroir de la liste : `placeOrder` numérote la commande sans avoir à se
     redéfinir à chaque rendu. */
  const commandesRef = useRef<Order[]>([]);
  useEffect(() => {
    commandesRef.current = orders;
  }, [orders]);

  const placeOrder = useCallback<Ctx["placeOrder"]>((entree) => {
    const commande: Order = {
      ...entree,
      ref: construireRef(commandesRef.current.length),
      createdAt: new Date().toISOString(),
      status: "recue",
    };
    /* La plus récente en tête : c'est l'ordre d'affichage partout. */
    commandesRef.current = [commande, ...commandesRef.current];
    setOrders(commandesRef.current);
    return commande;
  }, []);

  const getOrder = useCallback((ref: string) => orders.find((o) => o.ref === ref), [orders]);

  /* On n'annule que tant que rien n'est parti en préparation. */
  const cancelOrder = useCallback((ref: string) => {
    setOrders((liste) =>
      liste.map((o) => (o.ref === ref && o.status === "recue" ? { ...o, status: "annulee" } : o))
    );
  }, []);

  /* Confirmation de réception par la cliente. C'est le seul évènement qui fait
     avancer un statut aujourd'hui : le reste du parcours attend le back-office.
     Et c'est cette confirmation qui ouvre le droit de laisser un avis. */
  const confirmDelivery = useCallback((ref: string) => {
    setOrders((liste) =>
      liste.map((o) => (o.ref === ref && o.status !== "annulee" ? { ...o, status: "livree" } : o))
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({ orders, placeOrder, getOrder, cancelOrder, confirmDelivery, hydrated }),
    [orders, placeOrder, getOrder, cancelOrder, confirmDelivery, hydrated]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): Ctx {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders doit être utilisé dans <OrdersProvider>");
  return ctx;
}

/**
 * Note — les commandes vivent dans le navigateur.
 *
 * Rien n'est envoyé nulle part : la commande n'existe que sur la machine qui
 * l'a passée, et le statut ne bouge pas tout seul puisqu'aucun back-office ne
 * le fait avancer. C'est le parcours qui est complet, pas la boutique.
 *
 * En ligne, il faudra : la commande écrite en base à la validation, la
 * référence tirée d'une séquence côté serveur, le statut piloté depuis le
 * back-office, et le paiement confirmé par le webhook signé du prestataire —
 * jamais par le retour du navigateur.
 */
