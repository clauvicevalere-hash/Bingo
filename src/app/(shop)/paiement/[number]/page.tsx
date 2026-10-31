import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { orangeConfig } from "@/lib/orange";
import { OrangePayButton } from "@/components/OrangePayButton";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({ where: { number }, include: { items: true } });
  if (!order) notFound();
  if (order.paymentMethod === "COD" || order.paymentStatus === "paid") {
    redirect(`/commande/${order.number}`);
  }

  const cfg = orangeConfig();

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="crumbs">
        <Link href={`/commande/${order.number}`}>Commande {order.number}</Link> <span>/</span>
        <span>Paiement</span>
      </div>

      <h1 className="page-title">Payer avec Orange Money</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Vous allez être redirigé vers la page sécurisée Orange Money. La commande sera confirmée
        dès réception du paiement.
      </p>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="summary-row">
          <span>Commande</span>
          <b>{order.number}</b>
        </div>
        <div className="summary-row">
          <span>Articles</span>
          <b>{order.items.reduce((n, i) => n + i.qty, 0)}</b>
        </div>
        <div className="summary-row total">
          <span>Montant à payer</span>
          <span>{money(order.total)}</span>
        </div>

        <div style={{ marginTop: 16 }}>
          {cfg.mode === "mock" ? (
            <>
              <div className="notice" style={{ marginBottom: 12 }}>
                Mode test : aucun débit réel. Le parcours complet est simulé pour valider
                l&apos;intégration avant la mise en production.
              </div>
              <OrangePayButton number={order.number} amount={order.total} />
            </>
          ) : (
            <OrangePayButton number={order.number} amount={order.total} />
          )}
        </div>

        <p className="muted tiny" style={{ textAlign: "center", marginTop: 12, marginBottom: 0 }}>
          Un problème ? <Link href="/contact" style={{ color: "var(--brand)", fontWeight: 700 }}>Contactez-nous</Link>
        </p>
      </div>

      <p style={{ textAlign: "center", marginTop: 16 }}>
        <Link href={`/commande/${order.number}`} className="muted small">
          Payer plutôt à la livraison ?
        </Link>
      </p>
    </div>
  );
}
