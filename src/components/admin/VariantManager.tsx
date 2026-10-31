"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/site";

type Variant = {
  id: number;
  label: string;
  price: number;
  oldPrice: number | null;
  stocks: Record<string, number>;
};

const COUNTRIES = [
  ["BF", "Burkina"],
  ["ML", "Mali"],
  ["NE", "Niger"],
  ["CI", "Côte d'Ivoire"],
] as const;

export function VariantManager({ productId, variants }: { productId: number; variants: Variant[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stocks, setStocks] = useState<Record<string, string>>({ BF: "0", ML: "0", NE: "0", CI: "0" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          label,
          price: Number(price),
          oldPrice: Number(oldPrice || 0),
          stocks: Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, Number(v) || 0])),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Ajout impossible.");
        setBusy(false);
        return;
      }
      setLabel("");
      setPrice("");
      setOldPrice("");
      setStocks({ BF: "0", ML: "0", NE: "0", CI: "0" });
      setBusy(false);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette option ?")) return;
    setError("");
    const res = await fetch(`/api/admin/variants?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Options / variantes</h3>
      <p className="muted tiny" style={{ marginTop: 0 }}>
        Couleur, stockage, capacité… Chaque option a son prix et son stock par pays.
      </p>

      {variants.length > 0 ? (
        <table className="table" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>Option</th>
              <th>Prix</th>
              <th>Stock 4 pays</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const total = Object.values(v.stocks).reduce((n, q) => n + q, 0);
              return (
                <tr key={v.id}>
                  <td><b>{v.label}</b></td>
                  <td>
                    {money(v.price)}
                    {v.oldPrice ? <div className="muted tiny" style={{ textDecoration: "line-through" }}>{money(v.oldPrice)}</div> : null}
                  </td>
                  <td>
                    {total > 0 ? total : <span style={{ color: "var(--danger)" }}>0</span>}
                    <div className="muted tiny">
                      {COUNTRIES.map(([code]) => `${code}:${v.stocks[code] ?? 0}`).join(" · ")}
                    </div>
                  </td>
                  <td>
                    <button type="button" className="tab" onClick={() => remove(v.id)}>Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted small">Aucune option : le produit est vendu en version unique.</p>
      )}

      <form onSubmit={add} style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div className="grid-2">
          <div className="field">
            <label>Libellé *</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. 128 Go / Noir" required />
          </div>
          <div className="field">
            <label>Prix (FCFA) *</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={100} step={50} required />
          </div>
          <div className="field">
            <label>Ancien prix</label>
            <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} type="number" min={0} step={50} />
          </div>
        </div>
        <div className="grid-2">
          {COUNTRIES.map(([code, name]) => (
            <div className="field" key={code}>
              <label>{name}</label>
              <input
                type="number"
                min={0}
                value={stocks[code]}
                onChange={(e) => setStocks((s) => ({ ...s, [code]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Ajout…" : "Ajouter l'option"}
        </button>
      </form>
    </div>
  );
}
