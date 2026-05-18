"use client";

import { useState } from "react";

export function useCartPromo(subtotal) {
  const [promoCode, setPromoCode] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const applyPromoCode = async (code) => {
    setPromoError("");
    setPromoSuccess("");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPromoError(data.message || "Invalid or expired promo code");
        return false;
      }
      setPromoCode({
        code: data.data.code,
        type: data.data.type,
        value: Number(data.data.value) || 0,
        minOrder: Number(data.data.minOrder) || 0,
        active: true,
      });
      setPromoSuccess(data.message || "Promo code applied successfully!");
      return true;
    } catch {
      setPromoError("Network error. Please try again.");
      return false;
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setPromoError("");
    setPromoSuccess("");
  };

  const discountAmount = () => {
    if (!promoCode) return 0;
    if (promoCode.type === "percentage") return (subtotal * promoCode.value) / 100;
    if (promoCode.type === "fixed") return Math.min(promoCode.value, subtotal);
    return 0;
  };

  return {
    promoCode,
    promoError,
    promoSuccess,
    applyPromoCode,
    removePromoCode,
    discountAmount,
    clearPromo: removePromoCode,
  };
}
