const base = "https://bingo-8itp.onrender.com";
const [product, category] = await Promise.all([
  fetch(base + "/p/infinix-smart-20").then((r) => r.text()),
  fetch(base + "/c/new-mobile").then((r) => r.text()),
]);

console.log("partage WhatsApp:", /Partager sur WhatsApp/.test(product));
console.log("onglets catégorie:", (category.match(/class="tab"/g) || []).length);
console.log("catégorie vide masquée:", !category.includes("Aucun produit"));
