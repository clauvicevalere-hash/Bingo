import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { CheckoutForm } from "@/components/CheckoutForm";
import { orangeConfig } from "@/lib/orange";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const country = await getCountryCode();
  const cities = await db.city.findMany({
    where: { active: true },
    orderBy: [{ countryCode: "asc" }, { deliveryFee: "asc" }],
  });
  const orange = orangeConfig();

  return (
    <div className="container">
      <h1 className="page-title">Finaliser la commande</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Livraison locale, paiement à la réception. Aucun compte requis.
      </p>
      <CheckoutForm
        defaultCountry={country}
        orangeEnabled={orange.enabled}
        orangeMock={orange.mode === "mock"}
        cities={cities.map((c) => ({
          id: c.id,
          countryCode: c.countryCode,
          name: c.name,
          deliveryFee: c.deliveryFee,
          freeAbove: c.freeAbove,
        }))}
      />
    </div>
  );
}
