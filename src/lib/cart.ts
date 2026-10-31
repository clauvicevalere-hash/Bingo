export type CartLine = {
  productId: number;
  variantId?: number | null;
  qty: number;
  name: string;
  variantLabel: string;
  price: number;
  image: string;
  slug: string;
  stock: number;
};

const KEY = "bingo_cart_v1";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && typeof l.productId === "number" && l.qty > 0);
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("cart:change"));
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function addLine(line: Omit<CartLine, "qty"> & { qty?: number }) {
  const lines = readCart();
  const key = `${line.productId}:${line.variantId ?? 0}`;
  const existing = lines.find((l) => `${l.productId}:${l.variantId ?? 0}` === key);
  if (existing) {
    existing.qty = Math.min(existing.stock || 99, existing.qty + (line.qty ?? 1));
  } else {
    lines.push({ ...line, qty: line.qty ?? 1 });
  }
  writeCart(lines);
}

export function setQty(productId: number, variantId: number | null | undefined, qty: number) {
  const lines = readCart().map((l) =>
    l.productId === productId && (l.variantId ?? 0) === (variantId ?? 0)
      ? { ...l, qty: Math.max(1, Math.min(l.stock || 99, qty)) }
      : l
  );
  writeCart(lines);
}

export function removeLine(productId: number, variantId: number | null | undefined) {
  writeCart(
    readCart().filter(
      (l) => !(l.productId === productId && (l.variantId ?? 0) === (variantId ?? 0))
    )
  );
}

export function clearCart() {
  writeCart([]);
}
