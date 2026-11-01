"use client";

import { useEffect, useState } from "react";
import { ProductCard, type CardProduct } from "@/components/ProductCard";

const KEY = "te_recent";

export function RecentlyViewed({ currentId }: { currentId: number }) {
  const [products, setProducts] = useState<CardProduct[]>([]);

  useEffect(() => {
    let ids: number[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) ids = parsed.filter((n) => Number.isInteger(n));
    } catch {
      ids = [];
    }

    const next = [currentId, ...ids.filter((id) => id !== currentId)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));

    const others = next.filter((id) => id !== currentId).slice(0, 6);
    if (others.length === 0) return;

    fetch(`/api/products?ids=${others.join(",")}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]));
  }, [currentId]);

  if (products.length === 0) return null;

  return (
    <section style={{ marginTop: 28 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 20, margin: 0 }}>Récemment consultés</h2>
      </div>
      <div className="products">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
