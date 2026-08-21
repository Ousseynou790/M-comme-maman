"use client"

import { ORDER_STATUS_LABELS, type ShopOrderStatus } from "./orders-context"

const statusStyles: Record<ShopOrderStatus, string> = {
  recue: "bg-[#C79A6B]/18 text-[#8a6a3f]",
  preparation: "bg-primary/12 text-primary",
  expediee: "bg-accent/20 text-[#4f6a49]",
  livree: "bg-accent/25 text-[#4f6a49]",
  annulee: "bg-destructive/10 text-destructive",
}

export function OrderStatusBadge({ status }: { status: ShopOrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
