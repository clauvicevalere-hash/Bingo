"use client";

import { useState } from "react";

export function ReviewForm({ productId }: { productId: number }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, phone, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Envoi impossible.");
        setBusy(false);
        return;
      }
      setMessage(data.message);
      setName("");
      setPhone("");
      setComment("");
      setRating(5);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  if (message) {
    return <div className="notice">{message}</div>;
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12 }}>
      <div className="grid-2">
        <div className="field">
          <label>Votre nom *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </div>
        <div className="field">
          <label>Téléphone (non publié)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Facultatif" />
        </div>
      </div>
      <div className="field">
        <label>Note *</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              style={{
                border: "1px solid var(--line)",
                background: n <= rating ? "#fff3d6" : "#fff",
                color: n <= rating ? "#f5a623" : "#c9bda9",
                borderRadius: 8,
                width: 38,
                height: 38,
                fontSize: 19,
                cursor: "pointer",
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Votre avis *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Qualité, livraison, conformité…"
          required
        />
      </div>
      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Envoi…" : "Publier mon avis"}
      </button>
      <p className="muted tiny" style={{ marginTop: 6 }}>
        Les avis sont vérifiés avant publication.
      </p>
    </form>
  );
}
