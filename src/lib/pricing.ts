import rawDefaults from "./pricing-defaults.json";

export type ProfitMode = "percent" | "fixed";

export type PricingDefaults = {
  logistics: number;
  mode: ProfitMode;
  value: number;
  min: number;
  max: number;
  roundTo: number;
};

/**
 * Politique de prix par rayon, définie dans pricing-defaults.json.
 * - téléphones : 10 000 F de fret/douane, marge 10 % encadrée entre 15 000 et 25 000 F
 * - ordinateurs : 15 000 F de logistique, 12 % de marge (mini 25 000 F)
 * - accessoires : pas de fret unitaire, 25 % de marge
 */
export const CATEGORY_PRICING = rawDefaults as unknown as Record<string, PricingDefaults>;

export const FALLBACK_PRICING: PricingDefaults = {
  logistics: 0,
  mode: "percent",
  value: 30,
  min: 1000,
  max: 0,
  roundTo: 500,
};

export function defaultsFor(rootSlug?: string | null): PricingDefaults {
  if (rootSlug && CATEGORY_PRICING[rootSlug]) return CATEGORY_PRICING[rootSlug];
  return FALLBACK_PRICING;
}

export function priceRate() {
  return Number(process.env.PRICE_RATE || 165);
}

export type PricingInput = {
  costAed: number;
  rate?: number;
  logistics: number;
  mode: ProfitMode;
  value: number;
  minProfit: number;
  maxProfit: number;
  roundTo: number;
};

export type PricingResult = {
  landed: number;
  profit: number;
  raw: number;
  price: number;
};

export function computePrice(input: PricingInput): PricingResult {
  const rate = input.rate ?? priceRate();
  const costXof = Math.max(0, input.costAed) * rate;
  // Le fret forfaitaire ne peut pas dépasser 20 % de la valeur du produit :
  // les petits articles ne portent pas 10 000 F de transport.
  const logistics =
    input.logistics > 0 ? Math.min(input.logistics, costXof * 0.2) : 0;
  const landed = costXof + logistics;

  let profit =
    input.mode === "fixed" ? Math.max(0, input.value) : (landed * Math.max(0, input.value)) / 100;

  // La marge minimale est plafonnée à 40 % du coût rendu pour éviter
  // des prix absurdes sur les articles à faible valeur.
  const floor = input.minProfit > 0 ? Math.min(input.minProfit, landed * 0.4) : 0;
  if (floor > 0) profit = Math.max(profit, floor);
  if (input.maxProfit > 0) profit = Math.min(profit, input.maxProfit);

  const raw = landed + profit;
  const step = Math.max(1, input.roundTo);
  const price = Math.max(500, Math.round(raw / step) * step);

  return {
    landed: Math.round(landed),
    profit: Math.round(profit),
    raw: Math.round(raw),
    price,
  };
}
