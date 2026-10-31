import Link from "next/link";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tri?: string; q?: string }>;
}) {
  const { page: pageRaw, tri, q } = await searchParams;
  const country = await getCountryCode();
  const page = Math.max(1, Number(pageRaw) || 1);

  const where = {
    active: true,
    ...(q ? { name: { contains: q } } : {}),
  };

  const orderBy =
    tri === "prix-asc"
      ? { price: "asc" as const }
      : tri === "prix-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: { where: { countryCode: country } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="container">
      <h1 className="page-title">Tout le catalogue</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {count} produits · Livraison au Burkina Faso, Mali, Niger et Côte d&apos;Ivoire
      </p>

      <div className="tabs" style={{ margin: "16px 0 20px" }}>
        <Link href="/catalogue" className={`tab${!tri ? " active" : ""}`}>
          Nouveautés
        </Link>
        <Link href="/catalogue?tri=prix-asc" className={`tab${tri === "prix-asc" ? " active" : ""}`}>
          Prix croissant
        </Link>
        <Link href="/catalogue?tri=prix-desc" className={`tab${tri === "prix-desc" ? " active" : ""}`}>
          Prix décroissant
        </Link>
      </div>

      <div className="products">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "28px 0" }}>
          {page > 1 && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={`/catalogue?page=${page - 1}${tri ? `&tri=${tri}` : ""}`}>
              ← Précédent
            </Link>
          )}
          <span className="chip">
            Page {page} / {pages}
          </span>
          {page < pages && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={`/catalogue?page=${page + 1}${tri ? `&tri=${tri}` : ""}`}>
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
