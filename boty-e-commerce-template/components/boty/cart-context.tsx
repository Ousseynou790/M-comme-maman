"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  size: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (id: string, size: string) => void
  updateQuantity: (id: string, size: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function lineKey(id: string, size: string) {
  return `${id}__${size}`
}

const STORAGE_KEY = "mcm-cart-v1"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Lecture différée : le premier rendu doit rester identique côté serveur et client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed as CartItem[])
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart d'un panier vide */
    }
    setHydrated(true)
  }, [])

  // Le panier survit à un rechargement, indispensable pendant le tunnel de commande.
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota dépassé : la session reste utilisable, seule la persistance est perdue */
    }
  }, [items, hydrated])

  const addItem = (newItem: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => lineKey(item.id, item.size) === lineKey(newItem.id, newItem.size),
      )
      if (existing) {
        return currentItems.map((item) =>
          lineKey(item.id, item.size) === lineKey(newItem.id, newItem.size)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...currentItems, { ...newItem, quantity }]
    })
    setIsOpen(true)
  }

  const removeItem = (id: string, size: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => lineKey(item.id, item.size) !== lineKey(id, size)),
    )
  }

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id, size)
      return
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        lineKey(item.id, item.size) === lineKey(id, size) ? { ...item, quantity } : item,
      ),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
