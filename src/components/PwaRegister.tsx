"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const secure = location.protocol === "https:" || location.hostname === "localhost";
    if (!secure) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silencieux */
    });
  }, []);
  return null;
}
