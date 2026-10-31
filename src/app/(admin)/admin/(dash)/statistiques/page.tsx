import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AnalyticsPage() {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const [events, orders] = await Promise.all([
    db.event.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, session: true, productId: true, createdAt: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    }),
  ]);

  const count = (type: string) => events.filter((e) => e.type === type).length;
  const visits = count("page_view");
  const sessions = new Set(events.map((e) => e.session).filter(Boolean)).size;
  const productViews = count("product_view");
  const adds = count("add_to_cart");
  const revenue = orders.reduce((n, o) => n + o.total, 0);
  const conversion = visits ? (orders.length / visits) * 100 : 0;

  const days: { label: string; visits: number; orders: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      label: key.slice(5),
      visits: events.filter((e) => e.type === "page_view" && e.createdAt.toISOString().slice(0, 10) === key).length,
      orders: orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).length,
    });
  }
  const maxVisits = Math.max(1, ...days.map((d) => d.visits));

  const viewsByProduct = new Map<number, number>();
  for (const e of events) {
    if (e.type === "product_view" && e.productId) {
      viewsByProduct.set(e.productId, (viewsByProduct.get(e.productId) ?? 0) + 1);
    }
  }
  const topIds = [...viewsByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topProducts = await db.product.findMany({
    where: { id: { in: topIds.map(([id]) => id) } },
    select: { id: true, name: true, slug: true },
  });
  const top = topIds.map(([id, n]) => ({
    id,
    views: n,
    name: topProducts.find((p) => p.id === id)?.name ?? `Produit ${id}`,
    slug: topProducts.find((p) => p.id === id)?.slug ?? "",
  }));

  const cards = [
    { label: "Visites", value: visits.toLocaleString("fr-FR") },
    { label: "Visiteurs uniques", value: sessions.toLocaleString("fr-FR") },
    { label: "Vues produit", value: productViews.toLocaleString("fr-FR") },
    { label: "Ajouts panier", value: adds.toLocaleString("fr-FR") },
    { label: "Commandes", value: orders.length.toLocaleString("fr-FR") },
    { label: "Chiffre d'affaires", value: `${revenue.toLocaleString("fr-FR")} F` },
    { label: "Taux de conversion", value: `${conversion.toFixed(1)} %` },
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>Statistiques</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Activité des {DAYS} derniers jours, sans cookie publicitaire.
      </p>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {cards.map((c) => (
          <div key={c.label} className="panel" style={{ padding: 14 }}>
            <div className="muted tiny">{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Visites par jour</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
          {days.map((d) => (
            <div key={d.label} style={{ flex: 1, textAlign: "center" }} title={`${d.label} : ${d.visits} visites`}>
              <div
                style={{
                  height: `${(d.visits / maxVisits) * 100}%`,
                  minHeight: d.visits ? 4 : 0,
                  background: "var(--brand)",
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          ))}
        </div>
        <div className="muted tiny" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span>{days[0]?.label}</span>
          <span>{days[days.length - 1]?.label}</span>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Produits les plus consultés</h3>
        {top.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>Pas encore de données.</p>
        ) : (
          top.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="small">{p.name}</a>
              <b className="small">{p.views}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
