"use client";

import { useState } from "react";
import { money } from "@/lib/site";

export function OrangePayButton({ number, amount }: { number: string; amount: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/payments/orange/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data?.error || "Paiement indisponible.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-primary btn-block" onClick={pay} disabled={busy}>
        {busy ? "Redirection…" : `Payer ${money(amount)} avec Orange Money`}
      </button>
      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 0 }}>{error}</p> : null}
    </div>
  );
}
