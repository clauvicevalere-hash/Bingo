export const metadata = { title: "Retours & garantie" };

export default function ReturnsPage() {
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Retours &amp; garantie</h1>
      <div className="panel">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>7 jours pour changer d&apos;avis</h2>
        <p className="small" style={{ lineHeight: 1.8 }}>
          Vous disposez de <b>7 jours</b> après réception pour signaler un problème : produit
          non conforme, défaut à l&apos;allumage, pièce manquante. Nous échangeons le produit ou
          nous vous remboursons.
        </p>

        <h2 style={{ fontSize: 18 }}>Conditions</h2>
        <ul className="small" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
          <li>Le produit doit être dans son état d&apos;origine, avec ses accessoires.</li>
          <li>La facture ou le numéro de commande est nécessaire.</li>
          <li>Les produits d&apos;hygiène (écouteurs intra-auriculaires) ne sont repris qu&apos;en cas de défaut.</li>
          <li>Les frais de retour sont à notre charge si le défaut vient de nous.</li>
        </ul>

        <h2 style={{ fontSize: 18 }}>Garantie</h2>
        <p className="small" style={{ lineHeight: 1.8 }}>
          Les téléphones neufs bénéficient d&apos;une garantie de <b>3 mois</b> sur les défauts
          matériels (hors casse, oxydation et mauvaise utilisation). Les produits d&apos;occasion
          sont testés et vendus avec une garantie de <b>7 jours</b>.
        </p>
      </div>
    </div>
  );
}
