export const metadata = { title: "Mentions légales" };

export default function LegalPage() {
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Mentions légales</h1>
      <div className="panel prose" style={{ lineHeight: 1.8 }}>
        <p>
          <b>Bingo</b> — boutique de téléphonie et de high-tech. Les informations d&apos;immatriculation
          (RCCM, IFU, adresse du siège) seront complétées avant la mise en ligne publique.
        </p>
        <h3>Données personnelles</h3>
        <p>
          Les informations collectées (nom, téléphone, adresse) servent uniquement à traiter et
          livrer vos commandes. Elles ne sont ni revendues ni cédées à des tiers. Vous pouvez
          demander leur suppression en nous contactant.
        </p>
        <h3>Prix</h3>
        <p>
          Les prix sont affichés en francs CFA (XOF), toutes taxes comprises. Les frais de
          livraison sont ajoutés selon la ville choisie.
        </p>
        <h3>Propriété intellectuelle</h3>
        <p>
          Les visuels produits appartiennent à leurs détenteurs respectifs et sont utilisés pour
          la présentation des articles vendus.
        </p>
      </div>
    </div>
  );
}
