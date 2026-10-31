const product = await fetch("http://localhost:3000/p/iphone-13-pro-used").then((r) => r.text());
const home = await fetch("http://localhost:3000/").then((r) => r.text());

const count = (text, token) => text.split(token).length - 1;
console.log("produit:", "old-price", count(product, 'class="old-price"'), "| badge", count(product, 'class="saving"'));
console.log("accueil:", "old-price", count(home, 'class="old-price"'), "| badges", count(home, 'class="tag">-'));
