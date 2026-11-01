import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import { PageTracker } from "@/components/Tracker";
import { baseUrl } from "@/lib/base-url";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://bingo-8itp.onrender.com"),
  title: {
    default: "Tresor Empire — Téléphones & high-tech livrés en Afrique de l'Ouest",
    template: "%s · Tresor Empire",
  },
  description:
    "Achetez téléphones neufs et d'occasion, ordinateurs, tablettes et gadgets. Livraison au Burkina Faso, Mali, Niger et Côte d'Ivoire. Paiement à la livraison et Orange Money.",
  manifest: "/manifest.webmanifest",
  applicationName: "Tresor Empire",
  appleWebApp: { capable: true, title: "Tresor Empire", statusBarStyle: "default" },
  openGraph: {
    title: "Tresor Empire — High-tech livré chez vous",
    description: "Téléphones, ordinateurs et gadgets authentiques. Paiement à la réception.",
    type: "website",
    images: [{ url: "/brand/logo.png", width: 965, height: 925, alt: "Tresor Empire" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tresor Empire — High-tech livré chez vous",
    description: "Téléphones, ordinateurs et gadgets authentiques. Paiement à la réception.",
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#d90b1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const site = (await baseUrl()).replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Tresor Empire",
        url: site,
        logo: `${site}/brand/logo.png`,
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: settings.phone,
            contactType: "customer service",
            areaServed: ["BF", "ML", "NE", "CI"],
            availableLanguage: ["fr"],
          },
        ],
      },
      {
        "@type": "WebSite",
        name: "Tresor Empire",
        url: site,
        potentialAction: {
          "@type": "SearchAction",
          target: `${site}/catalogue?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="fr">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <BottomNav />
        <PwaRegister />
        <PageTracker />
      </body>
    </html>
  );
}
