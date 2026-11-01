import Link from "next/link";
import Image from "next/image";
import { discountPercent, money } from "@/lib/site";
import { categoryLabel, productLabel } from "@/lib/fr";
import { WishlistButton } from "@/components/WishlistButton";

export type CardProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  showOldPrice?: boolean;
  showDiscountBadge?: boolean;
  images: { url: string }[];
  category?: { name: string; slug: string } | null;
  stocks?: { qty: number }[];
};

export function ProductCard({ product }: { product: CardProduct }) {
  const img = product.images[0]?.url ?? "/placeholder.svg";
  const stock = (product.stocks ?? []).reduce((n, s) => n + s.qty, 0);
  const showOld = product.showOldPrice !== false && (product.oldPrice ?? 0) > product.price;
  const off =
    product.showDiscountBadge !== false && showOld
      ? discountPercent(product.price, product.oldPrice)
      : 0;

  return (
    <Link href={`/p/${product.slug}`} className="card">
      <div className="card-media">
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
          <WishlistButton productId={product.id} />
        </div>
        {off > 0 && <span className="tag">-{off}%</span>}
        {img.endsWith(".svg") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={productLabel(product.name)} loading="lazy" />
        ) : (
          <Image
            src={img}
            alt={productLabel(product.name)}
            fill
            sizes="(max-width: 640px) 50vw, 260px"
            style={{ objectFit: "contain", padding: 10 }}
          />
        )}
      </div>
      <div className="card-body">
        <span className="card-cat">{categoryLabel(product.category?.slug, product.category?.name) || "High-tech"}</span>
        <span className="card-title">{productLabel(product.name)}</span>
        <div className="price-row">
          <span className="price">{money(product.price)}</span>
          {showOld ? <span className="old-price">{money(product.oldPrice as number)}</span> : null}
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
