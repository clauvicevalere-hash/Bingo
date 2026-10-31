import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const COUNTRIES = [
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "CI", name: "Côte d'Ivoire" },
];

export default async function AdminStocks() {
  const perCountry = await Promise.all(
    COUNTRIES.map(async (c) => ({
      ...c,
      total: (await db.stock.aggregate({ where: { countryCode: c.code }, _sum: { qty: true } }))._sum.qty ?? 0,
      skus: await db.stock.count({ where: { countryCode: c.code, qty: { gt: 0 } } }),
    }))
  );

  const low = await db.stock.findMany({
    where: { qty: { lte: 2, gt: 0 } },
    include: { product: true, variant: true, country: true },
    orderBy: { qty: "asc" },
    take: 40,
  });

  const out = await db.stock.count({ where: { qty: 0 } });

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Stocks</h1>
      <p className="muted small" style={{ marginTop: 0 }}>Répartition par pays et alertes.</p>

      <div className="admin-cards">
        {perCountry.map((c) => (
          <div className="stat" key={c.code}>
            <b>{c.total}</b>
            <span>{c.name} · {c.skus} réf. dispo</span>
          </div>
        ))}
      </div>

      <p className="muted small">{out} ligne(s) de stock à zéro.</p>

      <div className="panel">
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Stock faible (≤ 2)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Option</th>
              <th>Pays</th>
              <th>Qté</th>
            </tr>
          </thead>
          <tbody>
            {low.map((s) => (
              <tr key={s.id}>
                <td><Link href={`/admin/produits/${s.productId}`}>{s.product.name}</Link></td>
                <td>{s.variant?.label ?? "—"}</td>
                <td>{s.country.name}</td>
                <td><b style={{ color: "var(--danger)" }}>{s.qty}</b></td>
              </tr>
            ))}
            {low.length === 0 && <tr><td colSpan={4} className="muted">Aucune alerte.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
