"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";

function FlyParticle({ event }) {
  const dx = event.endX - event.startX;
  const dy = event.endY - event.startY;

  return (
    // Outer div handles horizontal movement
    <div
      style={{
        position: "fixed",
        left: event.startX,
        top: event.startY,
        zIndex: 99999,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        "--fly-dx": `${dx}px`,
        "--fly-dy": `${dy}px`,
        animation: "fly-arc-x 0.8s linear forwards",
      }}
    >
      {/* Inner div handles vertical arc movement */}
      <div
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fcd34d, #b45309)",
          boxShadow: "0 2px 8px rgba(180,83,9,0.5)",
          animation: "fly-arc-y 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards",
        }}
      />
    </div>
  );
}

export default function CartFlyAnimation() {
  const { flyEvents, notification } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {flyEvents.map((event) => (
        <FlyParticle key={event.id} event={event} />
      ))}

      {/* Toast notification */}
      {notification && (
        <div
          className={`cart-toast cart-toast-${notification.type}`}
          role="status"
          aria-live="polite"
        >
          {notification.type === "success" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {notification.type === "info" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </>,
    document.body
  );
}
