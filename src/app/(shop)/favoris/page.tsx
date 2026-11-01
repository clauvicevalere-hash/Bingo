"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard, type CardProduct } from "@/components/ProductCard";
import { readWishlist } from "@/lib/wishlist";

export default function WishlistPage() {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = readWishlist();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Mes favoris</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Vos produits enregistrés sur cet appareil.
      </p>

      {loading ? <p className="muted">Chargement…</p> : null}

      {!loading && products.length === 0 ? (
        <div className="panel" style={{ textAlign: "center" }}>
          <p className="muted">Aucun favori pour le moment.</p>
          <Link className="btn btn-primary" href="/catalogue">Découvrir le catalogue</Link>
        </div>
      ) : null}

      <div className="products">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
