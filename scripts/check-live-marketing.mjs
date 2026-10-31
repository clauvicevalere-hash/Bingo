const base = "https://bingo-8itp.onrender.com";
const [home, product] = await Promise.all([
  fetch(base + "/").then((r) => r.text()),
  fetch(base + "/p/iphone-13-pro-used").then((r) => r.text()),
]);
const count = (text, token) => text.split(token).length - 1;

console.log("accueil old-price:", count(home, 'class="old-price"'), "| badges:", count(home, 'class="tag">-'));
console.log("produit old-price:", count(product, 'class="old-price"'), "| Tresor:", /Tresor Empire/.test(product));
console.log("barré affiché:", /old-price/.test(product));
