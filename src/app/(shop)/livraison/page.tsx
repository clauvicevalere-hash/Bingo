import { db } from "@/lib/db";
import { money } from "@/lib/site";

export const dynamic = "force-dynamic";

const NAMES: Record<string, string> = {
  BF: "Burkina Faso",
  ML: "Mali",
  NE: "Niger",
  CI: "Côte d'Ivoire",
};

export default async function DeliveryPage() {
  const cities = await db.city.findMany({
    where: { active: true },
    orderBy: [{ countryCode: "asc" }, { deliveryFee: "asc" }],
  });

  const grouped = ["BF", "ML", "NE", "CI"].map((code) => ({
    code,
    cities: cities.filter((c) => c.countryCode === code),
  }));

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h1 className="page-title">Livraison &amp; paiement</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Nous livrons depuis nos stocks locaux au Burkina Faso, au Mali, au Niger et en Côte d&apos;Ivoire.
      </p>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Délais</h2>
        <p className="small" style={{ lineHeight: 1.7 }}>
          Commande préparée sous 24 h ouvrées. Livraison en <b>24 à 72 h</b> dans les grandes villes,
          jusqu&apos;à 5 jours pour les zones reculées. Le livreur vous appelle avant de passer.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Frais de livraison par ville</h2>
        {grouped.map((g) => (
          <div key={g.code} style={{ marginTop: 14 }}>
            <b>{NAMES[g.code]}</b>
            <table className="table" style={{ marginTop: 8 }}>
              <tbody>
                {g.cities.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td style={{ textAlign: "right" }}><b>{money(c.deliveryFee)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Paiement</h2>
        <p className="small" style={{ lineHeight: 1.7 }}>
          <b>Paiement à la livraison (espèces)</b> : vous vérifiez le colis, puis vous payez.
          <br />
          <b>Orange Money</b> : en cours d&apos;activation. Le paiement mobile sera disponible
          directement dans l&apos;application dès validation du compte marchand.
        </p>
      </div>
    </div>
  );
}
