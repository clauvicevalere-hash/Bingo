import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const where = {
    ...(q ? { name: { contains: q } } : {}),
  };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: true,
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Produits</h1>
      <p className="muted small" style={{ marginTop: 0 }}>{count} produits · page {page}/{pages}</p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
        <Link href="/admin/produits/nouveau" className="btn btn-primary" style={{ height: 42 }}>
          + Nouveau produit
        </Link>
        <Link href="/admin/categories" className="tab">Gérer les catégories</Link>
      </div>

      <form className="search" action="/admin/produits" style={{ maxWidth: 520, margin: "14px 0" }}>
        <input name="q" defaultValue={q ?? ""} placeholder="Nom du produit" />
        <button type="submit">Chercher</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Produit</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>État</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const stock = p.stocks.reduce((n, s) => n + s.qty, 0);
            return (
              <tr key={p.id}>
                <td style={{ width: 52 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]?.url ?? "/placeholder.svg"} alt="" style={{ width: 42, height: 42, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 8 }} />
                </td>
                <td>
                  <b>{p.name}</b>
                  <div className="muted tiny">{p.category?.name ?? "—"} · {p.slug}</div>
                </td>
                <td>
                  {money(p.price)}
                  {p.oldPrice ? <div className="muted tiny" style={{ textDecoration: "line-through" }}>{money(p.oldPrice)}</div> : null}
                </td>
                <td>
                  <b style={{ color: stock > 0 ? "var(--ok)" : "var(--danger)" }}>{stock}</b>
                </td>
                <td>{p.active ? <span className="status delivered">Actif</span> : <span className="status cancelled">Masqué</span>}</td>
                <td><Link href={`/admin/produits/${p.id}`} className="tab">Modifier</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {page > 1 && <Link className="tab" href={`/admin/produits?page=${page - 1}${q ? `&q=${q}` : ""}`}>← Précédent</Link>}
          {page < pages && <Link className="tab" href={`/admin/produits?page=${page + 1}${q ? `&q=${q}` : ""}`}>Suivant →</Link>}
        </div>
      )}
    </div>
  );
}
