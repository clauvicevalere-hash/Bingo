import { COUNTRIES } from "./constants";

export { COUNTRIES };

export type CountryCode = "BF" | "ML" | "NE" | "CI";

export const DEFAULT_COUNTRY: CountryCode = "BF";

export function countryByCode(code?: string | null) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function isCountry(code?: string | null): code is CountryCode {
  return COUNTRIES.some((c) => c.code === code);
}

export function money(amount: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

export function discountPercent(price: number, oldPrice?: number | null) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 70);
}

export function stripHtml(input: string) {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
