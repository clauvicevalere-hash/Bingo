/** Calcule le prix barré marketing à partir du prix de vente. */
export type OldPriceMode = "none" | "percent" | "fixed";

export function computeOldPrice(
  price: number,
  mode: OldPriceMode,
  value: number,
  roundTo = 500
): number | null {
  if (mode === "none" || !price) return null;
  const step = Math.max(1, roundTo);

  if (mode === "percent") {
    const pct = Math.max(0, value);
    if (!pct) return null;
    const raw = price * (1 + pct / 100);
    const rounded = Math.round(raw / step) * step;
    return rounded > price ? rounded : null;
  }

  const fixed = Math.round(Math.max(0, value));
  return fixed > price ? fixed : null;
}

export function discountPercent(price: number, oldPrice?: number | null) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
