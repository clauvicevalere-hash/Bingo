import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/site";
import { VariantManager } from "@/components/admin/VariantManager";
import { ImageManager } from "@/components/admin/ImageManager";
import { computePrice, defaultsFor, type ProfitMode } from "@/lib/pricing";
import { computeOldPrice, type OldPriceMode } from "@/lib/marketing";

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

  const landedCost = product.supplierPriceAed
    ? computePrice({
        costAed: product.supplierPriceAed,
        logistics: product.logisticsCost,
        mode: "percent",
        value: 0,
        minProfit: 0,
        maxProfit: 0,
        roundTo: 500,
      }).landed
    : null;
  const marketMargin =
    landedCost != null && product.marketPrice ? product.marketPrice - landedCost : null;

  async function save(formData: FormData) {
    "use server";
    const pid = Number(formData.get("id"));
    const categoryId = Number(formData.get("categoryId")) || null;

    const pricingMode = formData.get("pricingMode") === "manual" ? "manual" : "auto";
    const supplierPriceAed = Number(formData.get("supplierPriceAed")) || 0;
    const marketPrice = Math.round(Number(formData.get("marketPrice")) || 0) || null;
    const logisticsCost = Math.round(Number(formData.get("logisticsCost")) || 0);
    const profitModeRaw = String(formData.get("profitMode") || "percent");
    const profitMode: ProfitMode =
      profitModeRaw === "fixed" ? "fixed" : profitModeRaw === "tiered" ? "tiered" : "percent";
    const tiered = profitMode === "tiered";
    const profitValue = tiered ? 0 : Number(formData.get("profitValue")) || 0;
    const minProfit = tiered ? 0 : Math.round(Number(formData.get("minProfit")) || 0);
    const maxProfit = tiered ? 0 : Math.round(Number(formData.get("maxProfit")) || 0);
    const roundTo = Math.round(Number(formData.get("roundTo")) || 500);

    const category = categoryId
      ? await db.category.findUnique({ where: { id: categoryId }, include: { parent: true } })
      : null;
    const tiers = defaultsFor(category?.parent?.slug ?? category?.slug ?? "").tiers;

    let price = Math.max(0, Math.round(Number(formData.get("price")) || 0));
    if (pricingMode === "auto" && supplierPriceAed > 0) {
      price = computePrice({
        costAed: supplierPriceAed,
        logistics: logisticsCost,
        mode: profitMode,
        value: profitValue,
        minProfit,
        maxProfit,
        roundTo,
        tiers,
      }).price;
    }

    const oldPriceModeRaw = String(formData.get("oldPriceMode") || "none");
    const oldPriceMode: OldPriceMode =
      oldPriceModeRaw === "percent" || oldPriceModeRaw === "fixed" ? oldPriceModeRaw : "none";
    const oldPriceValue = Number(formData.get("oldPriceValue")) || 0;
    const showOldPrice = formData.get("showOldPrice") === "on";
    const showDiscountBadge = formData.get("showDiscountBadge") === "on";
    const oldPrice = showOldPrice ? computeOldPrice(price, oldPriceMode, oldPriceValue, roundTo) : null;

    await db.product.update({
      where: { id: pid },
      data: {
        price,
        oldPrice,
        oldPriceMode,
        oldPriceValue,
        showOldPrice,
        showDiscountBadge,
        supplierPriceAed: supplierPriceAed || null,
        marketPrice,
        logisticsCost,
        profitMode,
        profitValue,
        minProfit,
        maxProfit,
        pricingMode,
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

  const variantData = product.variants.map((v) => ({
    id: v.id,
    label: v.label,
    price: v.price,
    oldPrice: v.oldPrice,
    stocks: Object.fromEntries(
      countries.map((code) => [
        code,
        product.stocks
          .filter((s) => s.variantId === v.id && s.countryCode === code)
          .reduce((n, s) => n + s.qty, 0),
      ])
    ) as Record<string, number>,
  }));

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
              <label>Prix fournisseur (AED)</label>
              <input name="supplierPriceAed" type="number" defaultValue={product.supplierPriceAed ?? ""} min={0} step="0.01" />
            </div>
            <div className="field">
              <label>Prix du marché (FCFA, optionnel)</label>
              <input name="marketPrice" type="number" defaultValue={product.marketPrice ?? ""} min={0} step={500} />
            </div>
            <div className="field">
              <label>Fret + douane (FCFA)</label>
              <input name="logisticsCost" type="number" defaultValue={product.logisticsCost} min={0} step={500} />
            </div>
            <div className="field">
              <label>Bénéfice</label>
              <select name="profitMode" defaultValue={product.profitMode}>
                <option value="percent">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
                <option value="tiered">Par tranche (téléphones)</option>
              </select>
            </div>
            <div className="field">
              <label>Valeur du bénéfice</label>
              <input name="profitValue" type="number" defaultValue={product.profitValue} min={0} step="0.1" />
            </div>
            <div className="field">
              <label>Mode de prix</label>
              <select name="pricingMode" defaultValue={product.pricingMode}>
                <option value="auto">Automatique</option>
                <option value="manual">Manuel</option>
              </select>
            </div>
            <div className="field">
              <label>Prix de vente (FCFA)</label>
              <input name="price" type="number" defaultValue={product.price} min={0} step={50} />
            </div>
            <div className="field">
              <label>Prix barré (marketing)</label>
              <select name="oldPriceMode" defaultValue={product.oldPriceMode}>
                <option value="none">Aucun prix barré</option>
                <option value="percent">Pourcentage au-dessus du prix</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>
            <div className="field">
              <label>Valeur (% ou FCFA)</label>
              <input name="oldPriceValue" type="number" defaultValue={product.oldPriceValue} min={0} step="0.1" />
            </div>
          <input type="hidden" name="minProfit" value={product.minProfit} />
          <input type="hidden" name="maxProfit" value={product.maxProfit} />
          <input type="hidden" name="roundTo" value={product.roundTo || 500} />
          <p className="muted tiny" style={{ marginTop: 0, gridColumn: "1 / -1" }}>
            En mode automatique, le prix est recalculé à l&apos;enregistrement à partir du prix
            fournisseur, du fret et du bénéfice. En manuel, le prix saisi est conservé.
          </p>
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
          <div style={{ display: "flex", gap: 18, margin: "4px 0 8px", flexWrap: "wrap" }}>
            <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <input type="checkbox" name="showOldPrice" defaultChecked={product.showOldPrice} /> Afficher le prix barré
            </label>
            <label className="small" style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <input type="checkbox" name="showDiscountBadge" defaultChecked={product.showDiscountBadge} /> Afficher le badge -X %
            </label>
          </div>
          <p className="muted tiny" style={{ marginTop: 0 }}>
            Le prix barré est purement marketing : il n&apos;entre pas dans le calcul du prix de
            vente. Prix barré actuel : <b>{product.oldPrice ? money(product.oldPrice) : "aucun"}</b>.
          </p>
          {marketMargin != null ? (
            <p className="small" style={{ margin: "0 0 8px", color: marketMargin < 0 ? "var(--danger)" : "var(--ok)" }}>
              Marge au prix du marché ({money(product.marketPrice as number)}) :{" "}
              <b>{money(marketMargin)}</b>
              {marketMargin < 0 ? " — vous vendez à perte à ce prix." : ""}
            </p>
          ) : null}
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

      <VariantManager productId={product.id} variants={variantData} />

      <ImageManager productId={product.id} images={product.images.map((i) => ({ id: i.id, url: i.url }))} />
    </div>
  );
}
