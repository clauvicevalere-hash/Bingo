"use client";

import { useEffect, useState } from "react";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";

export function WishlistButton({ productId, large = false }: { productId: number; large?: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isWishlisted(productId));
    const onChange = () => setActive(isWishlisted(productId));
    window.addEventListener("wishlist:change", onChange);
    return () => window.removeEventListener("wishlist:change", onChange);
  }, [productId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActive(toggleWishlist(productId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        border: "1px solid var(--line)",
        background: "#fff",
        color: active ? "var(--brand)" : "var(--muted)",
        borderRadius: 999,
        width: large ? 44 : 34,
        height: large ? 44 : 34,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        fontSize: large ? 20 : 16,
        boxShadow: "0 2px 8px rgba(10,18,64,.12)",
      }}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
