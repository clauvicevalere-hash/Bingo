"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CategoryForm({ parents }: { parents: { id: number; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [icon, setIcon] = useState("📦");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId ? Number(parentId) : null, icon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Création impossible.");
        setBusy(false);
        return;
      }
      setName("");
      setBusy(false);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel" style={{ marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Nouvelle catégorie</h3>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="cat-name">Nom *</label>
          <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Accessoires voiture" required />
        </div>
        <div className="field">
          <label htmlFor="cat-parent">Rayon parent (facultatif)</label>
          <select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Aucun (rayon principal)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field" style={{ maxWidth: 160 }}>
        <label htmlFor="cat-icon">Icône (emoji)</label>
        <input id="cat-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
      </div>
      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Création…" : "Créer la catégorie"}
      </button>
    </form>
  );
}
