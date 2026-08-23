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

/* Deux clés distinctes : la liste des comptes d'un côté, la session de l'autre.
   Séparées, une déconnexion ne touche pas aux comptes enregistrés, et l'onglet
   voisin n'a qu'une seule clé à surveiller pour suivre la session. */
const CLE_COMPTES = "mcm-comptes-v1";
const CLE_SESSION = "mcm-session-v1";

export type ZoneKey = "dakar" | "thies" | "regions";

export interface SavedAddress {
  id: string;
  /** Nom donné par la cliente : « Maison », « Bureau »… */
  label: string;
  zone: ZoneKey;
  city: string;
  address: string;
  notes: string;
  isDefault: boolean;
}

export interface AccountPreferences {
  /** Tailles suivies, pour repérer les nouveautés à la bonne taille. */
  sizes: string[];
  newsletter: boolean;
}

export const defaultPreferences: AccountPreferences = { sizes: [], newsletter: true };

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  /** Empreinte du mot de passe. Voir la note de sécurité en bas de ce fichier. */
  passwordHash: string;
  salt: string;
  createdAt: string;
  addresses: SavedAddress[];
  preferences: AccountPreferences;
}

/** Ce que le reste de l'application peut lire : jamais l'empreinte ni le sel. */
export type PublicAccount = Omit<Account, "passwordHash" | "salt">;

export interface AuthResult {
  ok: boolean;
  error?: string;
}

type Ctx = {
  account: PublicAccount | null;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    city: string;
    password: string;
    newsletter: boolean;
  }) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<Account, "name" | "phone" | "city">>) => void;
  updatePreferences: (patch: Partial<AccountPreferences>) => void;
  addAddress: (address: Omit<SavedAddress, "id" | "isDefault">) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  changePassword: (current: string, next: string) => Promise<AuthResult>;
  deleteAccount: () => void;
  /** L'adresse proposée par défaut à la commande, s'il y en a une. */
  defaultAddress: SavedAddress | null;
  hydrated: boolean;
};

const AuthContext = createContext<Ctx | null>(null);

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* `crypto.subtle` n'existe qu'en contexte sécurisé — https ou localhost. Ouvert
   depuis une IP du réseau local, le navigateur ne l'expose pas et la création de
   compte échoue : c'est préférable à un mot de passe stocké en clair. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toPublic(account: Account): PublicAccount {
  const { passwordHash: _hash, salt: _salt, ...reste } = account;
  /* Comptes créés avant l'ajout du carnet d'adresses ou des préférences : on
     complète plutôt que de laisser un `undefined` traverser les pages. */
  return {
    ...reste,
    addresses: reste.addresses ?? [],
    preferences: { ...defaultPreferences, ...(reste.preferences ?? {}) },
  };
}

