"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCart, removeLine, setQty, writeCart, type CartLine } from "@/lib/cart";
import { money } from "@/lib/site";

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
    const onChange = () => setLines(readCart());
    window.addEventListener("cart:change", onChange);
    return () => window.removeEventListener("cart:change", onChange);
  }, []);

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  if (!ready) return <div className="container" style={{ padding: "40px 0" }}>Chargement…</div>;

  if (lines.length === 0) {
    return (
      <div className="container">
        <h1 className="page-title">Mon panier</h1>
        <div className="empty" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 40 }}>🛒</div>
          <h3>Votre panier est vide</h3>
          <p className="muted">Parcourez le catalogue et ajoutez vos produits.</p>
          <Link href="/catalogue" className="btn btn-primary" style={{ marginTop: 12 }}>
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Mon panier</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {count} article(s) · le stock est réservé à la validation de la commande.
      </p>

      <div className="cart-layout">
        <div className="panel">
          {lines.map((l) => (
            <div className="cart-item" key={`${l.productId}:${l.variantId ?? 0}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image || "/placeholder.svg"} alt={l.name} />
              <div>
                <h4>
                  <Link href={`/p/${l.slug}`}>{l.name}</Link>
                </h4>
                {l.variantLabel ? <div className="muted tiny">{l.variantLabel}</div> : null}
                <div className="price" style={{ fontSize: 15, marginTop: 4 }}>
                  {money(l.price)}
                </div>
                <div className="qty" style={{ marginTop: 8, width: "fit-content" }}>
                  <button type="button" onClick={() => setQty(l.productId, l.variantId, l.qty - 1)} aria-label="Diminuer">
                    −
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.productId, l.variantId, l.qty + 1)} aria-label="Augmenter">
                    +
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price" style={{ fontSize: 15 }}>{money(l.price * l.qty)}</div>
                <button
                  type="button"
                  onClick={() => removeLine(l.productId, l.variantId)}
                  style={{ border: 0, background: "none", color: "var(--muted)", fontSize: 12.5, marginTop: 8 }}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <Link href="/catalogue" className="small" style={{ fontWeight: 700 }}>
              ← Continuer mes achats
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm("Vider le panier ?")) {
                  writeCart([]);
                }
              }}
              className="small muted"
              style={{ border: 0, background: "none" }}
            >
              Vider le panier
            </button>
          </div>
        </div>

        <div className="sticky">
          <div className="panel">
            <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>Récapitulatif</h3>
            <div className="summary-row">
              <span>Sous-total</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="summary-row">
              <span>Livraison</span>
              <span className="muted">calculée à l&apos;étape suivante</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>
            <Link href="/commande" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
              Passer la commande
            </Link>
            <p className="muted tiny" style={{ marginTop: 10, textAlign: "center" }}>
              Paiement à la livraison ou Orange Money
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
