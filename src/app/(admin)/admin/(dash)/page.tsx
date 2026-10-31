import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { COUNTRIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function AdminHome() {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [orders, newOrders, products, revenue30, recent, stocks, byCountry, topItems, pendingReviews, staleUnpaid] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "new" } }),
      db.product.count({ where: { active: true } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: since }, status: { not: "cancelled" } },
      }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
      db.stock.aggregate({ _sum: { qty: true } }),
      db.order.groupBy({
        by: ["countryCode"],
        where: { status: { not: "cancelled" } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
      db.review.count({ where: { status: "pending" } }),
      db.order.count({
        where: {
          paymentMethod: "ORANGE_MONEY",
          paymentStatus: { not: "paid" },
          status: { not: "cancelled" },
          createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) },
        },
      }),
    ]);

  const topProducts = await db.product.findMany({
    where: { id: { in: topItems.map((t) => t.productId) } },
    select: { id: true, name: true },
  });
  const topName = new Map(topProducts.map((p) => [p.id, p.name]));

  const maxCountry = Math.max(1, ...byCountry.map((c) => c._sum.total ?? 0));
  const countries = COUNTRIES.map((c) => {
    const row = byCountry.find((b) => b.countryCode === c.code);
    return {
      ...c,
      total: row?._sum.total ?? 0,
      count: row?._count._all ?? 0,
    };
  });

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
          <b>{money(revenue30._sum.total ?? 0)}</b>
          <span>CA 30 derniers jours</span>
        </div>
        <div className="stat">
          <b>{products}</b>
          <span>Produits actifs</span>
        </div>
      </div>

      {pendingReviews > 0 || staleUnpaid > 0 ? (
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {pendingReviews > 0 ? (
            <div className="notice">
              <b>{pendingReviews} avis client(s)</b> en attente de modération —{" "}
              <Link href="/admin/avis" style={{ fontWeight: 700, textDecoration: "underline" }}>les traiter</Link>
            </div>
          ) : null}
          {staleUnpaid > 0 ? (
            <div className="notice">
              <b>{staleUnpaid} commande(s) Orange Money</b> non payée(s) depuis plus de 24 h —{" "}
              <Link href="/admin/commandes" style={{ fontWeight: 700, textDecoration: "underline" }}>
                vérifier
              </Link>{" "}
              ou lancer <code>npm run orders:release</code>.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="panel">
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Ventes par pays</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {countries.map((c) => (
              <div key={c.code}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{c.flag} {c.name} <span className="muted tiny">· {c.count} cmd</span></span>
                  <b>{money(c.total)}</b>
                </div>
                <div style={{ height: 8, background: "#f1ece7", borderRadius: 999 }}>
                  <div
                    style={{
                      height: 8,
                      width: `${Math.max(2, Math.round((c.total / maxCountry) * 100))}%`,
                      background: "var(--brand)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Meilleures ventes</h3>
          {topItems.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {topItems.map((t, i) => (
                <div key={t.productId} style={{ display: "flex", gap: 10, fontSize: 13.5 }}>
                  <span className="muted">{i + 1}.</span>
                  <span style={{ flex: 1 }}>{topName.get(t.productId) ?? "Produit supprimé"}</span>
                  <b>{t._sum.qty ?? 0} u.</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>Pas encore de ventes enregistrées.</p>
          )}
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
