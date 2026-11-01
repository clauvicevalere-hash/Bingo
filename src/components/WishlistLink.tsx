"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readWishlist } from "@/lib/wishlist";

export function WishlistLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(readWishlist().length);
    update();
    window.addEventListener("wishlist:change", update);
    return () => window.removeEventListener("wishlist:change", update);
  }, []);

  return (
    <Link href="/favoris" className="cart-link" aria-label="Mes favoris" style={{ position: "relative" }}>
      <span aria-hidden style={{ fontSize: 20 }}>♡</span>
      {count > 0 ? (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            background: "var(--brand)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            minWidth: 16,
            height: 16,
            display: "grid",
            placeItems: "center",
            padding: "0 4px",
          }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
