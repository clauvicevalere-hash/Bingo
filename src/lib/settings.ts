import { db } from "./db";

export const DEFAULT_SETTINGS = {
  whatsapp: "+971 56 893 4905",
  phone: "+226 76 95 00 89",
  email: "contact@tresorempire.com",
  address: "Ouagadougou, Burkina Faso",
} as const;

export type SiteSettings = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany({ where: { key: { in: SETTING_KEYS } } });
  const values = { ...DEFAULT_SETTINGS } as SiteSettings;
  for (const row of rows) {
    if (row.value && row.key in values) {
      values[row.key as keyof SiteSettings] = row.value;
    }
  }
  return values;
}

export function waDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function telHref(value: string) {
  return `tel:${String(value || "").replace(/[^\d+]/g, "")}`;
}
