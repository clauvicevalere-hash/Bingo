import { getSiteSettings, telHref, waDigits } from "@/lib/settings";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 className="page-title">Nous contacter</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Une question sur un produit, une commande ou une livraison ? Écrivez-nous.
      </p>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <a className="panel" href={`https://wa.me/${waDigits(settings.whatsapp)}`} target="_blank" rel="noreferrer">
          <div style={{ fontSize: 26 }}>💬</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: 16 }}>WhatsApp</h3>
          <p className="muted small" style={{ margin: 0 }}>{settings.whatsapp}</p>
          <p className="small" style={{ margin: "8px 0 0", color: "var(--brand)", fontWeight: 700 }}>Ouvrir la discussion →</p>
        </a>
        <a className="panel" href={telHref(settings.phone)}>
          <div style={{ fontSize: 26 }}>📞</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: 16 }}>Téléphone</h3>
          <p className="muted small" style={{ margin: 0 }}>{settings.phone}</p>
          <p className="small" style={{ margin: "8px 0 0", color: "var(--brand)", fontWeight: 700 }}>Appeler →</p>
        </a>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Coordonnées</h3>
        <p className="small" style={{ lineHeight: 1.8, margin: 0 }}>
          <b>Tresor Empire</b>
          <br />
          {settings.address}
          <br />
          E-mail : {settings.email}
          <br />
          Horaires : lundi – samedi, 8 h – 20 h
        </p>
      </div>
    </div>
  );
}
