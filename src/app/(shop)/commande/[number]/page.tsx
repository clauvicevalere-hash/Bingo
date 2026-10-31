import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { STATUS_LABELS } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, country: true },
  });
  if (!order) notFound();

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <div className="order-hero">
        <div style={{ fontSize: 13, opacity: 0.85 }}>Commande confirmée</div>
        <h1>Merci {order.customerName.split(" ")[0]} !</h1>
        <p style={{ margin: 0, opacity: 0.92 }}>
          Nous vous appelons au <b>{order.phone}</b> pour confirmer la livraison.
        </p>
        <div style={{ marginTop: 14 }}>
          <span className="num">{order.number}</span>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Détail</h3>
          <span className={`status ${order.status}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
        </div>

        <div style={{ marginTop: 14 }}>
          {order.items.map((it) => (
            <div key={it.id} className="cart-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image || "/placeholder.svg"} alt={it.name} />
              <div>
                <h4>{it.name}</h4>
                {it.variantLabel ? <div className="muted tiny">{it.variantLabel}</div> : null}
                <div className="muted tiny">Quantité : {it.qty}</div>
              </div>
              <b>{money(it.price * it.qty)}</b>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
          <div className="summary-row">
            <span>Sous-total</span>
            <b>{money(order.subtotal)}</b>
          </div>
          <div className="summary-row">
            <span>Livraison · {order.city}</span>
            <b>{money(order.deliveryFee)}</b>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Suivi</h3>
          <span className={`status ${order.status}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
        </div>
        {order.status === "cancelled" ? (
          <p className="small muted" style={{ margin: 0 }}>
            Cette commande a été annulée. Contactez-nous si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[
              { key: "new", label: "Reçue" },
              { key: "confirmed", label: "Confirmée" },
              { key: "shipped", label: "Expédiée" },
              { key: "delivered", label: "Livrée" },
            ].map((s, i, arr) => {
              const current = arr.findIndex((x) => x.key === order.status);
              const done = i <= current;
              return (
                <div key={s.key} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      margin: "0 auto 6px",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      background: done ? "var(--brand)" : "#f1ece7",
                      color: done ? "#fff" : "#a2978f",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="tiny" style={{ fontWeight: done ? 700 : 500, color: done ? "var(--ink)" : "var(--muted)" }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="panel">
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Livraison</h3>
          <p className="small" style={{ lineHeight: 1.6, margin: 0 }}>
            <b>{order.customerName}</b>
            <br />
            {order.address}
            <br />
            {order.city}, {order.country.name}
            <br />
            {order.phone}
            {order.whatsapp ? ` · WhatsApp ${order.whatsapp}` : ""}
          </p>
          {order.note ? <p className="muted tiny" style={{ marginTop: 10 }}>Note : {order.note}</p> : null}
        </div>
        <div className="panel">
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Paiement</h3>
          <p className="small" style={{ margin: 0, lineHeight: 1.7 }}>
            {order.paymentMethod === "COD" ? "Paiement à la livraison" : "Orange Money"}
            <br />
            <span className="muted">
              {order.paymentMethod === "COD"
                ? "Vous réglez en espèces au livreur, après vérification."
                : order.paymentStatus === "paid"
                  ? "Paiement reçu. Merci !"
                  : "Votre paiement est en attente de validation."}
            </span>
          </p>
          {order.paymentMethod === "ORANGE_MONEY" ? (
            <p style={{ margin: "10px 0 0" }}>
              <span className={`status ${order.paymentStatus === "paid" ? "delivered" : "confirmed"}`}>
                {order.paymentStatus === "paid" ? "Payé" : "En attente de paiement"}
              </span>
            </p>
          ) : null}
          {order.paymentMethod === "ORANGE_MONEY" && order.paymentStatus !== "paid" ? (
            <Link href={`/paiement/${order.number}`} className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
              Payer avec Orange Money
            </Link>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "20px 0 40px", flexWrap: "wrap" }}>
        <Link href="/catalogue" className="btn btn-primary">
          Continuer mes achats
        </Link>
        <Link href={`/suivi?q=${order.number}`} className="btn" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          Suivre ma commande
        </Link>
        <a
          href={`https://wa.me/${(process.env.SITE_WHATSAPP || "22600000000").replace(/\D/g, "")}?text=${encodeURIComponent(
            `Bonjour Tresor Empire, je confirme ma commande ${order.number} (${order.items.reduce((n, i) => n + i.qty, 0)} article(s), total ${money(order.total)}).`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ background: "#25D366", color: "#fff" }}
        >
          Confirmer sur WhatsApp
        </a>
      </div>
    </div>
  );
}
