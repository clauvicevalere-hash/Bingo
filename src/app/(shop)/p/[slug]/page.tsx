import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { countryByCode, discountPercent, money, stripHtml } from "@/lib/site";
import { categoryLabel, productLabel } from "@/lib/fr";
import { Gallery } from "@/components/Gallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";
import { orangeConfig } from "@/lib/orange";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      price: true,
      images: { orderBy: { sort: "asc" }, take: 1 },
    },
  });
  if (!product) return { title: "Produit introuvable" };

  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const label = productLabel(product.name);
  const description =
    stripHtml(product.description).slice(0, 155) ||
    `Achetez ${label} chez Bingo. Livraison au Burkina Faso, Mali, Niger et Côte d'Ivoire, paiement à la livraison.`;
  const image = product.images[0] ? `${base}${product.images[0].url}` : `${base}/icons/icon-512.png`;

  return {
    title: label,
    description,
    openGraph: {
      title: label,
      description,
      type: "website",
      images: [{ url: image }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryCode();
  const info = countryByCode(country);
  const orange = orangeConfig();

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sort: "asc" } },
      variants: { orderBy: { id: "asc" } },
      category: { include: { parent: true } },
      brand: true,
      stocks: { where: { countryCode: country } },
    },
  });
  if (!product) notFound();

  const [related, cheapestCity] = await Promise.all([
    db.product.findMany({
      where: { active: true, categoryId: product.categoryId ?? undefined, id: { not: product.id } },
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: { where: { countryCode: country } },
      },
      take: 4,
    }),
    db.city.findFirst({
      where: { countryCode: country, active: true },
      orderBy: { deliveryFee: "asc" },
    }),
  ]);

  const stockByVariant = new Map<number, number>();
  let baseStock = 0;
  for (const s of product.stocks) {
    if ((s.variantId ?? 0) === 0) baseStock += s.qty;
    else {
      const vid = s.variantId as number;
      stockByVariant.set(vid, (stockByVariant.get(vid) ?? 0) + s.qty);
    }
  }

  const variants = product.variants.map((v) => ({
    id: v.id,
    label: v.label,
    price: v.price,
    oldPrice: v.oldPrice,
    stock: stockByVariant.get(v.id) ?? 0,
  }));

  const totalStock = variants.length
    ? variants.reduce((n, v) => n + v.stock, 0)
    : baseStock;

  const image = product.images[0]?.url ?? "/placeholder.svg";
  const off = discountPercent(product.price, product.oldPrice);
  const label = productLabel(product.name);

  const siteBase = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: label,
    image: `${siteBase}${image}`,
    description: stripHtml(product.description).slice(0, 300),
    sku: product.sku || product.slug,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteBase}/p/${product.slug}`,
      priceCurrency: "XOF",
      price: product.price,
      availability:
        totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="crumbs">
        <Link href="/">Accueil</Link> <span>/</span>
        {product.category ? (
          <>
            <Link href={`/c/${product.category.slug}`}>{categoryLabel(product.category.slug, product.category.name)}</Link> <span>/</span>
          </>
        ) : null}
        <span>{label}</span>
      </div>

      <div className="product-layout">
        <div>
          <Gallery images={product.images.map((i) => i.url)} name={label} />
          <div className="delivery-box">
            <div className="delivery-line">
              <span aria-hidden>🚚</span>
              <div>
                <b>Livraison {info.flag} {info.name}</b>
                <span>
                  24–72 h selon la ville · à partir de {money(cheapestCity?.deliveryFee ?? 0)}
                </span>
              </div>
            </div>
            <div className="delivery-line">
              <span aria-hidden>💵</span>
              <div>
                <b>Paiement à la livraison</b>
                <span>Vous payez en espèces après vérification du colis.</span>
              </div>
            </div>
            <div className="delivery-line">
              <span aria-hidden>📲</span>
              <div>
                <b>Orange Money</b>
                <span>{orange.enabled ? "Paiement mobile disponible au checkout." : "Bientôt disponible sur ce pays."}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="p-meta">
            {product.condition ? <span className="chip">{product.condition}</span> : null}
            {product.brand ? <span className="chip">{product.brand.name}</span> : null}
            <span className={`chip ${totalStock > 0 ? "ok" : "out"}`}>
              {totalStock > 0 ? "En stock" : "Rupture"}
            </span>
          </div>
          <h1 className="p-title">{label}</h1>

          <div className="p-price">
            <span className="price">
              {variants.length > 0
                ? `Dès ${money(Math.min(...variants.map((v) => v.price)))}`
                : money(product.price)}
            </span>
            {variants.length === 0 && product.oldPrice ? (
              <span className="old-price">{money(product.oldPrice)}</span>
            ) : null}
            {variants.length === 0 && off > 0 ? <span className="saving">-{off}%</span> : null}
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Prix TTC, en FCFA. Livraison calculée à l&apos;étape suivante.
          </p>

          <ul className="keyfacts">
            <li><span>État</span><b>{product.condition}</b></li>
            <li><span>Marque</span><b>{product.brand?.name ?? "—"}</b></li>
            <li><span>Disponibilité</span><b>{info.name}</b></li>
            <li><span>Livraison</span><b>24–72 h</b></li>
            <li><span>Paiement</span><b>À la livraison{orange.enabled ? " ou Orange Money" : ""}</b></li>
            <li><span>Garantie</span><b>{product.condition === "Occasion" ? "7 jours" : "3 mois"}</b></li>
          </ul>

          <ProductPurchase
            product={{
              id: product.id,
              slug: product.slug,
              name: label,
              price: product.price,
              oldPrice: product.oldPrice,
              image,
            }}
            variants={variants}
            baseStock={baseStock}
            countryName={info.name}
          />

          <a
            href={`https://wa.me/${(process.env.SITE_WHATSAPP || "22600000000").replace(/\D/g, "")}?text=${encodeURIComponent(
              `Bonjour Bingo, je suis intéressé par : ${label} — ${money(product.price)}. Est-il disponible au ${info.name} ?`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-block"
            style={{ background: "#25D366", color: "#fff", marginTop: 10 }}
          >
            Commander sur WhatsApp
          </a>

          <div className="specs">
            <h3>À propos de ce produit</h3>
            {product.description ? (
              <div className="prose" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="muted">Description à venir.</p>
            )}
            {product.specs ? (
              <details style={{ marginTop: 14 }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>Fiche technique</summary>
                <div className="prose" style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: product.specs }} />
              </details>
            ) : null}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Vous aimerez aussi</h2>
          </div>
          <div className="products">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
