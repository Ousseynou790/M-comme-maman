"use client"

import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useCart } from "./cart-context"
import { formatPrice } from "@/lib/products"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isOpen, setIsOpen, itemCount, subtotal } = useCart()

  const shipping = 0
  const total = subtotal + shipping

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-[440px]">
        <DrawerHeader className="border-b border-border/50 p-6 py-2.5">
          <DrawerTitle className="font-serif text-2xl">Panier</DrawerTitle>
          <DrawerDescription>{itemCount} {itemCount === 1 ? 'article' : 'articles'}</DrawerDescription>
        </DrawerHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Votre panier est vide</p>
              <DrawerClose asChild>
                <button
                  type="button"
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  Continuer mes achats
                </button>
              </DrawerClose>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base text-foreground mb-1 font-semibold">{item.name}</h3>
                    <p className="text-muted-foreground mb-3 text-sm">Taille {item.size}</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-full">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="p-1.5 hover:bg-muted boty-transition rounded-l-full"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="p-1.5 hover:bg-muted boty-transition rounded-r-full"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.size)}
                        className="p-1.5 text-muted-foreground hover:text-destructive boty-transition"
                        aria-label="Retirer l'article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter className="border-t border-border/50 p-6 gap-4">
            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span>
                <span>{shipping === 0 ? 'Offerte' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-medium text-foreground pt-2 border-t border-border/50">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <DrawerClose asChild>
              <Link
                href="/commande"
                className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium hover:bg-primary/90 boty-transition text-center"
              >
                Passer commande
              </Link>
            </DrawerClose>

            <DrawerClose asChild>
              <button
                type="button"
                className="w-full border border-border text-foreground py-4 rounded-full font-medium hover:bg-muted boty-transition"
              >
                Continuer mes achats
              </button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
