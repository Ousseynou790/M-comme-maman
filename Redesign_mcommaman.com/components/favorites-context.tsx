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

import { envoyer } from "@/lib/api";
import { useAuth } from "./auth-context";

/**
 * Les articles mis de côté.
 *
 * Deux régimes, et c'est voulu : tant que la visiteuse n'est pas connectée, ses
 * favoris restent dans son navigateur — lui demander un compte pour cliquer sur
 * un cœur ferait perdre le geste. À la connexion, ils remontent au serveur et
 * la suivent d'un appareil à l'autre.
 */

const CLE_LOCALE = "mcm-favoris-v1";

type FavoriApi = { id: number; produit: number };

type Ctx = {
  /** Identifiants des articles mis de côté, du plus récent au plus ancien. */
  ids: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  /** Faux tant que le stockage n'a pas été relu : évite l'écart d'hydratation. */
  hydrated: boolean;
};

const FavCtx = createContext<Ctx | null>(null);

function lireLocal(): string[] {
  try {
    const brut = window.localStorage.getItem(CLE_LOCALE);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

function ecrireLocal(ids: string[]) {
  try {
    window.localStorage.setItem(CLE_LOCALE, JSON.stringify(ids));
  } catch {
    /* stockage plein ou refusé : la session reste utilisable */
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { account, hydrated: authPrete } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const fusionFaite = useRef(false);

  const connectee = Boolean(account);

  /* Lecture initiale, puis bascule quand la session change. */
  useEffect(() => {
    if (!authPrete) return;

    if (!connectee) {
      setIds(lireLocal());
      setHydrated(true);
      fusionFaite.current = false;
      return;
    }

    // À la première connexion de cette session, on fait remonter ce que le
    // navigateur gardait. Le serveur ajoute sans jamais effacer.
    const locaux = fusionFaite.current ? [] : lireLocal();
    fusionFaite.current = true;

    const charger = locaux.length
      ? envoyer<FavoriApi[]>("/api/compte/favoris/fusionner/", "POST", {
          produits: locaux.map(Number).filter(Number.isFinite),
        })
      : envoyer<{ results: FavoriApi[] }>("/api/compte/favoris/").then((page) => page.results);

    charger
      .then((liste) => {
        setIds(liste.map((f) => String(f.produit)));
        // Le navigateur n'a plus à les garder : le serveur fait foi.
        ecrireLocal([]);
      })
      .catch(() => setIds(lireLocal()))
      .finally(() => setHydrated(true));
  }, [authPrete, connectee]);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback<Ctx["toggle"]>(
    (id) => {
      const present = ids.includes(id);
      const suivant = present ? ids.filter((x) => x !== id) : [id, ...ids];
      setIds(suivant);

      if (!connectee) {
        ecrireLocal(suivant);
        return;
      }
      const appel = present
        ? envoyer(`/api/compte/favoris/produit/${id}/`, "DELETE")
        : envoyer("/api/compte/favoris/", "POST", { produit: Number(id) });
      // L'écran a déjà bougé : en cas d'échec on remet l'état précédent plutôt
      // que de laisser croire à un enregistrement qui n'a pas eu lieu.
      appel.catch(() => setIds(ids));
    },
    [ids, connectee],
  );

  const remove = useCallback<Ctx["remove"]>(
    (id) => {
      if (ids.includes(id)) toggle(id);
    },
    [ids, toggle],
  );

  const clear = useCallback(() => {
    const precedents = ids;
    setIds([]);
    if (!connectee) {
      ecrireLocal([]);
      return;
    }
    Promise.all(
      precedents.map((id) => envoyer(`/api/compte/favoris/produit/${id}/`, "DELETE")),
    ).catch(() => setIds(precedents));
  }, [ids, connectee]);

  const valeur = useMemo<Ctx>(
    () => ({ ids, isFavorite, toggle, remove, clear, count: ids.length, hydrated }),
    [ids, isFavorite, toggle, remove, clear, hydrated],
  );

  return <FavCtx.Provider value={valeur}>{children}</FavCtx.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavCtx);
  if (!ctx) throw new Error("useFavorites doit être utilisé à l'intérieur de <FavoritesProvider>");
  return ctx;
}
