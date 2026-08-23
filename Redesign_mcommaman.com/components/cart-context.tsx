"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { PRODUCTS, byId, COLORS, SIZES, type Product } from "@/lib/products";

const CLE_PANIER = "mcm-panier-v1";

export type Line = { id: string; qty: number; color: number; size: number };

/* Le panier de démonstration, servi tant que ce navigateur n'a jamais rien mis
   dedans. Dès la première modification, c'est le contenu enregistré qui prime —
   y compris un panier vide après une commande. */
const DEMO: Line[] = [
  { id: "p3", qty: 1, color: 0, size: 2 },
  { id: "p12", qty: 1, color: 1, size: 0 },
];

type Ctx = {
  lines: Line[];
  items: (Product & { qty: number; color: number; size: number })[];
  count: number;
  subtotal: number;
  pulse: number;
  drawerOpen: boolean;
  add: (id: string, color?: number, size?: number) => void;
  bump: (id: string, delta: number) => void;
  remove: (id: string) => void;
  /** Vide le panier — appelé une fois la commande enregistrée. */
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  optionLabel: (line: Line) => string;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>(DEMO);
  const [pulse, setPulse] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* Lecture différée, comme les comptes et les commandes : le premier rendu
     doit rester identique côté serveur et client, d'où le panier de
     démonstration en valeur de départ des deux côtés. */
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_PANIER);
      if (brut) {
        const lu: unknown = JSON.parse(brut);
        if (Array.isArray(lu)) setLines(lu as Line[]);
      }
    } catch {
      /* stockage indisponible ou corrompu : on garde le panier de démonstration */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CLE_PANIER, JSON.stringify(lines));
    } catch {
      /* quota dépassé : le panier reste affiché, seule la persistance est perdue */
    }
  }, [lines, hydrated]);

  const add = useCallback((id: string, color = 0, size = 2) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === id && l.color === color && l.size === size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { id, qty: 1, color, size }];
    });
    setPulse((p) => p + 1);
    setDrawerOpen(true);
  }, []);

  const bump = useCallback((id: string, delta: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
    );
    setPulse((p) => p + 1);
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const items = useMemo(
    () =>
      lines.flatMap((l) => {
        const p = byId(l.id);
        return p ? [{ ...p, qty: l.qty, color: l.color, size: l.size }] : [];
      }),
    [lines]
  );

  const value: Ctx = {
    lines,
    items,
    count: lines.reduce((a, l) => a + l.qty, 0),
    subtotal: items.reduce((a, i) => a + i.price * i.qty, 0),
    pulse,
    drawerOpen,
    add,
    bump,
    remove,
    clear,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    optionLabel: (l) => `${COLORS[l.color].name} · ${SIZES[l.size]}`,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}

export { PRODUCTS };
