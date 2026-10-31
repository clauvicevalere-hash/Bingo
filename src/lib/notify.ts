import { db } from "./db";

export type NotifyInput = {
  type: string;
  title: string;
  body?: string;
  link?: string;
};

/** Crée une alerte interne visible dans le back-office. */
export async function notify({ type, title, body = "", link = "" }: NotifyInput) {
  try {
    await db.notification.create({ data: { type, title, body, link } });
  } catch (error) {
    console.error("notification", error);
  }
}

export async function notifyOrder(number: string, total: number, name: string, id: number) {
  await notify({
    type: "order_new",
    title: `Nouvelle commande ${number}`,
    body: `${name} · ${new Intl.NumberFormat("fr-FR").format(total)} FCFA`,
    link: `/admin/commandes/${id}`,
  });
}

export async function notifyStatus(number: string, status: string) {
  await notify({
    type: "order_status",
    title: `Commande ${number} : ${status}`,
    body: "Le statut de la commande a été modifié.",
    link: `/admin/commandes`,
  });
}
