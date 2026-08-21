"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { DeliveryZone, PaymentMethodId } from "@/lib/shipping"

const STORAGE_KEY = "mcm-orders-v1"

export type ShopOrderStatus = "recue" | "preparation" | "expediee" | "livree" | "annulee"

export const ORDER_STEPS: { value: Exclude<ShopOrderStatus, "annulee">; label: string; hint: string }[] = [
  { value: "recue", label: "Commande reçue", hint: "Nous avons bien reçu votre demande." },
  { value: "preparation", label: "En préparation", hint: "Les articles sont rassemblés et emballés." },
  { value: "expediee", label: "En route", hint: "Le colis est confié au livreur." },
  { value: "livree", label: "Livrée", hint: "Bonne découverte !" },
]

export const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  recue: "Commande reçue",
  preparation: "En préparation",
  expediee: "En route",
  livree: "Livrée",
  annulee: "Annulée",
}

export interface ShopOrderLine {
  productId: string
  name: string
  image: string
  size: string
  price: number
  quantity: number
}

export interface ShopOrder {
  ref: string
  createdAt: string
  status: ShopOrderStatus
  lines: ShopOrderLine[]
  subtotal: number
  shipping: number
  total: number
  customer: { name: string; phone: string; email: string }
  delivery: { zone: DeliveryZone; city: string; address: string; notes: string }
  payment: PaymentMethodId
}

export type NewOrder = Omit<ShopOrder, "ref" | "createdAt" | "status">

interface OrdersContextType {
  orders: ShopOrder[]
  placeOrder: (order: NewOrder) => ShopOrder
  getOrder: (ref: string) => ShopOrder | undefined
  cancelOrder: (ref: string) => void
  hydrated: boolean
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

function buildRef(existing: number): string {
  const year = new Date().getFullYear()
  return `MCM-${year}-${String(existing + 1).padStart(4, "0")}`
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Lecture différée : le premier rendu doit rester identique côté serveur et client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setOrders(parsed as ShopOrder[])
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart d'un historique vide */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch {
      /* quota dépassé : la commande reste affichée, seule la persistance est perdue */
    }
  }, [orders, hydrated])

  // Miroir de la liste, pour numéroter la commande sans redéfinir placeOrder à chaque rendu.
  const ordersRef = useRef<ShopOrder[]>([])
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  const placeOrder = useCallback<OrdersContextType["placeOrder"]>((input) => {
    const order: ShopOrder = {
      ...input,
      ref: buildRef(ordersRef.current.length),
      createdAt: new Date().toISOString(),
      status: "recue",
    }
    ordersRef.current = [order, ...ordersRef.current]
    setOrders(ordersRef.current)
    return order
  }, [])

  const getOrder = useCallback((ref: string) => orders.find((o) => o.ref === ref), [orders])

  const cancelOrder = useCallback((ref: string) => {
    setOrders((current) =>
      current.map((order) => (order.ref === ref && order.status === "recue" ? { ...order, status: "annulee" } : order)),
    )
  }, [])

  const value = useMemo<OrdersContextType>(
    () => ({ orders, placeOrder, getOrder, cancelOrder, hydrated }),
    [orders, placeOrder, getOrder, cancelOrder, hydrated],
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext)
  if (!context) throw new Error("useOrders doit être utilisé à l'intérieur de <OrdersProvider>")
  return context
}
