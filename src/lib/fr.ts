/**
 * Couche de localisation française à l'affichage.
 * Les données source restent en anglais ; l'interface parle français.
 */

const CATEGORY_FR: Record<string, string> = {
  "new-mobile": "Mobiles neufs",
  "used-mobile": "Mobiles d'occasion",
  watches: "Montres",
  laptop: "Ordinateurs portables",
  tablet: "Tablettes",
  ipad: "iPad",
  gadget: "Gadgets",
  accessories: "Accessoires",
  "fashion-beauty": "Mode & Beauté",
  bags: "Sacs",
  "apple-imac": "Apple iMac",
  "crystal-whale-lamp": "Lampe Crystal Whale",
  "lucky-box": "Box surprise",
  "combo-offer": "Offres combinées",
};

export function categoryLabel(slug?: string | null, fallback?: string | null) {
  if (slug && CATEGORY_FR[slug]) return CATEGORY_FR[slug];
  return fallback || "";
}

const NAME_RULES: Array<[RegExp, string]> = [
  [/\bsmart\s*watch(es)?\b/gi, "Montre connectée"],
  [/\bsmartwatch(es)?\b/gi, "Montre connectée"],
  [/\bpower\s*bank\b/gi, "Batterie externe"],
  [/\bearbuds?\b/gi, "Écouteurs"],
  [/\bheadphones?\b/gi, "Casque"],
  [/\bwireless\b/gi, "Sans fil"],
  [/\btablet\b/gi, "Tablette"],
  [/\blaptop\b/gi, "Ordinateur portable"],
  [/\bcamera\b/gi, "Caméra"],
  [/\bspeaker\b/gi, "Enceinte"],
  [/\bcharger\b/gi, "Chargeur"],
  [/\bcover\b/gi, "Coque"],
  [/\bcase\b/gi, "Coque"],
  [/\bcombo\b/gi, "Pack"],
  [/\bcable\b/gi, "Câble"],
  [/\bkeyboard\b/gi, "Clavier"],
  [/\bmouse\b/gi, "Souris"],
  [/\brefurbished\b/gi, "Reconditionné"],
  [/\bused\b/gi, "Occasion"],
  [/\bnew\b/gi, "Neuf"],
];

export function productLabel(name: string) {
  let out = name;
  for (const [pattern, replacement] of NAME_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Traduit une recherche française vers les termes anglais du catalogue. */
export function searchTerms(query: string) {
  const q = query.trim();
  if (!q) return [q];
  const terms = new Set<string>([q]);
  const lower = q.toLowerCase();
  if (lower.includes("occasion")) terms.add(q.replace(/occasion/gi, "Used"));
  if (lower.includes("neuf")) terms.add(q.replace(/neuf/gi, "New"));
  if (lower.includes("montre")) terms.add(q.replace(/montre( connectée)?/gi, "Watch"));
  if (lower.includes("écouteur") || lower.includes("ecouteur")) terms.add(q.replace(/écouteurs?|ecouteurs?/gi, "Earbuds"));
  if (lower.includes("ordinateur")) terms.add(q.replace(/ordinateur( portable)?/gi, "Laptop"));
  return Array.from(terms).filter(Boolean);
}
