"use client";

import { useEffect, useState } from "react";
import { cartCount, readCart, type CartLine } from "@/lib/cart";

export function CartBadge({ className = "icon-btn" }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(cartCount(readCart()));
    update();
    window.addEventListener("cart:change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cart:change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <a href="/panier" className={className} aria-label="Panier">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 7h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 && <span className="badge-count">{count}</span>}
    </a>
  );
}

export function CartCountText({ lines }: { lines: CartLine[] }) {
  return <>{cartCount(lines)} article(s)</>;
}
