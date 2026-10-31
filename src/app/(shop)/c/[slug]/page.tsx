import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { money } from "@/lib/site";
import { categoryLabel } from "@/lib/fr";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; tri?: string }>;
}) {
  const { slug } = await params;
  const { page: pageRaw, tri } = await searchParams;
  const country = await getCountryCode();
  const page = Math.max(1, Number(pageRaw) || 1);

  const category = await db.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
  if (!category) notFound();

  const ids = [category.id, ...category.children.map((c) => c.id)];
  const orderBy =
    tri === "prix-asc"
      ? { price: "asc" as const }
      : tri === "prix-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where: { active: true, categoryId: { in: ids } },
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: { where: { countryCode: country } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where: { active: true, categoryId: { in: ids } } }),
  ]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const base = `/c/${category.slug}`;

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Accueil</Link> <span>/</span>
        {category.parent ? (
          <>
            <Link href={`/c/${category.parent.slug}`}>{categoryLabel(category.parent.slug, category.parent.name)}</Link> <span>/</span>
          </>
        ) : null}
        <span>{categoryLabel(category.slug, category.name)}</span>
      </div>

      <div className="section-head" style={{ marginTop: 14 }}>
        <div>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.03em", margin: 0 }}>{categoryLabel(category.slug, category.name)}</h1>
          <p>{count} produit(s) · prix en FCFA</p>
        </div>
      </div>

      {category.children.length > 0 && (
        <div className="tabs" style={{ marginBottom: 16 }}>
          <Link href={base} className="tab active">
            Tout
          </Link>
          {category.children.map((c) => (
            <Link key={c.id} href={`/c/${c.slug}`} className="tab">
              {categoryLabel(c.slug, c.name)}
            </Link>
          ))}
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 18 }}>
        <Link href={`${base}?tri=nouveaux`} className={`tab${!tri || tri === "nouveaux" ? " active" : ""}`}>
          Nouveautés
        </Link>
        <Link href={`${base}?tri=prix-asc`} className={`tab${tri === "prix-asc" ? " active" : ""}`}>
          Prix croissant
        </Link>
        <Link href={`${base}?tri=prix-desc`} className={`tab${tri === "prix-desc" ? " active" : ""}`}>
          Prix décroissant
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 34 }}>📦</div>
          <h3>Bientôt disponible</h3>
          <p className="muted">Aucun produit dans ce rayon pour le moment.</p>
          <Link href="/catalogue" className="btn btn-primary" style={{ marginTop: 10 }}>
            Voir tout le catalogue
          </Link>
        </div>
      ) : (
        <div className="products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "28px 0" }}>
          {page > 1 && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={`${base}?page=${page - 1}${tri ? `&tri=${tri}` : ""}`}>
              ← Précédent
            </Link>
          )}
          <span className="chip">
            Page {page} / {pages}
          </span>
          {page < pages && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={`${base}?page=${page + 1}${tri ? `&tri=${tri}` : ""}`}>
              Suivant →
            </Link>
          )}
        </div>
      )}

      <p className="muted small" style={{ margin: "10px 0 40px" }}>
        Livraison locale — les frais exacts sont calculés selon votre ville à la commande.
      </p>
    </div>
  );
}
