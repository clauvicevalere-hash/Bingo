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

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const orders = query
    ? await db.order.findMany({
        where: {
          OR: [{ number: { contains: query } }, { phone: { contains: query } }],
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 className="page-title">Suivre ma commande</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Entrez votre numéro de commande (ex. BNG-261031-4821) ou votre numéro de téléphone.
      </p>

      <form action="/suivi" className="search" style={{ margin: "14px 0 26px" }}>
        <input name="q" defaultValue={query} placeholder="Numéro de commande ou téléphone" />
        <button type="submit">Rechercher</button>
      </form>

      {query && orders.length === 0 && (
        <div className="empty">
          <div style={{ fontSize: 34 }}>📦</div>
          <h3>Aucune commande trouvée</h3>
          <p className="muted">Vérifiez le numéro saisi ou contactez-nous.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {orders.map((o) => (
          <div key={o.id} className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <b style={{ fontFamily: "ui-monospace, monospace" }}>{o.number}</b>
                <div className="muted tiny">
                  {o.createdAt.toLocaleDateString("fr-FR")} · {o.items.length} article(s)
                </div>
              </div>
              <span className={`status ${o.status}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span className="small muted">
                {o.city} · {o.countryCode}
              </span>
              <b>{money(o.total)}</b>
            </div>
            <Link href={`/commande/${o.number}`} className="btn" style={{ marginTop: 12, background: "#fff", border: "1px solid var(--line)" }}>
              Voir le détail
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
