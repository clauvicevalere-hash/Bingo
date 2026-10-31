import Link from "next/link";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { ProductCard } from "@/components/ProductCard";
import { searchTerms } from "@/lib/fr";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const country = await getCountryCode();
  const query = (q ?? "").trim();
  const terms = searchTerms(query);

  const products = query
    ? await db.product.findMany({
        where: { active: true, OR: terms.map((term) => ({ name: { contains: term } })) },
        include: {
          images: { orderBy: { sort: "asc" }, take: 1 },
          category: true,
          stocks: { where: { countryCode: country } },
        },
        orderBy: { views: "desc" },
        take: 48,
      })
    : [];

  return (
    <div className="container">
      <h1 className="page-title">Recherche</h1>
      <form className="search" action="/recherche" style={{ maxWidth: 620, margin: "14px 0 8px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8d827a" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input name="q" defaultValue={query} placeholder="iPhone, MacBook, montre, écouteurs…" autoFocus />
        <button type="submit">Chercher</button>
      </form>

      {query ? (
        <>
          <p className="muted">
            {products.length} résultat(s) pour « <b>{query}</b> »
          </p>
          {products.length === 0 ? (
            <div className="empty" style={{ marginTop: 18 }}>
              <div style={{ fontSize: 34 }}>🔎</div>
              <h3>Aucun résultat</h3>
              <p className="muted">Essayez un autre mot-clé ou parcourez les rayons.</p>
              <Link href="/catalogue" className="btn btn-primary" style={{ marginTop: 10 }}>
                Tout le catalogue
              </Link>
            </div>
          ) : (
            <div className="products">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="muted" style={{ marginTop: 20 }}>
          Tapez le nom d&apos;un produit pour commencer.
        </p>
      )}
    </div>
  );
}
