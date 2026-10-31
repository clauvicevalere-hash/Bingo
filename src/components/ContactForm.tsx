"use client";

import { useState } from "react";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Envoi impossible.");
        setBusy(false);
        return;
      }
      setDone(true);
      setBusy(false);
    } catch {
      setError("Erreur réseau.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="notice" style={{ marginTop: 14 }}>
        Message envoyé. Nous vous répondons rapidement par WhatsApp ou par téléphone.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel" style={{ marginTop: 14 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Écrire un message</h3>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="c-name">Nom *</label>
          <input id="c-name" name="name" required minLength={2} />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Téléphone *</label>
          <input id="c-phone" name="phone" required placeholder="+226 70 00 00 00" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-email">E-mail (facultatif)</label>
        <input id="c-email" name="email" type="email" />
      </div>
      <div className="field">
        <label htmlFor="c-message">Message *</label>
        <textarea id="c-message" name="message" rows={5} required minLength={10} />
      </div>
      {error ? <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
