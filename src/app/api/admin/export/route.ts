import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { csvResponse } from "@/lib/csv";

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });

  const type = new URL(req.url).searchParams.get("type") || "orders";

  if (type === "products") {
    const products = await db.product.findMany({
      include: { category: true, brand: true, stocks: true },
      orderBy: { createdAt: "desc" },
    });
    const rows: (string | number)[][] = [
      ["ID", "Nom", "SKU", "Catégorie", "Marque", "État", "Prix", "Prix barré", "Prix marché", "Coût AED", "Fret", "Stock total", "Actif", "Créé le"],
    ];
    for (const p of products) {
      rows.push([
        p.id,
        p.name,
        p.sku,
        p.category?.name ?? "",
        p.brand?.name ?? "",
        p.condition,
        p.price,
        p.oldPrice ?? "",
        p.marketPrice ?? "",
        p.supplierPriceAed ?? "",
        p.logisticsCost,
        p.stocks.reduce((n, s) => n + s.qty, 0),
        p.active ? "oui" : "non",
        p.createdAt.toISOString().slice(0, 10),
      ]);
    }
    return csvResponse("tresor-empire-produits.csv", rows);
  }

  const orders = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const rows: (string | number)[][] = [
    ["Numéro", "Date", "Client", "Téléphone", "WhatsApp", "Pays", "Ville", "Adresse", "Articles", "Sous-total", "Livraison", "Total", "Paiement", "Statut paiement", "Statut", "Note"],
  ];
  for (const o of orders) {
    rows.push([
      o.number,
      o.createdAt.toISOString(),
      o.customerName,
      o.phone,
      o.whatsapp ?? "",
      o.countryCode,
      o.city,
      o.address,
      o.items.map((i) => `${i.qty}× ${i.name}`).join(" | "),
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      o.note ?? "",
    ]);
  }
  return csvResponse("tresor-empire-commandes.csv", rows);
}
