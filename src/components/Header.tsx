import Link from "next/link";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { countryByCode } from "@/lib/site";
import { GROUP_SLUGS } from "@/lib/groups";
import { categoryLabel } from "@/lib/fr";
import { WishlistLink } from "@/components/WishlistLink";
import { CartBadge } from "./CartBadge";
import { CountrySelect } from "./CountrySelect";

export async function Header() {
  const [country, categories] = await Promise.all([
    getCountryCode(),
    db.category.findMany({
      where: { parentId: null, slug: { in: GROUP_SLUGS } },
      orderBy: { sort: "asc" },
      take: 8,
    }),
  ]);
  const info = countryByCode(country);

  return (
    <header className="header">
      <div className="strip">
        <div className="container">
          <span>
            Livraison <b>{info.name}</b> et toute la sous-région · Paiement à la livraison
          </span>
          <span className="muted" style={{ opacity: 0.65 }}>
            {info.flag} {info.dialCode}
          </span>
        </div>
      </div>
      <div className="container header-main">
        <Link href="/" className="logo" aria-label="Tresor Empire, accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Tresor Empire" className="logo-img" />
          <span className="brand-word">Tresor <em>Empire</em></span>
        </Link>
        <form className="search" action="/recherche" role="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8d827a" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input name="q" placeholder="Rechercher un téléphone, un ordinateur, une montre…" aria-label="Rechercher" />
          <button type="submit">Rechercher</button>
        </form>
        <div className="header-actions">
          <CountrySelect current={country} />
          <WishlistLink />
          <CartBadge />
        </div>
      </div>
      <nav className="nav" aria-label="Catégories">
        <div className="container">
          <Link href="/catalogue">Tout le catalogue</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/c/${c.slug}`}>
              {categoryLabel(c.slug, c.name)}
            </Link>
          ))}
          <Link href="/suivi">Suivre ma commande</Link>
        </div>
      </nav>
    </header>
  );
}
