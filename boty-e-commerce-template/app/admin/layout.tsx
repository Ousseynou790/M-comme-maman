import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AdminProvider } from "@/lib/admin/store"
import { AdminGate } from "@/components/admin/shell"

export const metadata: Metadata = {
  title: "Administration — M comme Maman",
  description: "Espace de gestion du catalogue, des commandes et des clientes.",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminGate>{children}</AdminGate>
    </AdminProvider>
  )
}
