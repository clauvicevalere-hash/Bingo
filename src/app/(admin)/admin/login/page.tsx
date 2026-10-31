import { redirect } from "next/navigation";
import { setAdminCookie } from "@/lib/auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
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
        <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>Espace admin</h1>
        <p className="muted small">Accès réservé à l&apos;équipe Bingo.</p>
        <form action={login}>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          {error ? <p style={{ color: "var(--danger)", fontSize: 13 }}>Mot de passe incorrect.</p> : null}
          <button className="btn btn-primary btn-block" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
