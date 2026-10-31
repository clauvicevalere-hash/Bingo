import Link from "next/link";
import { COUNTRIES } from "@/lib/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <div className="logo" style={{ color: "#fff", marginBottom: 10 }}>
            <span className="logo-mark">B</span>
            Bingo<span style={{ color: "#ffb27a" }}>.</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#a99f97", maxWidth: "34ch" }}>
            Téléphones, ordinateurs et gadgets authentiques, livrés au Burkina Faso, au Mali,
            au Niger et en Côte d&apos;Ivoire. Vous payez à la réception.
          </p>
        </div>
        <div>
          <h4>Pays desservis</h4>
          {COUNTRIES.map((c) => (
            <span key={c.code} style={{ display: "block", padding: "4px 0", fontSize: 13.5 }}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>
        <div>
          <h4>Boutique</h4>
          <Link href="/catalogue">Tout le catalogue</Link>
          <Link href="/suivi">Suivre une commande</Link>
          <Link href="/panier">Mon panier</Link>
          <Link href="/contact">Nous contacter</Link>
        </div>
        <div>
          <h4>Aide</h4>
          <Link href="/livraison">Livraison &amp; paiement</Link>
          <Link href="/retours">Retours &amp; garantie</Link>
          <Link href="/mentions">Mentions légales</Link>
          <Link href="/admin">Espace admin</Link>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Bingo — Tous droits réservés · Prix en FCFA (XOF)
      </div>
    </footer>
  );
}
