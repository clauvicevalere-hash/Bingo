import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function markAllRead() {
    "use server";
    await db.notification.updateMany({ where: { read: false }, data: { read: true } });
    revalidatePath("/admin", "layout");
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>Notifications</h1>
        <form action={markAllRead}>
          <button type="submit" className="btn" style={{ height: 40 }}>Tout marquer comme lu</button>
        </form>
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Commandes, changements de statut et messages clients.
      </p>

      <div className="panel" style={{ padding: 0 }}>
        {notifications.length === 0 ? (
          <p className="muted small" style={{ padding: 16, margin: 0 }}>Aucune notification.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid var(--line)",
                background: n.read ? "transparent" : "var(--brand-soft)",
              }}
            >
              <div>
                <b style={{ fontSize: 14 }}>{n.title}</b>
                {n.body ? <div className="muted small">{n.body}</div> : null}
                <div className="muted tiny">{n.createdAt.toLocaleString("fr-FR")}</div>
              </div>
              {n.link ? <Link className="tab" href={n.link}>Ouvrir →</Link> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
