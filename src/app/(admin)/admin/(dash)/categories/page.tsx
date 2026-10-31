import Link from "next/link";
import { db } from "@/lib/db";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminCategories({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const [categories, counts] = await Promise.all([
    db.category.findMany({
      where: q ? { name: { contains: q } } : undefined,
      include: { parent: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      take: 500,
    }),
    db.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const parents = categories.filter((c) => !c.parentId).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, letterSpacing: "-0.02em" }}>Catégories</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        {categories.length} catégorie(s) affichée(s) — créez vos rayons et sous-rayons.
      </p>

      <CategoryForm parents={parents} />

      <form className="search" action="/admin/categories" style={{ maxWidth: 480, margin: "0 0 14px" }}>
        <input name="q" defaultValue={q ?? ""} placeholder="Rechercher une catégorie" />
        <button type="submit">Chercher</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Parent</th>
            <th>Slug</th>
            <th>Produits</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>
                <b>{c.icon} {c.name}</b>
              </td>
              <td className="muted">{c.parent?.name ?? "—"}</td>
              <td className="muted tiny">{c.slug}</td>
              <td><b>{countMap.get(c.id) ?? 0}</b></td>
              <td>
                <Link href={`/c/${c.slug}`} target="_blank" className="tab">Voir ↗</Link>
              </td>
            </tr>
          ))}
          {categories.length === 0 ? (
            <tr><td colSpan={5} className="muted">Aucune catégorie.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
