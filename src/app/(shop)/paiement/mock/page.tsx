import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { orangeConfig } from "@/lib/orange";
import { MockConfirm } from "@/components/MockConfirm";

export const dynamic = "force-dynamic";

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;
  const cfg = orangeConfig();
  if (cfg.mode !== "mock") notFound();
  if (!orderNumber || !token) notFound();

  const order = await db.order.findUnique({ where: { number: orderNumber } });
  if (!order) notFound();

  const expected = order.paymentRef.startsWith("MOCK:") ? order.paymentRef.slice(5) : "";
  const valid = expected && expected === token;

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="panel" style={{ marginTop: 30, padding: 0, overflow: "hidden" }}>
        <div style={{ background: "#ff7900", color: "#fff", padding: "22px 22px 18px" }}>
          <div style={{ fontSize: 13, opacity: 0.9, letterSpacing: "0.08em", fontWeight: 700 }}>
            ORANGE MONEY
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{money(order.total)}</div>
          <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>Commande {order.number}</div>
        </div>

        <div style={{ padding: 22 }}>
          <div className="notice" style={{ marginBottom: 16 }}>
            Environnement de test — aucun montant ne sera débité.
          </div>

          {valid ? (
            <>
              <p className="small" style={{ lineHeight: 1.6 }}>
                Paiement demandé par <b>Bingo</b> pour <b>{order.customerName}</b> ({order.phone}).
                <br />
                Ville de livraison : {order.city}, {order.countryCode}.
              </p>
              <MockConfirm number={order.number} token={token} />
              <p style={{ textAlign: "center", marginTop: 12, marginBottom: 0 }}>
                <Link href={`/commande/${order.number}`} className="muted small">
                  Annuler et revenir à la commande
                </Link>
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "var(--danger)", fontWeight: 600 }}>Lien de paiement invalide ou expiré.</p>
              <Link href={`/paiement/${order.number}`} className="btn btn-primary btn-block">
                Recommencer le paiement
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
