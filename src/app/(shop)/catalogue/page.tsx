import Link from "next/link";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    tri?: string;
    q?: string;
    min?: string;
    max?: string;
    marque?: string;
    etat?: string;
  }>;
}) {
  const { page: pageRaw, tri, q, min, max, marque, etat } = await searchParams;
  const country = await getCountryCode();
  const page = Math.max(1, Number(pageRaw) || 1);
  const priceMin = Number(min) > 0 ? Number(min) : undefined;
  const priceMax = Number(max) > 0 ? Number(max) : undefined;

  const where = {
    active: true,
    ...(q ? { name: { contains: q } } : {}),
    ...(priceMin || priceMax
      ? { price: { ...(priceMin ? { gte: priceMin } : {}), ...(priceMax ? { lte: priceMax } : {}) } }
      : {}),
    ...(marque ? { brand: { slug: marque } } : {}),
    ...(etat ? { condition: etat } : {}),
  };

  const orderBy =
    tri === "prix-asc"
      ? { price: "asc" as const }
      : tri === "prix-desc"
        ? { price: "desc" as const }
        : tri === "nom"
          ? { name: "asc" as const }
          : { createdAt: "desc" as const };

  const [products, count, brands] = await Promise.all([
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
    db.brand.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (min) query.set("min", min);
  if (max) query.set("max", max);
  if (marque) query.set("marque", marque);
  if (etat) query.set("etat", etat);
  const filters = query.toString();

  const withPage = (n: number, sort?: string) => {
    const p = new URLSearchParams(filters);
    if (sort) p.set("tri", sort);
    else if (tri) p.set("tri", tri);
    p.set("page", String(n));
    return `/catalogue?${p.toString()}`;
  };

  return (
    <div className="container">
      <h1 className="page-title">Tout le catalogue</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {count} produits · Livraison au Burkina Faso, Mali, Niger et Côte d&apos;Ivoire
      </p>

      <form method="get" action="/catalogue" className="panel" style={{ margin: "16px 0" }}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="f-q">Recherche</label>
            <input id="f-q" name="q" defaultValue={q ?? ""} placeholder="iPhone, Samsung, MacBook…" />
          </div>
          <div className="field">
            <label htmlFor="f-marque">Marque</label>
            <select id="f-marque" name="marque" defaultValue={marque ?? ""}>
              <option value="">Toutes les marques</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-etat">État</label>
            <select id="f-etat" name="etat" defaultValue={etat ?? ""}>
              <option value="">Tous les états</option>
              <option value="Neuf">Neuf</option>
              <option value="Occasion">Occasion</option>
              <option value="Reconditionné">Reconditionné</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-tri">Trier par</label>
            <select id="f-tri" name="tri" defaultValue={tri ?? ""}>
              <option value="">Nouveautés</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix décroissant</option>
              <option value="nom">Nom A → Z</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-min">Prix minimum (FCFA)</label>
            <input id="f-min" name="min" type="number" min={0} step={500} defaultValue={min ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="f-max">Prix maximum (FCFA)</label>
            <input id="f-max" name="max" type="number" min={0} step={500} defaultValue={max ?? ""} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary" type="submit">Filtrer</button>
          {filters ? (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href="/catalogue">
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </form>

      <div className="products">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", marginTop: 16 }}>
          <p className="muted" style={{ margin: 0 }}>Aucun produit ne correspond à ces filtres.</p>
        </div>
      ) : null}

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "28px 0" }}>
          {page > 1 && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={withPage(page - 1)}>
              ← Précédent
            </Link>
          )}
          <span className="chip">Page {page} / {pages}</span>
          {page < pages && (
            <Link className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }} href={withPage(page + 1)}>
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
