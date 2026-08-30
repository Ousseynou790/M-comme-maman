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

const CLE_AVIS = "mcm-avis-v1";

/** Avis sur un article précis, ou sur la boutique dans son ensemble. */
export type ReviewTarget = { kind: "product"; productId: string } | { kind: "shop" };

export interface Review {
  id: string;
  target: ReviewTarget;
  /** Note de 1 à 5. */
  rating: number;
  comment: string;
  authorName: string;
  /** Identifiant du compte : sert à savoir qui peut modifier ou supprimer son avis. */
  authorEmail: string;
  /** La commande livrée qui donne le droit d'écrire cet avis. */
  orderRef: string;
  createdAt: string;
}

export interface Aggregate {
  count: number;
  average: number;
  /** Nombre d'avis par note, de 1 à 5. */
  distribution: Record<number, number>;
}

type Ctx = {
  reviews: Review[];
  productReviews: (productId: string) => Review[];
  shopReviews: () => Review[];
  aggregate: (target: ReviewTarget) => Aggregate;
  /** L'avis déjà déposé par cette adresse pour cette cible, s'il existe. */
  reviewBy: (email: string, target: ReviewTarget) => Review | undefined;
  submit: (input: Omit<Review, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  hydrated: boolean;
};

const ReviewsContext = createContext<Ctx | null>(null);

function memeCible(a: ReviewTarget, b: ReviewTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "product" && b.kind === "product") return a.productId === b.productId;
  return true;
}

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Lecture différée : le premier rendu doit rester identique côté serveur et
     client, comme pour le panier, les comptes et les commandes. */
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_AVIS);
      if (brut) {
        const lu: unknown = JSON.parse(brut);
        if (Array.isArray(lu)) setReviews(lu as Review[]);
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart sans avis */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CLE_AVIS, JSON.stringify(reviews));
    } catch {
      /* quota dépassé : l'avis reste affiché, seule la persistance est perdue */
    }
  }, [reviews, hydrated]);

  const productReviews = useCallback(
    (productId: string) =>
      reviews
        .filter((r) => r.target.kind === "product" && r.target.productId === productId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews]
  );

  const shopReviews = useCallback(
    () =>
      reviews
        .filter((r) => r.target.kind === "shop")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews]
  );

  const aggregate = useCallback<Ctx["aggregate"]>(
    (target) => {
      const liste = reviews.filter((r) => memeCible(r.target, target));
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of liste) distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
      const total = liste.reduce((somme, r) => somme + r.rating, 0);
      return {
        count: liste.length,
        /* Une décimale : « 4,7 » se lit, « 4,666… » non. */
        average: liste.length ? Math.round((total / liste.length) * 10) / 10 : 0,
        distribution,
      };
    },
    [reviews]
  );

  const reviewBy = useCallback<Ctx["reviewBy"]>(
    (email, target) => reviews.find((r) => r.authorEmail === email && memeCible(r.target, target)),
    [reviews]
  );

  const submit = useCallback<Ctx["submit"]>((entree) => {
    setReviews((liste) => {
      /* Un compte n'a qu'un avis par cible : le nouveau remplace l'ancien. */
      const autres = liste.filter(
        (r) => !(r.authorEmail === entree.authorEmail && memeCible(r.target, entree.target))
      );
      const avis: Review = {
        ...entree,
        id: `avis-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      return [avis, ...autres];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setReviews((liste) => liste.filter((r) => r.id !== id));
  }, []);

  const value = useMemo<Ctx>(
    () => ({ reviews, productReviews, shopReviews, aggregate, reviewBy, submit, remove, hydrated }),
    [reviews, productReviews, shopReviews, aggregate, reviewBy, submit, remove, hydrated]
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews(): Ctx {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error("useReviews doit être utilisé dans <ReviewsProvider>");
  return ctx;
}

/**
 * Note — les avis vivent dans le navigateur.
 *
 * Le droit d'écrire est vérifié côté client : on cherche une commande livrée
 * qui porte l'article. Rien n'empêche de contourner ça en éditant le stockage.
 * En ligne, la vérification appartient au serveur — avis rattaché à une ligne
 * de commande livrée, un seul par cliente et par article — et la modération
 * annoncée en page d'accueil demande un vrai passage en revue avant publication.
 */
