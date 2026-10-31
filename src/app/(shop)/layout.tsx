import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: {
    default: "Bingo — Téléphones & high-tech livrés en Afrique de l'Ouest",
    template: "%s · Bingo",
  },
  description:
    "Achetez téléphones neufs et d'occasion, ordinateurs, tablettes et gadgets. Livraison au Burkina Faso, Mali, Niger et Côte d'Ivoire. Paiement à la livraison et Orange Money.",
  manifest: "/manifest.webmanifest",
  applicationName: "Bingo",
  appleWebApp: { capable: true, title: "Bingo", statusBarStyle: "default" },
  openGraph: {
    title: "Bingo — High-tech livré chez vous",
    description: "Téléphones, ordinateurs et gadgets authentiques. Paiement à la réception.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f26a1b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <BottomNav />
        <PwaRegister />
      </body>
    </html>
  );
}
