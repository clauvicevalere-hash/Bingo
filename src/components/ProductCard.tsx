import Link from "next/link";
import { discountPercent, money } from "@/lib/site";

export type CardProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  images: { url: string }[];
  category?: { name: string } | null;
  stocks?: { qty: number }[];
};

export function ProductCard({ product }: { product: CardProduct }) {
  const img = product.images[0]?.url ?? "/placeholder.svg";
  const stock = (product.stocks ?? []).reduce((n, s) => n + s.qty, 0);
  const off = discountPercent(product.price, product.oldPrice);

  return (
    <Link href={`/p/${product.slug}`} className="card">
      <div className="card-media">
        {off > 0 && <span className="tag">-{off}%</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={product.name} loading="lazy" />
      </div>
      <div className="card-body">
        <span className="card-cat">{product.category?.name ?? "High-tech"}</span>
        <span className="card-title">{product.name}</span>
        <div className="price-row">
          <span className="price">{money(product.price)}</span>
          {product.oldPrice ? <span className="old-price">{money(product.oldPrice)}</span> : null}
        </div>
        <div className="card-foot">
          <span className={`stock-dot${stock > 0 ? "" : " out"}`}>
            {stock > 0 ? "En stock" : "Rupture"}
          </span>
          <span className="mini-add" aria-hidden>
            +
          </span>
        </div>
      </div>
    </Link>
  );
}
