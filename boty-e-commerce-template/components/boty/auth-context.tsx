"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

const ACCOUNTS_KEY = "mcm-accounts-v1"
const SESSION_KEY = "mcm-session-v1"

export interface SavedAddress {
  id: string
  label: string
  zone: "dakar" | "regions"
  city: string
  address: string
  notes: string
  isDefault: boolean
}

export interface AccountPreferences {
  /** Tailles suivies, pour repérer les nouveautés à la bonne taille. */
  sizes: string[]
  newsletter: boolean
}

export const defaultPreferences: AccountPreferences = { sizes: [], newsletter: true }

export interface Account {
  id: string
  name: string
  email: string
  phone: string
  city: string
  /** Empreinte du mot de passe. Voir la note de sécurité en bas de ce fichier. */
  passwordHash: string
  salt: string
  marketingOptIn: boolean
  createdAt: string
  addresses: SavedAddress[]
  preferences: AccountPreferences
}

/** Ce que le reste de l'application peut lire : jamais l'empreinte ni le sel. */
export type PublicAccount = Omit<Account, "passwordHash" | "salt">

export interface AuthResult {
  ok: boolean
  error?: string
}

interface AuthContextType {
  account: PublicAccount | null
  register: (input: {
    name: string
    email: string
    phone: string
    city: string
    password: string
    marketingOptIn: boolean
  }) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  updateProfile: (patch: Partial<Pick<Account, "name" | "phone" | "city" | "marketingOptIn">>) => void
  updatePreferences: (patch: Partial<AccountPreferences>) => void
  addAddress: (address: Omit<SavedAddress, "id" | "isDefault">) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  changePassword: (current: string, next: string) => Promise<AuthResult>
  deleteAccount: () => void
  hydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function toPublic(account: Account): PublicAccount {
  const { passwordHash: _hash, salt: _salt, ...rest } = account
  // Comptes créés avant l'ajout du carnet d'adresses et des préférences.
  return {
    ...rest,
    addresses: rest.addresses ?? [],
    preferences: { ...defaultPreferences, ...(rest.preferences ?? {}) },
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Miroir, pour lire la liste à jour depuis les fonctions asynchrones.
  const accountsRef = useRef<Account[]>([])
  useEffect(() => {
    accountsRef.current = accounts
  }, [accounts])

  // Lecture différée : le premier rendu doit rester identique côté serveur et client.
  useEffect(() => {
    try {
      const rawAccounts = window.localStorage.getItem(ACCOUNTS_KEY)
      if (rawAccounts) {
        const parsed: unknown = JSON.parse(rawAccounts)
        if (Array.isArray(parsed)) {
          setAccounts(parsed as Account[])
          accountsRef.current = parsed as Account[]
        }
      }
      const session = window.localStorage.getItem(SESSION_KEY)
      if (session) setEmail(session)
    } catch {
      /* stockage indisponible ou corrompu : on repart déconnecté */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [accounts, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (email) window.localStorage.setItem(SESSION_KEY, email)
      else window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignoré */
    }
  }, [email, hydrated])

  // Une connexion ou déconnexion dans un autre onglet se reflète ici.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) setEmail(event.newValue)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const account = useMemo(() => {
    if (!email) return null
    const found = accounts.find((a) => a.email === email)
    return found ? toPublic(found) : null
  }, [accounts, email])

  const register = useCallback<AuthContextType["register"]>(async (input) => {
    const cleanEmail = normalizeEmail(input.email)
    if (accountsRef.current.some((a) => a.email === cleanEmail)) {
      return { ok: false, error: "Un compte existe déjà avec cette adresse." }
    }

    const salt = randomSalt()
    const created: Account = {
      id: `cli-${Date.now().toString(36)}`,
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone.trim(),
      city: input.city.trim(),
      passwordHash: await hashPassword(input.password, salt),
      salt,
      marketingOptIn: input.marketingOptIn,
      createdAt: new Date().toISOString(),
      addresses: [],
      preferences: { ...defaultPreferences, newsletter: input.marketingOptIn },
    }

    accountsRef.current = [...accountsRef.current, created]
    setAccounts(accountsRef.current)
    setEmail(created.email)
    return { ok: true }
  }, [])

  const login = useCallback<AuthContextType["login"]>(async (rawEmail, password) => {
    const cleanEmail = normalizeEmail(rawEmail)
    const found = accountsRef.current.find((a) => a.email === cleanEmail)
    // Message identique dans les deux cas : on n'indique pas si l'adresse existe.
    const failure: AuthResult = { ok: false, error: "Adresse e-mail ou mot de passe incorrect." }
    if (!found) return failure

    const hash = await hashPassword(password, found.salt)
    if (hash !== found.passwordHash) return failure

    setEmail(found.email)
    return { ok: true }
  }, [])

  const logout = useCallback(() => setEmail(null), [])

  const updateProfile = useCallback<AuthContextType["updateProfile"]>(
    (patch) => {
      setAccounts((current) => current.map((a) => (a.email === email ? { ...a, ...patch } : a)))
    },
    [email],
  )

  const updatePreferences = useCallback<AuthContextType["updatePreferences"]>(
    (patch) => {
      setAccounts((current) =>
        current.map((a) =>
          a.email === email
            ? { ...a, preferences: { ...defaultPreferences, ...(a.preferences ?? {}), ...patch } }
            : a,
        ),
      )
    },
    [email],
  )

  const addAddress = useCallback<AuthContextType["addAddress"]>(
    (address) => {
      setAccounts((current) =>
        current.map((a) => {
          if (a.email !== email) return a
          const existing = a.addresses ?? []
          const created: SavedAddress = {
            ...address,
            id: `adr-${Date.now().toString(36)}`,
            // La première adresse enregistrée devient l'adresse par défaut.
            isDefault: existing.length === 0,
          }
          return { ...a, addresses: [...existing, created] }
        }),
      )
    },
    [email],
  )

  const removeAddress = useCallback<AuthContextType["removeAddress"]>(
    (id) => {
      setAccounts((current) =>
        current.map((a) => {
          if (a.email !== email) return a
          const remaining = (a.addresses ?? []).filter((adr) => adr.id !== id)
          // Si l'adresse par défaut disparaît, la première reprend le rôle.
          if (remaining.length > 0 && !remaining.some((adr) => adr.isDefault)) {
            remaining[0] = { ...remaining[0], isDefault: true }
          }
          return { ...a, addresses: remaining }
        }),
      )
    },
    [email],
  )

  const setDefaultAddress = useCallback<AuthContextType["setDefaultAddress"]>(
    (id) => {
      setAccounts((current) =>
        current.map((a) =>
          a.email === email
            ? { ...a, addresses: (a.addresses ?? []).map((adr) => ({ ...adr, isDefault: adr.id === id })) }
            : a,
        ),
      )
    },
    [email],
  )

  const changePassword = useCallback<AuthContextType["changePassword"]>(
    async (current, next) => {
      const found = accountsRef.current.find((a) => a.email === email)
      if (!found) return { ok: false, error: "Vous n'êtes pas connectée." }

      const currentHash = await hashPassword(current, found.salt)
      if (currentHash !== found.passwordHash) return { ok: false, error: "Mot de passe actuel incorrect." }

      const salt = randomSalt()
      const passwordHash = await hashPassword(next, salt)
      accountsRef.current = accountsRef.current.map((a) =>
        a.email === found.email ? { ...a, salt, passwordHash } : a,
      )
      setAccounts(accountsRef.current)
      return { ok: true }
    },
    [email],
  )

  const deleteAccount = useCallback(() => {
    accountsRef.current = accountsRef.current.filter((a) => a.email !== email)
    setAccounts(accountsRef.current)
    setEmail(null)
  }, [email])

  const value = useMemo<AuthContextType>(
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
      hydrated,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  return context
}

/**
 * Note de sécurité — ceci est une maquette.
 *
 * Les comptes vivent dans le stockage du navigateur : n'importe qui ayant accès à
 * la machine (ou du JavaScript injecté dans la page) peut lire la liste et
 * remplacer la session. Le mot de passe est haché avec un sel plutôt que gardé en
 * clair, mais un SHA-256 côté client ne protège pas d'une attaque par dictionnaire.
 *
 * Une mise en production demande : comptes en base côté serveur, hachage lent
 * (bcrypt/argon2) sur le serveur, session en cookie HttpOnly, et vérification de
 * l'adresse e-mail.
 */
