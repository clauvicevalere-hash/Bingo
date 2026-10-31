import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Publiés" },
  { key: "rejected", label: "Refusés" },
];

export default async function AdminReviews({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = status && ["pending", "approved", "rejected"].includes(status) ? status : "pending";

  const reviews = await db.review.findMany({
    where: { status: current },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await db.review.groupBy({ by: ["status"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.status, c._count._all]));

  async function setStatus(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    const next = String(formData.get("status"));
    if (!["approved", "rejected", "pending"].includes(next)) return;
    await db.review.update({ where: { id }, data: { status: next } });
    revalidatePath("/admin/avis");
  }

  async function remove(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.review.delete({ where: { id } });
    revalidatePath("/admin/avis");
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Avis clients</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Validez les avis avant publication. {countMap.get("pending") ?? 0} en attente.
      </p>

      <div className="tabs" style={{ margin: "14px 0" }}>
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/avis?status=${t.key}`} className={`tab${current === t.key ? " active" : ""}`}>
            {t.label} ({countMap.get(t.key) ?? 0})
          </Link>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Client</th>
            <th>Note</th>
            <th>Avis</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/p/${r.product.slug}`} target="_blank" style={{ fontWeight: 700 }}>
                  {r.product.name}
                </Link>
              </td>
              <td>
                {r.name}
                {r.phone ? <div className="muted tiny">{r.phone}</div> : null}
              </td>
              <td style={{ color: "#b7791f", whiteSpace: "nowrap" }}>{"★".repeat(r.rating)}</td>
              <td style={{ maxWidth: 380 }}>
                <div className="small">{r.comment}</div>
                <div className="muted tiny">{r.createdAt.toLocaleDateString("fr-FR")}</div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {current !== "approved" ? (
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="approved" />
                      <button className="tab" type="submit">Publier</button>
                    </form>
                  ) : null}
                  {current !== "rejected" ? (
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button className="tab" type="submit">Refuser</button>
                    </form>
                  ) : null}
                  <form action={remove}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="tab" type="submit">Supprimer</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {reviews.length === 0 ? (
            <tr><td colSpan={5} className="muted">Aucun avis dans cette catégorie.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
