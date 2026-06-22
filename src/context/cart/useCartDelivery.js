"use client";

import { useState, useEffect, useMemo } from "react";

const DEFAULT_FREE_DELIVERY_THRESHOLD = 200;

export function useCartDelivery(subtotal, promoCode) {
  const [selectedZone, setSelectedZone] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("alsadek-selected-zone");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dynamicZones, setDynamicZones] = useState([]);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [settingsRes, zonesRes] = await Promise.all([
          fetch("/api/site-settings"),
          fetch("/api/delivery-zones"),
        ]);
        const [settingsData, zonesData] = await Promise.all([
          settingsRes.json(),
          zonesRes.json(),
        ]);
        if (!mounted) return;

        const threshold = Number(settingsData?.data?.freeDeliveryThreshold);
        setFreeDeliveryThreshold(
          Number.isFinite(threshold) && threshold >= 0
            ? threshold
            : DEFAULT_FREE_DELIVERY_THRESHOLD
        );
        setFreeDeliveryEnabled(settingsData?.data?.freeDeliveryEnabled !== false);

        const zones = Array.isArray(zonesData?.data)
          ? zonesData.data.filter((z) => z.active)
          : [];
        setDynamicZones(zones);

        if (selectedZone) {
          const matched = zones.find((z) => z.id === selectedZone.id);
          setSelectedZone(matched || null);
        }
      } catch {
        if (mounted) {
          setFreeDeliveryThreshold(DEFAULT_FREE_DELIVERY_THRESHOLD);
          setDynamicZones([]);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedZone) {
      localStorage.setItem("alsadek-selected-zone", JSON.stringify(selectedZone));
    } else {
      localStorage.removeItem("alsadek-selected-zone");
    }
  }, [selectedZone]);

  const FREE_DELIVERY_THRESHOLD = useMemo(() => freeDeliveryThreshold, [freeDeliveryThreshold]);

  const deliveryFee = () => {
    if (!selectedZone) return 0;
    if (promoCode?.type === "free_delivery") return 0;
    if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
    return Number(selectedZone.price) || 0;
  };

  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return {
    selectedZone,
    setSelectedZone,
    deliveryZones: dynamicZones,
    deliveryFee,
    amountToFreeDelivery,
    freeDeliveryProgress,
    freeDeliveryEnabled,
    FREE_DELIVERY_THRESHOLD,
    clearDelivery: () => setSelectedZone(null),
  };
}
