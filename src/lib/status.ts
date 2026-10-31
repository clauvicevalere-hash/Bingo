export const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const STATUS_FLOW = ["new", "confirmed", "shipped", "delivered"] as const;

export function paymentLabel(method: string) {
  return method === "COD" ? "Paiement à la livraison" : "Orange Money";
}

export function paymentStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Payé";
    case "awaiting_payment":
      return "En attente de paiement";
    case "refunded":
      return "Remboursé";
    default:
      return "À encaisser";
  }
}
