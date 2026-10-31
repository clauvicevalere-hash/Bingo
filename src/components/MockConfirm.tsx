"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MockConfirm({ number, token }: { number: string; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/payments/orange/mock/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Échec de la simulation.");
        setBusy(false);
        return;
      }
      router.push(data.url || `/commande/${number}?paiement=ok`);
    } catch {
      setError("Erreur réseau.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-primary btn-block" onClick={confirm} disabled={busy}>
        {busy ? "Validation…" : "Confirmer le paiement (test)"}
      </button>
      {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}
    </div>
  );
}
