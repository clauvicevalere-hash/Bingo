"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sessionId() {
  try {
    const key = "te_session";
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "";
  }
}

function track(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ ...payload, session: sessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    // silencieux
  }
}

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    track({ type: "page_view", path: pathname });
  }, [pathname]);

  return null;
}

export function ProductTracker({ productId }: { productId: number }) {
  useEffect(() => {
    track({ type: "product_view", productId, path: `/p/${productId}` });
  }, [productId]);
  return null;
}
