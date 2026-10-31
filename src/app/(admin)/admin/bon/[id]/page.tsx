import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PackingSlip({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id: Number(id) },
    include: { items: true, country: true },
  });
  if (!order) notFound();

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <Link href="/admin/commandes" className="tab">← Commandes</Link>
          <PrintButton />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "2px solid #0a1240", paddingBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Tresor Empire" style={{ width: 42, height: 42, objectFit: "contain" }} />
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>
                Tresor <span style={{ color: "#d90b1c" }}>Empire</span>
              </div>
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>Bon de livraison</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{order.number}</div>
            <div className="small muted">{order.createdAt.toLocaleString("fr-FR")}</div>
            <div className="small">{order.city}, {order.country.name}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "22px 0" }}>
          <div>
            <div className="tiny muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>Client</div>
            <div style={{ fontWeight: 700 }}>{order.customerName}</div>
            <div className="small">{order.phone}{order.whatsapp ? ` · WhatsApp ${order.whatsapp}` : ""}</div>
          </div>
          <div>
            <div className="tiny muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>Adresse de livraison</div>
            <div className="small">{order.address}</div>
            <div className="small">{order.city}, {order.country.name}</div>
          </div>
        </div>

        <table className="table" style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>Article</th>
              <th>Option</th>
              <th style={{ textAlign: "right" }}>Qté</th>
              <th style={{ textAlign: "right" }}>Prix</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td className="muted">{it.variantLabel || "—"}</td>
                <td style={{ textAlign: "right" }}>{it.qty}</td>
                <td style={{ textAlign: "right" }}>{money(it.price)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{money(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginLeft: "auto", width: 280, marginTop: 18 }}>
          <div className="summary-row"><span>Sous-total</span><b>{money(order.subtotal)}</b></div>
          <div className="summary-row"><span>Livraison</span><b>{order.deliveryFee ? money(order.deliveryFee) : "Offerte"}</b></div>
          <div className="summary-row total"><span>Total à encaisser</span><span>{money(order.total)}</span></div>
          <div className="small" style={{ marginTop: 6 }}>
            Paiement : {order.paymentMethod === "COD" ? "espèces à la livraison" : "Orange Money"}
            {" · "}
            {order.paymentStatus === "paid" ? "déjà payé" : "à encaisser"}
          </div>
        </div>

        {order.note ? <p className="small" style={{ marginTop: 18 }}><b>Note :</b> {order.note}</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 50 }}>
          <div style={{ borderTop: "1px solid #999", paddingTop: 8 }} className="small muted">Signature livreur</div>
          <div style={{ borderTop: "1px solid #999", paddingTop: 8 }} className="small muted">Signature client</div>
        </div>
      </div>
    </div>
  );
}
