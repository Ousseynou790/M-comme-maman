"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CLE_FAVORIS = "mcm-favoris-v1";

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

const FavoritesContext = createContext<Ctx | null>(null);

/* Le stockage peut contenir n'importe quoi — une version antérieure, une main
   qui a édité la clé. On ne garde que des chaînes. */
function lireIds(brut: string | null): string[] | null {
  if (!brut) return null;
  try {
    const lu: unknown = JSON.parse(brut);
    if (!Array.isArray(lu)) return null;
    return lu.filter((v): v is string => typeof v === "string");
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Lecture différée : le premier rendu doit rester identique côté serveur et
     client, comme pour le panier, les comptes, les commandes et les avis. */
  useEffect(() => {
    try {
      const lu = lireIds(window.localStorage.getItem(CLE_FAVORIS));
      if (lu) setIds(lu);
    } catch {
      /* stockage indisponible : on repart d'une liste vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CLE_FAVORIS, JSON.stringify(ids));
    } catch {
      /* quota dépassé : la liste reste affichée, seule la persistance est perdue */
    }
  }, [ids, hydrated]);

  /* Un cœur touché dans un autre onglet se voit ici : c'est le même geste que
     pour la session du compte. */
  useEffect(() => {
    const surStockage = (e: StorageEvent) => {
      if (e.key !== CLE_FAVORIS) return;
      const lu = lireIds(e.newValue);
      setIds(lu ?? []);
    };
    window.addEventListener("storage", surStockage);
    return () => window.removeEventListener("storage", surStockage);
  }, []);

  /* Le dernier ajouté passe en tête : la liste se lit comme un fil, du plus
     récent au plus ancien. */
  const toggle = useCallback((id: string) => {
    setIds((liste) => (liste.includes(id) ? liste.filter((v) => v !== id) : [id, ...liste]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((liste) => liste.filter((v) => v !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<Ctx>(
    () => ({
      ids,
      isFavorite: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
      count: ids.length,
      hydrated,
    }),
    [ids, toggle, remove, clear, hydrated]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites doit être utilisé dans <FavoritesProvider>");
  return ctx;
}

/**
 * Note — les favoris vivent dans le navigateur.
 *
 * La liste ne suit pas le compte : ouverte sur un autre téléphone, elle est
 * vide, même connectée. C'est la limite assumée d'une vitrine sans serveur.
 *
 * En ligne, la table est courte — `(compte, produit, date)`, une contrainte
 * d'unicité — et la liste du navigateur se fond dedans à la connexion plutôt
 * que de l'écraser : une cliente qui a mis des pièces de côté avant de créer
 * son compte ne doit pas les perdre en le créant.
 */
