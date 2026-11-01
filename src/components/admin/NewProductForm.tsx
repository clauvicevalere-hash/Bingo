"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computePrice, type PricingDefaults, type ProfitMode } from "@/lib/pricing";
import { computeOldPrice, type OldPriceMode } from "@/lib/marketing";

type Option = { id: number; name: string; parent?: string };

export function NewProductForm({
  categories,
  pricing,
  rate,
}: {
  categories: Option[];
  pricing: Record<number, PricingDefaults>;
  rate: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [supplierPriceAed, setSupplierPriceAed] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [logisticsCost, setLogisticsCost] = useState("0");
  const [profitMode, setProfitMode] = useState<ProfitMode>("percent");
  const [profitValue, setProfitValue] = useState("0");
  const [minProfit, setMinProfit] = useState("0");
  const [maxProfit, setMaxProfit] = useState("0");
  const [roundTo, setRoundTo] = useState("500");
  const [manual, setManual] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [oldPriceMode, setOldPriceMode] = useState<OldPriceMode>("none");
  const [oldPriceValue, setOldPriceValue] = useState("30");
  const [showOldPrice, setShowOldPrice] = useState(false);
  const [showDiscountBadge, setShowDiscountBadge] = useState(true);

  const defaults = categoryId ? pricing[Number(categoryId)] : undefined;

  function applyCategory(id: number) {
    setCategoryId(id);
    const d = pricing[id];
    if (!d) return;
    setLogisticsCost(String(d.logistics));
    setProfitMode(d.mode);
    setProfitValue(String(d.value));
    setMinProfit(String(d.min));
    setMaxProfit(String(d.max));
    setRoundTo(String(d.roundTo));
  }

  const result = useMemo(() => {
    const cost = Number(supplierPriceAed);
    if (!cost || cost <= 0) return null;
    return computePrice({
      costAed: cost,
      rate,
      logistics: Number(logisticsCost) || 0,
      mode: profitMode,
      value: Number(profitValue) || 0,
      minProfit: Number(minProfit) || 0,
      maxProfit: Number(maxProfit) || 0,
      roundTo: Number(roundTo) || 500,
      tiers: defaults?.tiers,
    });
  }, [supplierPriceAed, rate, logisticsCost, profitMode, profitValue, minProfit, maxProfit, roundTo, defaults]);

  const finalPrice = manual ? Number(manualPrice) || 0 : result?.price || 0;
  const oldPreview = computeOldPrice(
    finalPrice,
    oldPriceMode,
    Number(oldPriceValue) || 0,
    Number(roundTo) || 500
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    if (manual) form.set("pricingMode", "manual");
    else form.set("pricingMode", "auto");
    if (manual) form.set("price", manualPrice);
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

  const money = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";

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
            <select
              id="p-cat"
              name="categoryId"
              required
              value={categoryId}
              onChange={(e) => applyCategory(Number(e.target.value))}
            >
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
        <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Prix intelligent</h3>
        <p className="muted tiny" style={{ marginTop: 0 }}>
          Saisissez le prix fournisseur en AED et la logistique : le prix de vente est calculé
          selon la politique du rayon. Vous pouvez forcer un prix manuel.
        </p>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="p-supplier">Prix fournisseur (AED) *</label>
            <input
              id="p-supplier"
              name="supplierPriceAed"
              type="number"
              min={0}
              step="0.01"
              value={supplierPriceAed}
              onChange={(e) => setSupplierPriceAed(e.target.value)}
              placeholder="Ex. 499"
            />
          </div>
          <div className="field">
            <label htmlFor="p-logistics">Fret + douane (FCFA)</label>
            <input
              id="p-logistics"
              name="logisticsCost"
              type="number"
              min={0}
              step={500}
              value={logisticsCost}
              onChange={(e) => setLogisticsCost(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="p-market">Prix du marché (FCFA, optionnel)</label>
            <input
              id="p-market"
              name="marketPrice"
              type="number"
              min={0}
              step={500}
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              placeholder="Prix constaté chez la concurrence"
            />
          </div>
          <div className="field">
            <label htmlFor="p-mode">Bénéfice</label>
            <select
              id="p-mode"
              name="profitMode"
              value={profitMode}
              onChange={(e) => setProfitMode(e.target.value as ProfitMode)}
            >
              <option value="percent">Pourcentage du coût rendu</option>
              <option value="fixed">Montant fixe (FCFA)</option>
              <option value="tiered">Par tranche (téléphones)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-profit">Valeur du bénéfice</label>
            <input
              id="p-profit"
              name="profitValue"
              type="number"
              min={0}
              step={profitMode === "percent" ? 1 : 500}
              value={profitValue}
              onChange={(e) => setProfitValue(e.target.value)}
              disabled={profitMode === "tiered"}
            />
          </div>
        </div>

        {profitMode === "tiered" && defaults?.tiers ? (
          <p className="muted tiny" style={{ marginTop: 0 }}>
            Tranches : {defaults.tiers
              .map((t) => (t.max > 0 ? `≤ ${money(t.max)} → ${money(t.margin)}` : `> ${money(defaults.tiers![defaults.tiers!.length - 2]?.max ?? 0)} → ${money(t.margin)}`))
              .join(" · ")}
          </p>
        ) : null}

        <input type="hidden" name="minProfit" value={minProfit} />
        <input type="hidden" name="maxProfit" value={maxProfit} />
        <input type="hidden" name="roundTo" value={roundTo} />

        {defaults ? (
          <p className="muted tiny" style={{ marginTop: 0 }}>
            Politique du rayon : logistique {money(defaults.logistics)} · bénéfice{" "}
            {defaults.mode === "percent" ? `${defaults.value} %` : money(defaults.value)}
            {defaults.min ? ` · mini ${money(defaults.min)}` : ""}
            {defaults.max ? ` · maxi ${money(defaults.max)}` : ""}
          </p>
        ) : null}

        {result ? (
          <div className="notice" style={{ marginBottom: 12 }}>
            Coût rendu <b>{money(result.landed)}</b> · bénéfice <b>{money(result.profit)}</b> ·{" "}
            <b style={{ fontSize: 18 }}>prix conseillé {money(result.price)}</b>
            {Number(marketPrice) > 0 ? (
              <>
                <br />
                Marge au prix du marché ({money(Number(marketPrice))}) :{" "}
                <b style={{ color: Number(marketPrice) - result.landed < 0 ? "var(--danger)" : "var(--ok)" }}>
                  {money(Number(marketPrice) - result.landed)}
                </b>
              </>
            ) : null}
          </div>
        ) : null}

        <label className="small" style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
          Forcer un prix manuel
        </label>
        {manual ? (
          <div className="field" style={{ maxWidth: 260 }}>
            <label htmlFor="p-price">Prix de vente (FCFA) *</label>
            <input
              id="p-price"
              name="price"
              type="number"
              min={100}
              step={50}
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              required
            />
          </div>
        ) : null}
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Prix barré (marketing)</h3>
        <p className="muted tiny" style={{ marginTop: 0 }}>
          Facultatif. Le prix barré n&apos;entre pas dans le calcul du prix de vente : il sert
          uniquement à afficher une référence et, si vous le souhaitez, un badge de réduction.
        </p>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="p-oldmode">Type de prix barré</label>
            <select
              id="p-oldmode"
              name="oldPriceMode"
              value={oldPriceMode}
              onChange={(e) => setOldPriceMode(e.target.value as OldPriceMode)}
            >
              <option value="none">Aucun prix barré</option>
              <option value="percent">Pourcentage au-dessus du prix</option>
              <option value="fixed">Montant fixe</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-oldvalue">
              {oldPriceMode === "percent" ? "Pourcentage (%)" : "Montant (FCFA)"}
            </label>
            <input
              id="p-oldvalue"
              name="oldPriceValue"
              type="number"
              min={0}
              step={oldPriceMode === "percent" ? 1 : 500}
              value={oldPriceValue}
              onChange={(e) => setOldPriceValue(e.target.value)}
              disabled={oldPriceMode === "none"}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 8 }}>
          <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              type="checkbox"
              name="showOldPrice"
              checked={showOldPrice}
              onChange={(e) => setShowOldPrice(e.target.checked)}
              disabled={oldPriceMode === "none"}
            />{" "}
            Afficher le prix barré
          </label>
          <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              type="checkbox"
              name="showDiscountBadge"
              checked={showDiscountBadge}
              onChange={(e) => setShowDiscountBadge(e.target.checked)}
              disabled={oldPriceMode === "none"}
            />{" "}
            Afficher le badge -X %
          </label>
        </div>
        {oldPriceMode !== "none" ? (
          <p className="muted tiny" style={{ margin: 0 }}>
            Prix barré calculé : <b>{oldPreview ? money(oldPreview) : "aucun (valeur trop basse)"}</b>
            {oldPreview && finalPrice ? ` · badge -${Math.round(((oldPreview - finalPrice) / oldPreview) * 100)} %` : ""}
          </p>
        ) : null}
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
