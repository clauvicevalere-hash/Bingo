import Link from "next/link";
import { db } from "@/lib/db";
import { NewProductForm } from "@/components/admin/NewProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    include: { parent: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>Nouveau produit</h1>
        <Link href="/admin/produits" className="tab">← Produits</Link>
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Le produit sera visible immédiatement si vous le laissez actif.
      </p>

      <NewProductForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parent: c.parent?.name,
        }))}
      />
    </div>
  );
}
