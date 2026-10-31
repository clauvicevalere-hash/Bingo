"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addLine, trackAddToCart } from "@/lib/cart";
import { money } from "@/lib/site";

type Variant = {
  id: number;
  label: string;
  price: number;
  oldPrice: number | null;
  stock: number;
};

export function ProductPurchase({
  product,
  variants,
  baseStock,
  countryName,
}: {
  product: {
    id: number;
    slug: string;
    name: string;
    price: number;
    oldPrice: number | null;
    showOldPrice?: boolean;
    showDiscountBadge?: boolean;
    image: string;
  };
  variants: Variant[];
  baseStock: number;
  countryName: string;
}) {
  const router = useRouter();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<number | null>(firstAvailable?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = useMemo(() => variants.find((v) => v.id === variantId) ?? null, [variantId, variants]);
  const price = selected?.price ?? product.price;
  const oldPrice = selected?.oldPrice ?? product.oldPrice;
  const showOld = product.showOldPrice !== false && (oldPrice ?? 0) > price;
  const stock = selected ? selected.stock : baseStock;
  const max = Math.max(0, Math.min(stock, 10));

  function add(thenCheckout = false) {
    if (stock <= 0) return;
    addLine({
      productId: product.id,
      variantId: selected?.id ?? null,
      name: product.name,
      variantLabel: selected?.label ?? "",
      price,
      image: product.image,
      slug: product.slug,
      stock,
      qty,
    });
    trackAddToCart(product.id, price * qty);
    if (thenCheckout) {
      router.push("/commande");
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {variants.length > 0 && (
        <>
          <div className="option-label">Choisir une option</div>
          {variants.length > 6 ? (
            <select
              className="variant-select"
              value={variantId ?? ""}
              onChange={(e) => {
                setVariantId(Number(e.target.value));
                setQty(1);
              }}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                  {v.label} — {money(v.price)} {v.stock <= 0 ? "(épuisé)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="options">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock <= 0}
                  className={`option${v.id === variantId ? " active" : ""}`}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                >
                  {v.label} · {money(v.price)}
                </button>
              ))}
            </div>
          )}
          <div className="selected-price">
            <span className="muted small">Prix sélectionné</span>
            <b>{money(price)}</b>
            {showOld ? <span className="old-price">{money(oldPrice as number)}</span> : null}
          </div>
        </>
      )}

      <div className="buy-row">
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer">
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max || 1, q + 1))}
            aria-label="Augmenter"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={stock <= 0}
          onClick={() => add(false)}
        >
          {stock <= 0 ? "Rupture de stock" : added ? "Ajouté au panier ✓" : "Ajouter au panier"}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-dark btn-block"
        disabled={stock <= 0}
        onClick={() => add(true)}
      >
        Acheter maintenant · {money(price * qty)}
      </button>
      <p className="muted tiny" style={{ marginTop: 10, textAlign: "center" }}>
        {stock > 0
          ? `En stock — expédié depuis notre entrepôt ${countryName}`
          : "Indisponible dans ce pays pour le moment"}
      </p>
    </div>
  );
}
