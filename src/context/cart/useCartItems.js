"use client";

import { useState, useEffect } from "react";

export function useCartItems(showNotification) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("alsadek-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("alsadek-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    const variantLabel = selectedVariant?.weightLabel || selectedVariant?.weight || "";
    const cartItemId =
      product.type === "bundle"
        ? `bundle-${product.id}`
        : `${product.id}-${variantLabel}`;

    let maxQty = 9999;
    if (product.type === "bundle") {
      const bs = Number(product.bundleStock);
      maxQty = Number.isFinite(bs) ? Math.max(0, bs) : 9999;
    } else if (product.type === "single" && product.stock) {
      const currentGrams = Number(product.stock.currentStockGrams) || 0;
      const variantGrams = Number(selectedVariant?.grams) || 1;
      maxQty = Math.floor(currentGrams / variantGrams);
    }

    const price =
      product.type === "bundle"
        ? Number(product.price) || 0
        : Number(selectedVariant?.price) || Number(product.price) || 0;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, maxQty);
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: newQty, maxQty } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          image: product.images?.[0] || null,
          type: product.type,
          weight: variantLabel || null,
          price,
          quantity: Math.min(quantity, maxQty),
          maxQty,
          slug: product.slug,
        },
      ];
    });

    showNotification("Added to cart successfully!");
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    showNotification("Item removed from cart", "info");
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) { removeFromCart(cartItemId); return; }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        return { ...item, quantity: Math.min(newQuantity, item.maxQty ?? 9999) };
      })
    );
  };

  const clearItems = () => {
    setCartItems([]);
    localStorage.removeItem("alsadek-cart");
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { cartItems, cartCount, subtotal, addToCart, removeFromCart, updateQuantity, clearItems };
}
