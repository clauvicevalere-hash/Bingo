const base = "https://bingo-8itp.onrender.com";

async function get(path) {
  const res = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
  return { status: res.status, text: await res.text() };
}

const home = await get("/");
console.log("accueil:", home.status, "images:", (home.text.match(/\/uploads\/categories\//g) || []).length);

const product = await get("/p/iphone-13-pro-used");
console.log(
  "produit:",
  product.status,
  "| avis:", product.text.includes("Avis clients"),
  "| whatsapp:", product.text.includes("Commander sur WhatsApp"),
  "| occasion:", product.text.includes("Occasion")
);

const admin = await fetch(base + "/admin", { redirect: "manual", signal: AbortSignal.timeout(30000) });
console.log("admin:", admin.status, admin.headers.get("location"));

const badOrder = await fetch(base + "/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    countryCode: "BF",
    city: "Ouagadougou",
    customerName: "Test",
    phone: "+22670000000",
    address: "Rue test",
    paymentMethod: "COD",
    items: [{ productId: 999999, qty: 1 }],
  }),
});
console.log("commande invalide (attendu 409):", badOrder.status);

const badReview = await fetch(base + "/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId: 1, name: "Test", rating: 9, comment: "test" }),
});
console.log("avis invalide (attendu 400):", badReview.status);

const sitemap = await get("/sitemap.xml");
console.log("sitemap:", sitemap.status, (sitemap.text.match(/<loc>/g) || []).length, "urls");
