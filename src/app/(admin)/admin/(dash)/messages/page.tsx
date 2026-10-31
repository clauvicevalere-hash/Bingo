import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { telHref, waDigits } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  async function mark(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    const status = String(formData.get("status") || "read");
    if (id) await db.contactMessage.update({ where: { id }, data: { status } });
    revalidatePath("/admin/messages");
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>Messages clients</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Messages envoyés depuis la page contact.
      </p>

      <div className="panel" style={{ padding: 0 }}>
        {messages.length === 0 ? (
          <p className="muted small" style={{ padding: 16, margin: 0 }}>Aucun message pour le moment.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <b>{m.name}</b>{" "}
                  <span className="muted small">· {m.phone}</span>
                  {m.email ? <span className="muted small"> · {m.email}</span> : null}
                </div>
                <span className="tag" style={{ background: m.status === "new" ? "var(--brand)" : "var(--line)", color: m.status === "new" ? "#fff" : "var(--ink)" }}>
                  {m.status === "new" ? "Nouveau" : m.status === "replied" ? "Répondu" : "Lu"}
                </span>
              </div>
              <p className="small" style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{m.message}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a className="tab" href={`https://wa.me/${waDigits(m.phone)}`} target="_blank" rel="noreferrer">WhatsApp →</a>
                <a className="tab" href={telHref(m.phone)}>Appeler →</a>
                <form action={mark}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value="read" />
                  <button className="tab" type="submit">Marquer lu</button>
                </form>
                <form action={mark}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value="replied" />
                  <button className="tab" type="submit">Marquer répondu</button>
                </form>
              </div>
              <div className="muted tiny" style={{ marginTop: 6 }}>{m.createdAt.toLocaleString("fr-FR")}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
