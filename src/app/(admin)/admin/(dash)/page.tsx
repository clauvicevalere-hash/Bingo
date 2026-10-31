import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function AdminHome() {
  const [orders, newOrders, products, revenue, recent, stocks] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "new" } }),
    db.product.count({ where: { active: true } }),
    db.order.aggregate({ _sum: { total: true }, where: { status: "delivered" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    db.stock.aggregate({ _sum: { qty: true } }),
  ]);

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Tableau de bord</h1>
      <p className="muted small" style={{ marginTop: 0 }}>Vue d&apos;ensemble de la boutique.</p>

      <div className="admin-cards">
        <div className="stat">
          <b>{orders}</b>
          <span>Commandes</span>
        </div>
        <div className="stat">
          <b>{newOrders}</b>
          <span>À traiter</span>
        </div>
        <div className="stat">
          <b>{money(revenue._sum.total ?? 0)}</b>
          <span>CA livré</span>
        </div>
        <div className="stat">
          <b>{products}</b>
          <span>Produits actifs</span>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Dernières commandes</h3>
          <Link href="/admin/commandes" className="link-more">Tout voir →</Link>
        </div>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>N°</th>
              <th>Client</th>
              <th>Ville</th>
              <th>Total</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/commande/${o.number}`} style={{ fontWeight: 700 }}>{o.number}</Link></td>
                <td>{o.customerName}<div className="muted tiny">{o.phone}</div></td>
                <td>{o.city}</td>
                <td><b>{money(o.total)}</b></td>
                <td><span className={`status ${o.status}`}>{STATUS_LABELS[o.status] ?? o.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="muted">Aucune commande pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Stock total</h3>
        <p style={{ margin: 0 }}>
          <b style={{ fontSize: 28 }}>{stocks._sum.qty ?? 0}</b> unités réparties sur les 4 pays.
        </p>
      </div>
    </div>
  );
}
