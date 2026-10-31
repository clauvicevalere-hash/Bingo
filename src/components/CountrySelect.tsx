"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COUNTRIES } from "@/lib/site";

export function CountrySelect({ current, compact = false }: { current: string; compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  async function change(code: string) {
    setValue(code);
    await fetch("/api/country", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <label className="country-pill" title="Pays de livraison">
      <span aria-hidden>{COUNTRIES.find((c) => c.code === value)?.flag}</span>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        aria-label="Pays de livraison"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {compact ? c.code : c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
