"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImageManager({ productId, images }: { productId: number; images: { id: number; url: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    const form = new FormData();
    form.append("productId", String(productId));
    form.append("image", file);
    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data?.error || "Envoi impossible.");
      else router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette image ?")) return;
    setError("");
    const res = await fetch(`/api/admin/images?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Images</h3>
      <p className="muted tiny" style={{ marginTop: 0 }}>
        La première image sert de visuel principal. JPG, PNG ou WebP, max 8 Mo.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              style={{ width: 82, height: 82, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}
            />
            <button
              type="button"
              onClick={() => remove(img.id)}
              aria-label="Supprimer"
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: 0,
                background: "var(--danger)",
                color: "#fff",
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
        {images.length === 0 && <span className="muted tiny">Aucune image.</span>}
      </div>

      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}

      <label className="btn btn-primary" style={{ display: "inline-flex", cursor: busy ? "wait" : "pointer" }}>
        {busy ? "Envoi…" : "+ Ajouter une image"}
        <input type="file" accept="image/*" onChange={upload} disabled={busy} style={{ display: "none" }} />
      </label>
    </div>
  );
}
