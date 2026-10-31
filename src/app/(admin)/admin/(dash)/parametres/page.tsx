import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSiteSettings, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const settings = await getSiteSettings();

  async function save(formData: FormData) {
    "use server";
    for (const key of SETTING_KEYS) {
      const value = String(formData.get(key) || "").trim();
      if (!value) continue;
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    revalidatePath("/", "layout");
    redirect("/admin/parametres?ok=1");
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>Paramètres</h1>
        <Link href="/admin" className="tab">← Tableau de bord</Link>
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Ces coordonnées sont utilisées sur la boutique, les fiches produit et les confirmations
        de commande.
      </p>

      {ok ? <div className="notice" style={{ marginBottom: 14 }}>Coordonnées enregistrées.</div> : null}

      <form action={save} className="panel">
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Contact</h3>
        <div className="field">
          <label htmlFor="whatsapp">Numéro WhatsApp</label>
          <input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+971 56 893 4905" />
          <p className="muted tiny" style={{ margin: "6px 0 0" }}>
            Utilisé pour le bouton « Commander sur WhatsApp » et la page contact.
          </p>
        </div>
        <div className="field">
          <label htmlFor="phone">Numéro d&apos;appel</label>
          <input id="phone" name="phone" defaultValue={settings.phone} placeholder="+226 76 95 00 89" />
          <p className="muted tiny" style={{ margin: "6px 0 0" }}>
            Affiché sur la page contact et le pied de page.
          </p>
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" defaultValue={settings.email} />
        </div>
        <div className="field">
          <label htmlFor="address">Adresse</label>
          <input id="address" name="address" defaultValue={settings.address} />
        </div>

        <button type="submit" className="btn btn-primary">Enregistrer</button>
      </form>

      <div className="panel" style={{ marginTop: 14 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Aperçu des liens</h3>
        <p className="small" style={{ margin: 0 }}>
          WhatsApp : <b>https://wa.me/{settings.whatsapp.replace(/\D/g, "")}</b>
          <br />
          Appel : <b>{settings.phone}</b>
        </p>
      </div>
    </div>
  );
}
