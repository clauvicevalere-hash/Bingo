"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: number; name: string; parent?: string };

export function NewProductForm({ categories }: { categories: Option[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/products", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Création impossible.");
        setBusy(false);
        return;
      }
      router.push(`/admin/produits/${data.id}?ok=1`);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data">
      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Informations</h3>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="p-name">Nom du produit *</label>
            <input id="p-name" name="name" required placeholder="Ex. Samsung Galaxy A16 128 Go" />
          </div>
          <div className="field">
            <label htmlFor="p-cat">Catégorie *</label>
            <select id="p-cat" name="categoryId" required defaultValue="">
              <option value="" disabled>Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent ? `${c.parent} › ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-brand">Marque</label>
            <input id="p-brand" name="brand" placeholder="Ex. Samsung" />
          </div>
          <div className="field">
            <label htmlFor="p-cond">État</label>
            <select id="p-cond" name="condition" defaultValue="Neuf">
              <option>Neuf</option>
              <option>Occasion</option>
              <option>Reconditionné</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-price">Prix de vente (FCFA) *</label>
            <input id="p-price" name="price" type="number" min={100} step={50} required placeholder="150000" />
          </div>
          <div className="field">
            <label htmlFor="p-old">Ancien prix (barré)</label>
            <input id="p-old" name="oldPrice" type="number" min={0} step={50} placeholder="0" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="p-desc">Description</label>
          <textarea id="p-desc" name="description" rows={5} placeholder="Présentation, points forts, garantie…" />
        </div>
        <div className="field">
          <label htmlFor="p-specs">Fiche technique</label>
          <textarea id="p-specs" name="specs" rows={4} placeholder="Écran, stockage, batterie…" />
        </div>

        <div className="field">
          <label htmlFor="p-image">Photo (JPG/PNG/WebP, max 8 Mo)</label>
          <input
            id="p-image"
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ marginTop: 8, width: 120, height: 120, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 10 }} />
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input type="checkbox" name="active" defaultChecked /> Visible en boutique
          </label>
          <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input type="checkbox" name="featured" /> Mettre en avant
          </label>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Stock initial par pays</h3>
        <div className="grid-2">
          {[
            ["BF", "Burkina Faso"],
            ["ML", "Mali"],
            ["NE", "Niger"],
            ["CI", "Côte d'Ivoire"],
          ].map(([code, label]) => (
            <div className="field" key={code}>
              <label htmlFor={`stock_${code}`}>{label}</label>
              <input id={`stock_${code}`} name={`stock_${code}`} type="number" min={0} defaultValue={0} />
            </div>
          ))}
        </div>
      </div>

      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Création…" : "Créer le produit"}
      </button>
    </form>
  );
}
