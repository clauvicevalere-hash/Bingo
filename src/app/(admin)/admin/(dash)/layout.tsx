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
        <div style={{ fontWeight: 800, fontSize: 20, color: "#fff", padding: "0 12px 18px" }}>
          Bingo<span style={{ color: "#ffb27a" }}>.</span>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#8e837b", letterSpacing: "0.08em" }}>ADMIN</div>
        </div>
        <Link href="/admin">Tableau de bord</Link>
        <Link href="/admin/commandes">Commandes</Link>
        <Link href="/admin/produits">Produits</Link>
        <Link href="/admin/categories">Catégories</Link>
        <Link href="/admin/avis">Avis clients</Link>
        <Link href="/admin/stocks">Stocks</Link>
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
