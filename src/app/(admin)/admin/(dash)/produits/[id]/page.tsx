import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminProductEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;
  const productId = Number(id);

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { sort: "asc" } },
        variants: true,
        stocks: { include: { variant: true, country: true } },
        category: true,
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  async function save(formData: FormData) {
    "use server";
    const pid = Number(formData.get("id"));
    const price = Math.max(0, Math.round(Number(formData.get("price")) || 0));
    const oldPriceRaw = Number(formData.get("oldPrice"));
    const oldPrice = oldPriceRaw > price ? Math.round(oldPriceRaw) : null;
    const categoryId = Number(formData.get("categoryId")) || null;

    await db.product.update({
      where: { id: pid },
      data: {
        price,
        oldPrice,
        categoryId,
        condition: String(formData.get("condition") ?? "Neuf"),
        active: formData.get("active") === "on",
        featured: formData.get("featured") === "on",
      },
    });

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("stock_")) {
        const stockId = Number(key.slice(6));
        const qty = Math.max(0, Math.round(Number(value) || 0));
        if (stockId) await db.stock.update({ where: { id: stockId }, data: { qty } });
      }
    }

    revalidatePath("/admin/produits");
    redirect(`/admin/produits/${pid}?ok=1`);
  }

  const countries = ["BF", "ML", "NE", "CI"];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, letterSpacing: "-0.02em" }}>{product.name}</h1>
        <Link href="/admin/produits" className="tab">← Retour</Link>
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        {product.slug} · {product.category?.name}
      </p>

      {ok ? <div className="notice" style={{ marginBottom: 14 }}>Modifications enregistrées.</div> : null}

      <form action={save}>
        <input type="hidden" name="id" value={product.id} />

        <div className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Informations</h3>
          <div className="grid-2">
            <div className="field">
              <label>Prix de vente (FCFA)</label>
              <input name="price" type="number" defaultValue={product.price} min={0} step={50} />
            </div>
            <div className="field">
              <label>Ancien prix (barré, optionnel)</label>
              <input name="oldPrice" type="number" defaultValue={product.oldPrice ?? 0} min={0} step={50} />
            </div>
            <div className="field">
              <label>Catégorie</label>
              <select name="categoryId" defaultValue={product.categoryId ?? ""}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>État</label>
              <select name="condition" defaultValue={product.condition}>
                <option>Neuf</option>
                <option>Occasion</option>
                <option>Reconditionné</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
            <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <input type="checkbox" name="active" defaultChecked={product.active} /> Visible en boutique
            </label>
            <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <input type="checkbox" name="featured" defaultChecked={product.featured} /> Mis en avant
            </label>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Stock par pays</h3>
          <p className="muted tiny" style={{ marginTop: 0 }}>
            Le stock est décrémenté automatiquement à chaque commande.
          </p>

          <div style={{ display: "grid", gap: 18 }}>
            {countries.map((code) => {
              const rows = product.stocks.filter((s) => s.countryCode === code);
              return (
                <div key={code}>
                  <b style={{ fontSize: 13.5 }}>{code}</b>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 8 }}>
                    {rows.map((s) => (
                      <div key={s.id} className="field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>{!s.variantId ? "Base (sans variante)" : s.variant?.label ?? "Variante"}</label>
                        <input name={`stock_${s.id}`} type="number" min={0} defaultValue={s.qty} />
                      </div>
                    ))}
                    {rows.length === 0 && <span className="muted tiny">Aucune ligne de stock.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Enregistrer</button>
      </form>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Images</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {product.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" style={{ width: 72, height: 72, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 8 }} />
          ))}
          {product.images.length === 0 && <span className="muted tiny">Aucune image.</span>}
        </div>
        <p className="muted tiny" style={{ marginBottom: 0 }}>
          Prix actuel : <b>{money(product.price)}</b>
        </p>
      </div>
    </div>
  );
}
