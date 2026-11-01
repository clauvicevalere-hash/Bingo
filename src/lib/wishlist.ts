const KEY = "te_wishlist";

export function readWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(id: number): boolean {
  const current = readWishlist();
  const exists = current.includes(id);
  const next = exists ? current.filter((n) => n !== id) : [id, ...current].slice(0, 60);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("wishlist:change"));
  return !exists;
}

export function isWishlisted(id: number) {
  return readWishlist().includes(id);
}