const normaliser = (email: string) => email.trim().toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* Miroir de la liste : `register`, `login` et `changePassword` sont
     asynchrones — le hachage l'est — et doivent lire l'état à jour au retour de
     leur `await`, pas celui figé au moment de l'appel. */
  const comptesRef = useRef<Account[]>([]);
  useEffect(() => {
    comptesRef.current = accounts;
  }, [accounts]);

  /* Lecture différée : le premier rendu doit rester identique côté serveur et
     client, comme pour les recherches récentes. */
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_COMPTES);
      if (brut) {
        const lu: unknown = JSON.parse(brut);
        if (Array.isArray(lu)) {
          setAccounts(lu as Account[]);
          comptesRef.current = lu as Account[];
        }
      }
      const session = window.localStorage.getItem(CLE_SESSION);
      if (session) setEmail(session);
    } catch {
      /* stockage indisponible ou corrompu : on repart déconnectée */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CLE_COMPTES, JSON.stringify(accounts));
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [accounts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (email) window.localStorage.setItem(CLE_SESSION, email);
      else window.localStorage.removeItem(CLE_SESSION);
    } catch {
      /* ignoré */
    }
  }, [email, hydrated]);

  /* Une connexion ou une déconnexion dans un autre onglet se reflète ici. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CLE_SESSION) setEmail(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const account = useMemo(() => {
    if (!email) return null;
    const trouve = accounts.find((a) => a.email === email);
    return trouve ? toPublic(trouve) : null;
  }, [accounts, email]);

  const register = useCallback<Ctx["register"]>(async (input) => {
    const propre = normaliser(input.email);
    if (comptesRef.current.some((a) => a.email === propre)) {
      return { ok: false, error: "Un compte existe déjà avec cette adresse." };
    }

    const salt = randomSalt();
    const cree: Account = {
      id: `cli-${Date.now().toString(36)}`,
      name: input.name.trim(),
      email: propre,
      phone: input.phone.trim(),
      city: input.city.trim(),
      passwordHash: await hashPassword(input.password, salt),
      salt,
      createdAt: new Date().toISOString(),
      addresses: [],
      preferences: { ...defaultPreferences, newsletter: input.newsletter },
    };

    comptesRef.current = [...comptesRef.current, cree];
    setAccounts(comptesRef.current);
    setEmail(cree.email);
    return { ok: true };
  }, []);

  const login = useCallback<Ctx["login"]>(async (brutEmail, password) => {
    const propre = normaliser(brutEmail);
    const trouve = comptesRef.current.find((a) => a.email === propre);
    /* Même message dans les deux cas : on n'indique pas si l'adresse existe. */
    const echec: AuthResult = { ok: false, error: "Adresse e-mail ou mot de passe incorrect." };
    if (!trouve) return echec;

    const empreinte = await hashPassword(password, trouve.salt);
    if (empreinte !== trouve.passwordHash) return echec;

    setEmail(trouve.email);
    return { ok: true };
  }, []);

  const logout = useCallback(() => setEmail(null), []);

  const updateProfile = useCallback<Ctx["updateProfile"]>(
    (patch) => setAccounts((c) => c.map((a) => (a.email === email ? { ...a, ...patch } : a))),
    [email]
  );

  const updatePreferences = useCallback<Ctx["updatePreferences"]>(
    (patch) =>
      setAccounts((c) =>
        c.map((a) =>
          a.email === email
            ? { ...a, preferences: { ...defaultPreferences, ...(a.preferences ?? {}), ...patch } }
            : a
        )
      ),
    [email]
  );

  const addAddress = useCallback<Ctx["addAddress"]>(
    (address) =>
      setAccounts((c) =>
        c.map((a) => {
          if (a.email !== email) return a;
          const existantes = a.addresses ?? [];
          const cree: SavedAddress = {
            ...address,
            id: `adr-${Date.now().toString(36)}`,
            /* La première adresse enregistrée devient l'adresse par défaut. */
            isDefault: existantes.length === 0,
          };
          return { ...a, addresses: [...existantes, cree] };
        })
      ),
    [email]
  );

  const removeAddress = useCallback<Ctx["removeAddress"]>(
    (id) =>
      setAccounts((c) =>
        c.map((a) => {
          if (a.email !== email) return a;
          const restantes = (a.addresses ?? []).filter((adr) => adr.id !== id);
          /* Si l'adresse par défaut disparaît, la première reprend le rôle. */
          if (restantes.length > 0 && !restantes.some((adr) => adr.isDefault)) {
            restantes[0] = { ...restantes[0], isDefault: true };
          }
          return { ...a, addresses: restantes };
        })
      ),
    [email]
  );

  const setDefaultAddress = useCallback<Ctx["setDefaultAddress"]>(
    (id) =>
      setAccounts((c) =>
        c.map((a) =>
          a.email === email
            ? {
                ...a,
                addresses: (a.addresses ?? []).map((adr) => ({ ...adr, isDefault: adr.id === id })),
              }
            : a
        )
      ),
    [email]
  );

  const changePassword = useCallback<Ctx["changePassword"]>(
    async (courant, suivant) => {
      const trouve = comptesRef.current.find((a) => a.email === email);
      if (!trouve) return { ok: false, error: "Vous n'êtes pas connectée." };

      const empreinte = await hashPassword(courant, trouve.salt);
      if (empreinte !== trouve.passwordHash) {
        return { ok: false, error: "Mot de passe actuel incorrect." };
      }

      /* Nouveau sel à chaque changement : deux empreintes d'un même mot de passe
         ne se ressemblent pas. */
      const salt = randomSalt();
      const passwordHash = await hashPassword(suivant, salt);
      comptesRef.current = comptesRef.current.map((a) =>
        a.email === trouve.email ? { ...a, salt, passwordHash } : a
      );
      setAccounts(comptesRef.current);
      return { ok: true };
    },
    [email]
  );

  const deleteAccount = useCallback(() => {
    comptesRef.current = comptesRef.current.filter((a) => a.email !== email);
    setAccounts(comptesRef.current);
    setEmail(null);
  }, [email]);

  const defaultAddress = useMemo(
    () => account?.addresses.find((a) => a.isDefault) ?? account?.addresses[0] ?? null,
    [account]
  );

  const value = useMemo<Ctx>(
    () => ({
      account,
      register,
      login,
      logout,
      updateProfile,
      updatePreferences,
      addAddress,
      removeAddress,
      setDefaultAddress,
      changePassword,
      deleteAccount,
      defaultAddress,
      hydrated,
    }),
    [
      account,
      register,
      login,
      logout,
      updateProfile,
      updatePreferences,
      addAddress,
      removeAddress,
      setDefaultAddress,
      changePassword,
      deleteAccount,
      defaultAddress,
      hydrated,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}

/**
 * Note de sécurité — ceci est une maquette.
 *
 * Les comptes vivent dans le stockage du navigateur : toute personne ayant accès
 * à la machine, ou du JavaScript injecté dans la page, peut lire la liste et
 * remplacer la session. Le mot de passe est haché avec un sel plutôt que gardé
 * en clair, mais un SHA-256 côté client ne protège pas d'une attaque par
 * dictionnaire.
 *
 * Une mise en ligne demande : comptes en base côté serveur, hachage lent
 * (bcrypt / argon2) sur le serveur, session en cookie HttpOnly, et vérification
 * de l'adresse e-mail. Même remarque que pour `product-form.tsx` : la validation
 * côté client ne remplace pas celle du serveur, elle la double.
 */
