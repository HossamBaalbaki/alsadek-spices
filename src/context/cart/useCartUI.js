"use client";

import { useState } from "react";

export function useCartUI() {
  const [notification, setNotification] = useState(null);
  const [flyEvents, setFlyEvents] = useState([]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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

  return { notification, showNotification, flyEvents, triggerFly };
}
