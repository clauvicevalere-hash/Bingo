import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, clearAdminCookie } from "@/lib/auth";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  async function logout() {
    "use server";
    await clearAdminCookie();
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Tresor Empire" />
          <div>
            <b>TRESOR EMPIRE</b>
            <span>ADMIN</span>
          </div>
        </div>
        <Link href="/admin">Tableau de bord</Link>
        <Link href="/admin/commandes">Commandes</Link>
        <Link href="/admin/produits">Produits</Link>
        <Link href="/admin/categories">Catégories</Link>
        <Link href="/admin/avis">Avis clients</Link>
        <Link href="/admin/stocks">Stocks</Link>
        <Link href="/admin/parametres">Paramètres</Link>
        <Link href="/" target="_blank">Voir la boutique ↗</Link>
        <form action={logout} style={{ marginTop: 18, padding: "0 4px" }}>
          <button type="submit" style={{ background: "none", border: 0, color: "#8e837b", fontSize: 13, padding: "8px 12px" }}>
            Se déconnecter
          </button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
