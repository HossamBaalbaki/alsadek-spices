"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";

// ─── DELIVERY ZONES DATA ───────────────────────────
export const deliveryZones = [];


const DEFAULT_FREE_DELIVERY_THRESHOLD = 200;

// ─── CREATE CONTEXT ───────────────────────────
const CartContext = createContext();

// ─── PROVIDER COMPONENT ───────────────────────────
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("alsadek-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [promoCode, setPromoCode] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [selectedZone, setSelectedZone] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("alsadek-selected-zone");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [notification, setNotification] = useState(null);
  const [flyEvents, setFlyEvents] = useState([]);
  const [dynamicZones, setDynamicZones] = useState([]);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    DEFAULT_FREE_DELIVERY_THRESHOLD
  );

  useEffect(() => {
    let mounted = true;

    const loadSettingsAndZones = async () => {
      try {
        const [settingsRes, zonesRes] = await Promise.all([
          fetch("/api/site-settings"),
          fetch("/api/delivery-zones"),
        ]);

        const settingsData = await settingsRes.json();
        const zonesData = await zonesRes.json();

        if (!mounted) return;

        const threshold = Number(settingsData?.data?.freeDeliveryThreshold);
        if (Number.isFinite(threshold) && threshold >= 0) {
          setFreeDeliveryThreshold(threshold);
        } else {
          setFreeDeliveryThreshold(DEFAULT_FREE_DELIVERY_THRESHOLD);
        }

        const zones = Array.isArray(zonesData?.data)
          ? zonesData.data.filter((z) => z.active)
          : [];
        setDynamicZones(zones);

        if (selectedZone) {
          const matched = zones.find((z) => z.id === selectedZone.id);
          if (matched) setSelectedZone(matched);
          else setSelectedZone(null);
        }
      } catch {
        if (mounted) {
          setFreeDeliveryThreshold(DEFAULT_FREE_DELIVERY_THRESHOLD);
          setDynamicZones([]);
        }
      }
    };

    loadSettingsAndZones();
    return () => {
      mounted = false;
    };
  }, []);

  // ─── SAVE CART TO BROWSER ───────────────────────────
  useEffect(() => {
    localStorage.setItem("alsadek-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ─── SAVE SELECTED ZONE TO BROWSER ───────────────────────────
  useEffect(() => {
    if (selectedZone) {
      localStorage.setItem("alsadek-selected-zone", JSON.stringify(selectedZone));
    } else {
      localStorage.removeItem("alsadek-selected-zone");
    }
  }, [selectedZone]);

  // ─── SHOW NOTIFICATION ───────────────────────────
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── FLY TO CART ANIMATION ───────────────────────────
  const triggerFly = (sourceRect) => {
    if (typeof window === "undefined" || !sourceRect) return;
    const cartIcon = document.getElementById("nav-cart-icon");
    if (!cartIcon) return;
    const cartRect = cartIcon.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    setFlyEvents((prev) => [
      ...prev,
      {
        id,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        endX: cartRect.left + cartRect.width / 2,
        endY: cartRect.top + cartRect.height / 2,
      },
    ]);
    setTimeout(() => setFlyEvents((prev) => prev.filter((e) => e.id !== id)), 900);
  };

  // ─── ADD TO CART ───────────────────────────
  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    const variantLabel = selectedVariant?.weightLabel || selectedVariant?.weight || "";
    const cartItemId =
      product.type === "bundle"
        ? `bundle-${product.id}`
        : `${product.id}-${variantLabel}`;

    // Compute max orderable quantity from live stock data
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
      const existingItem = prev.find((item) => item.cartItemId === cartItemId);

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + quantity, maxQty);
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQty, maxQty }
            : item
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

  // ─── REMOVE FROM CART ───────────────────────────
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId)
    );
    showNotification("Item removed from cart", "info");
  };

  // ─── UPDATE QUANTITY ───────────────────────────
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const max = item.maxQty ?? 9999;
        return { ...item, quantity: Math.min(newQuantity, max) };
      })
    );
  };

  // ─── CLEAR CART ───────────────────────────
  const clearCart = () => {
    setCartItems([]);
    setPromoCode(null);
    setPromoError("");
    setPromoSuccess("");
    setSelectedZone(null);
    localStorage.removeItem("alsadek-cart");
    localStorage.removeItem("alsadek-selected-zone");
  };

  // ─── APPLY PROMO CODE ───────────────────────────
  const applyPromoCode = async (code) => {
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPromoError(data.message || "Invalid or expired promo code");
        return false;
      }

      const normalizedPromo = {
        code: data.data.code,
        type: data.data.type,
        value: Number(data.data.value) || 0,
        minOrder: Number(data.data.minOrder) || 0,
        active: true,
      };

      setPromoCode(normalizedPromo);
      setPromoSuccess(data.message || "Promo code applied successfully!");
      return true;
    } catch (error) {
      console.error("Apply promo error:", error);
      setPromoError("Network error. Please try again.");
      return false;
    }
  };

  // ─── REMOVE PROMO CODE ───────────────────────────
  const removePromoCode = () => {
    setPromoCode(null);
    setPromoError("");
    setPromoSuccess("");
  };

  // ─── CALCULATIONS ───────────────────────────

  // Total number of items in cart
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal before delivery and discount
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const FREE_DELIVERY_THRESHOLD = useMemo(
    () => freeDeliveryThreshold,
    [freeDeliveryThreshold]
  );

  // Delivery fee
  const deliveryFee = () => {
    // Must select zone first, otherwise fee is hidden as 0 (not free)
    if (!selectedZone) return 0;

    // Free delivery promo code
    if (promoCode?.type === "free_delivery") return 0;

    // Free delivery threshold (applies only after zone selection)
    if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;

    // Selected zone price
    return Number(selectedZone.price) || 0;
  };

  // Discount amount
  const discountAmount = () => {
    if (!promoCode) return 0;
    if (promoCode.type === "percentage") {
      return (subtotal * promoCode.value) / 100;
    }
    if (promoCode.type === "fixed") {
      return promoCode.value;
    }
    return 0;
  };

  // Grand total
  const grandTotal = subtotal + deliveryFee() - discountAmount();

  // How much more to get free delivery
  const amountToFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal
  );

  // Free delivery progress percentage
  const freeDeliveryProgress = Math.min(
    100,
    (subtotal / FREE_DELIVERY_THRESHOLD) * 100
  );

  return (
    <CartContext.Provider
      value={{
        // Cart Items
        cartItems,
        cartCount,

        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,

        // Promo Code
        promoCode,
        promoError,
        promoSuccess,
        applyPromoCode,
        removePromoCode,

        // Delivery
        selectedZone,
        setSelectedZone,
        deliveryZones: dynamicZones,
        deliveryFee: deliveryFee(),

        // Calculations
        subtotal,
        discountAmount: discountAmount(),
        grandTotal,
        amountToFreeDelivery,
        freeDeliveryProgress,
        FREE_DELIVERY_THRESHOLD,

        // Notifications
        notification,
        showNotification,

        // Fly animation
        flyEvents,
        triggerFly,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── CUSTOM HOOK ───────────────────────────
// Use this in any component like:
// const { cartItems, addToCart, cartCount } = useCart();
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}