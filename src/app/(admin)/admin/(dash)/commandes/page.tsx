import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { changeOrderStatus, OrderStatusError } from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; erreur?: string }>;
}) {
  const { status, q, erreur } = await searchParams;

  const orders = await db.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { phone: { contains: q } }, { customerName: { contains: q } }] } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function updateStatus(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    const next = String(formData.get("status"));

    try {
      await changeOrderStatus(id, next);
    } catch (e) {
      if (e instanceof OrderStatusError && e.code === "CANCELLED_LOCKED") {
        redirect("/admin/commandes?erreur=annulee");
      }
      throw e;
    }

    revalidatePath("/admin/commandes");
  }

  async function markPaid(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.order.update({ where: { id }, data: { paymentStatus: "paid" } });
    revalidatePath("/admin/commandes");
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Commandes</h1>
      <p className="muted small" style={{ marginTop: 0 }}>{orders.length} commande(s) affichée(s)</p>

      {erreur === "annulee" ? (
        <div className="notice" style={{ marginBottom: 14 }}>
          Une commande annulée ne peut pas être réactivée (le stock a été remis en rayon).
          Créez une nouvelle commande si besoin.
        </div>
      ) : null}

      <form className="search" action="/admin/commandes" style={{ maxWidth: 520, margin: "14px 0" }}>
        <input name="q" defaultValue={q ?? ""} placeholder="N°, téléphone ou nom" />
        <button type="submit">Chercher</button>
      </form>

      <div className="tabs" style={{ marginBottom: 14 }}>
        <Link href="/admin/commandes" className={`tab${!status ? " active" : ""}`}>Toutes</Link>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link key={key} href={`/admin/commandes?status=${key}`} className={`tab${status === key ? " active" : ""}`}>
            {label}
          </Link>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Commande</th>
            <th>Client</th>
            <th>Livraison</th>
            <th>Total</th>
            <th>Paiement</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/commande/${o.number}`} style={{ fontWeight: 700 }}>{o.number}</Link>
                <div className="muted tiny">{o.createdAt.toLocaleDateString("fr-FR")} · {o.items.length} art.</div>
                <Link href={`/admin/bon/${o.id}`} className="tiny" style={{ color: "var(--brand)", fontWeight: 700 }}>
                  Bon de livraison
                </Link>
              </td>
              <td>
                {o.customerName}
                <div className="muted tiny">{o.phone}</div>
              </td>
              <td>
                {o.city}, {o.countryCode}
                <div className="muted tiny">{o.address.slice(0, 42)}{o.address.length > 42 ? "…" : ""}</div>
              </td>
              <td><b>{money(o.total)}</b></td>
              <td>
                {o.paymentMethod === "COD" ? "À la livraison" : "Orange Money"}
                <div className="muted tiny">{o.paymentStatus}</div>
                {o.paymentStatus !== "paid" ? (
                  <form action={markPaid} style={{ marginTop: 6 }}>
                    <input type="hidden" name="id" value={o.id} />
                    <button type="submit" className="tab" style={{ fontSize: 11 }}>
                      Marquer payé
                    </button>
                  </form>
                ) : null}
              </td>
              <td>
                <form action={updateStatus} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--line)" }}>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button type="submit" className="tab">OK</button>
                </form>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="muted">Aucune commande.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
