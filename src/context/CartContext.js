"use client";

import { createContext, useContext } from "react";
import { useCartUI } from "./cart/useCartUI";
import { useCartItems } from "./cart/useCartItems";
import { useCartPromo } from "./cart/useCartPromo";
import { useCartDelivery } from "./cart/useCartDelivery";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { notification, showNotification, flyEvents, triggerFly } = useCartUI();

  const { cartItems, cartCount, subtotal, addToCart, removeFromCart, updateQuantity, clearItems } =
    useCartItems(showNotification);

  const { promoCode, promoError, promoSuccess, applyPromoCode, removePromoCode, discountAmount, clearPromo } =
    useCartPromo(subtotal);

  const {
    selectedZone, setSelectedZone, deliveryZones: dynamicZones,
    deliveryFee, amountToFreeDelivery, freeDeliveryProgress,
    FREE_DELIVERY_THRESHOLD, clearDelivery,
  } = useCartDelivery(subtotal, promoCode);

  const clearCart = () => {
    clearItems();
    clearPromo();
    clearDelivery();
  };

  const grandTotal = subtotal + deliveryFee() - discountAmount();

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        promoCode,
        promoError,
        promoSuccess,
        applyPromoCode,
        removePromoCode,
        selectedZone,
        setSelectedZone,
        deliveryZones: dynamicZones,
        deliveryFee: deliveryFee(),
        subtotal,
        discountAmount: discountAmount(),
        grandTotal,
        amountToFreeDelivery,
        freeDeliveryProgress,
        FREE_DELIVERY_THRESHOLD,
        notification,
        showNotification,
        flyEvents,
        triggerFly,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
