import { cookies } from "next/headers";
import { DEFAULT_COUNTRY, isCountry } from "./site";

export const COUNTRY_COOKIE = "te_country";

export async function getCountryCode() {
  const store = await cookies();
  const value = store.get(COUNTRY_COOKIE)?.value;
  return isCountry(value) ? value : DEFAULT_COUNTRY;
}
