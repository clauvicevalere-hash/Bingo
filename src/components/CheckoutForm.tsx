"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearCart, readCart, type CartLine } from "@/lib/cart";
import { COUNTRIES, countryByCode, money } from "@/lib/site";

type City = { id: number; countryCode: string; name: string; deliveryFee: number; freeAbove: number | null };

export function CheckoutForm({
  defaultCountry,
  cities,
  orangeEnabled,
  orangeMock,
}: {
  defaultCountry: string;
  cities: City[];
  orangeEnabled: boolean;
  orangeMock: boolean;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [country, setCountry] = useState(defaultCountry);
  const [cityName, setCityName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<"COD" | "ORANGE_MONEY">("COD");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
    window.addEventListener("cart:change", () => setLines(readCart()));
  }, []);

  const countryCities = useMemo(
    () => cities.filter((c) => c.countryCode === country),
    [cities, country]
  );
  useEffect(() => {
    if (!countryCities.some((c) => c.name === cityName)) {
      setCityName(countryCities[0]?.name ?? "");
    }
  }, [countryCities, cityName]);

  const city = countryCities.find((c) => c.name === cityName);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const freeDelivery = Boolean(city?.freeAbove && subtotal >= city.freeAbove);
  const deliveryFee = freeDelivery ? 0 : city?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const info = countryByCode(country);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lines.length === 0) {
      setError("Votre panier est vide.");
      return;
    }
    if (name.trim().length < 2) return setError("Indiquez votre nom complet.");
    if (!/^[0-9 +().-]{8,20}$/.test(phone.trim())) return setError("Numéro de téléphone invalide.");
    if (!city) return setError("Choisissez une ville de livraison.");
    if (address.trim().length < 6) return setError("Adresse de livraison trop courte.");

    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: country,
          city: city.name,
          customerName: name.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          address: address.trim(),
          note: note.trim(),
          paymentMethod: payment,
          items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Impossible de passer la commande.");
        setBusy(false);
        return;
      }
      clearCart();
      router.push(payment === "ORANGE_MONEY" ? `/paiement/${data.number}` : `/commande/${data.number}`);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setBusy(false);
    }
  }

  if (!ready) return <p style={{ padding: 30 }}>Chargement…</p>;

  if (lines.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 40 }}>🛒</div>
        <h3>Panier vide</h3>
        <p className="muted">Ajoutez un produit avant de commander.</p>
        <Link href="/catalogue" className="btn btn-primary" style={{ marginTop: 12 }}>
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cart-layout">
      <div>
        <div className="panel">
          <h3 style={{ margin: "0 0 14px", fontSize: 17 }}>Coordonnées</h3>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">Nom complet *</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Awa Traoré" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Téléphone *</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`${info.dialCode} XX XX XX XX`}
                inputMode="tel"
                required
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="country">Pays de livraison *</label>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Ville *</label>
              <select id="city" value={cityName} onChange={(e) => setCityName(e.target.value)} required>
                {countryCities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} — {money(c.deliveryFee)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="address">Adresse de livraison *</label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quartier, rue, repère (ex. à côté de la pharmacie)"
              required
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp (facultatif)</label>
              <input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Même numéro" />
            </div>
            <div className="field">
              <label htmlFor="note">Note (facultatif)</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. appeler avant de venir" />
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>Paiement</h3>
          <label className={`pay-option${payment === "COD" ? " active" : ""}`}>
            <input type="radio" name="pay" checked={payment === "COD"} onChange={() => setPayment("COD")} />
            <span>
              <b>Paiement à la livraison</b>
              <small>Vous payez en espèces au livreur, après vérification du colis.</small>
            </span>
          </label>
          <label
            className={`pay-option${payment === "ORANGE_MONEY" ? " active" : ""}`}
            style={orangeEnabled ? undefined : { opacity: 0.6, cursor: "not-allowed" }}
          >
            <input
              type="radio"
              name="pay"
              checked={payment === "ORANGE_MONEY"}
              onChange={() => setPayment("ORANGE_MONEY")}
              disabled={!orangeEnabled}
            />
            <span>
              <b>Orange Money</b>
              <small>
                {orangeEnabled
                  ? orangeMock
                    ? "Mode test : paiement simulé, aucun débit réel."
                    : "Payez depuis votre compte Orange Money, en toute sécurité."
                  : "Bientôt disponible — en attente du compte marchand Orange."}
              </small>
            </span>
          </label>
          <p className="muted tiny" style={{ marginBottom: 0 }}>
            {orangeEnabled
              ? "Vous serez redirigé vers la page de paiement Orange pour valider."
              : "Le paiement mobile Orange Money sera activé dès validation du compte marchand."}
          </p>
        </div>
      </div>

      <div className="sticky">
        <div className="panel">
          <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>Votre commande</h3>
          {lines.map((l) => (
            <div key={`${l.productId}:${l.variantId ?? 0}`} style={{ display: "flex", gap: 10, padding: "7px 0", fontSize: 13.5 }}>
              <span style={{ flex: 1 }}>
                {l.name} {l.variantLabel ? <span className="muted">· {l.variantLabel}</span> : null} × {l.qty}
              </span>
              <b>{money(l.price * l.qty)}</b>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 10 }}>
            <div className="summary-row">
              <span>Sous-total</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="summary-row">
              <span>Livraison ({cityName || "—"})</span>
              <b>{freeDelivery ? "Offerte" : money(deliveryFee)}</b>
            </div>
            {city?.freeAbove && !freeDelivery ? (
              <p className="muted tiny" style={{ margin: "0 0 4px" }}>
                Livraison offerte dès {money(city.freeAbove)} d&apos;achat.
              </p>
            ) : null}
            <div className="summary-row total">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          {error ? <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p> : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 12 }}>
            {busy ? "Envoi en cours…" : `Confirmer la commande · ${money(total)}`}
          </button>
          <p className="muted tiny" style={{ textAlign: "center", marginBottom: 0 }}>
            En confirmant, vous acceptez nos conditions de vente.
          </p>
        </div>
      </div>
    </form>
  );
}
