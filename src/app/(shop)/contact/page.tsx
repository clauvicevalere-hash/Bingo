export const metadata = { title: "Contact" };

const PHONE = process.env.SITE_PHONE || "+226 00 00 00 00";
const WHATSAPP = process.env.SITE_WHATSAPP || "22600000000";
const EMAIL = process.env.SITE_EMAIL || "contact@tresorempire.com";
const ADDRESS = process.env.SITE_ADDRESS || "Ouagadougou, Burkina Faso";

export default function ContactPage() {
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 className="page-title">Nous contacter</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Une question sur un produit, une commande ou une livraison ? Écrivez-nous.
      </p>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <a className="panel" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
          <div style={{ fontSize: 26 }}>💬</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: 16 }}>WhatsApp</h3>
          <p className="muted small" style={{ margin: 0 }}>{PHONE}</p>
          <p className="small" style={{ margin: "8px 0 0", color: "var(--brand)", fontWeight: 700 }}>Ouvrir la discussion →</p>
        </a>
        <a className="panel" href={`tel:${PHONE.replace(/\s/g, "")}`}>
          <div style={{ fontSize: 26 }}>📞</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: 16 }}>Téléphone</h3>
          <p className="muted small" style={{ margin: 0 }}>{PHONE}</p>
          <p className="small" style={{ margin: "8px 0 0", color: "var(--brand)", fontWeight: 700 }}>Appeler →</p>
        </a>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Coordonnées</h3>
        <p className="small" style={{ lineHeight: 1.8, margin: 0 }}>
          <b>Tresor Empire</b>
          <br />
          {ADDRESS}
          <br />
          E-mail : {EMAIL}
          <br />
          Horaires : lundi – samedi, 8 h – 20 h
        </p>
      </div>
    </div>
  );
}
