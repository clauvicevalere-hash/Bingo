import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { setAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const h = await headers();
    const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
    const limit = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.ok) redirect("/admin/login?error=locked");

    const password = String(formData.get("password") ?? "");
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      redirect("/admin/login?error=1");
    }
    await setAdminCookie();
    redirect("/admin");
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Tresor Empire" style={{ width: 44, height: 44, objectFit: "contain" }} />
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
            Tresor <span style={{ color: "var(--brand)" }}>Empire</span>
          </div>
        </div>
        <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>Espace admin</h1>
        <p className="muted small">Accès réservé à l&apos;équipe Tresor Empire.</p>
        <form action={login}>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          {error === "locked" ? (
            <p style={{ color: "var(--danger)", fontSize: 13 }}>
              Trop de tentatives. Réessayez dans 15 minutes.
            </p>
          ) : error ? (
            <p style={{ color: "var(--danger)", fontSize: 13 }}>Mot de passe incorrect.</p>
          ) : null}
          <button className="btn btn-primary btn-block" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
