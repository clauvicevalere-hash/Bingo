import Link from "next/link";
import { db } from "@/lib/db";
import { getCountryCode } from "@/lib/country";
import { COUNTRIES, countryByCode } from "@/lib/site";
import { GROUP_SLUGS } from "@/lib/groups";
import { categoryLabel } from "@/lib/fr";
import { ProductCard } from "@/components/ProductCard";
import { CountrySelect } from "@/components/CountrySelect";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const country = await getCountryCode();
  const info = countryByCode(country);

  const [categories, newProducts, bestSellers, total] = await Promise.all([
    db.category.findMany({
      where: { parentId: null, slug: { in: GROUP_SLUGS } },
      orderBy: { sort: "asc" },
    }),
    db.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: { where: { countryCode: country } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        category: true,
        stocks: { where: { countryCode: country } },
      },
      orderBy: { views: "desc" },
      take: 8,
    }),
    db.product.count({ where: { active: true } }),
  ]);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-inner">
          <div>
            <h1>
              La tech qui arrive
              <br />
              jusqu&apos;à vous.
            </h1>
            <p>
              Téléphones neufs et d&apos;occasion, ordinateurs, tablettes et gadgets vérifiés.
              Livraison à {info.name} et dans toute la sous-région — vous payez à la réception.
            </p>
            <div className="hero-cta">
              <Link href="/catalogue" className="btn btn-light">
                Voir le catalogue
              </Link>
              <Link href="/livraison" className="btn btn-ghost">
                Livraison &amp; paiement
              </Link>
            </div>
            <div className="trust-row">
              <span className="trust">🚚 Livraison 24–72 h</span>
              <span className="trust">💵 Paiement à la livraison</span>
              <span className="trust">📱 Orange Money</span>
              <span className="trust">✅ Produits vérifiés</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="" />
          </div>
        </div>
      </section>

      <div className="notice" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <span>
          Vous êtes livré au <b>{info.name}</b>. Prix affichés en FCFA, stock local.
        </span>
        <CountrySelect current={country} />
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Nos rayons</h2>
            <p>{total} produits disponibles au catalogue</p>
          </div>
          <Link href="/catalogue" className="link-more">
            Tout voir →
          </Link>
        </div>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} href={`/c/${c.slug}`} className="cat">
              <span className="cat-img">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" />
                ) : (
                  <span aria-hidden>{c.icon || "📦"}</span>
                )}
              </span>
              <span>{categoryLabel(c.slug, c.name)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Dernières arrivées</h2>
            <p>Les nouveautés reçues dans nos entrepôts</p>
          </div>
          <Link href="/catalogue?tri=nouveaux" className="link-more">
            Tout voir →
          </Link>
        </div>
        <div className="products">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Les plus demandés</h2>
            <p>Ce que nos clients achètent le plus</p>
          </div>
        </div>
        <div className="products">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { t: "Paiement à la livraison", d: "Vous inspectez le colis, puis vous payez. Zéro risque.", i: "💵" },
          { t: "Orange Money", d: "Payez depuis votre compte Orange Money, en toute sécurité.", i: "📲" },
          { t: "Garantie 7 jours", d: "Un souci à la réception ? On échange ou on rembourse.", i: "🛡️" },
        ].map((b) => (
          <div key={b.t} className="panel">
            <div style={{ fontSize: 26 }}>{b.i}</div>
            <h3 style={{ margin: "8px 0 6px", fontSize: 16 }}>{b.t}</h3>
            <p className="muted small" style={{ margin: 0 }}>{b.d}</p>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Nous livrons dans {COUNTRIES.length} pays</h2>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {COUNTRIES.map((c) => (
            <span key={c.code} className="chip" style={{ padding: "10px 14px" }}>
              {c.flag} {c.name} · {c.dialCode}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
