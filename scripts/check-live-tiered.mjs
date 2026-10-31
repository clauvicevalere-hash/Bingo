const base = "https://bingo-8itp.onrender.com";
const pages = {
  infinix: "/p/infinix-smart-20",
  iphone: "/p/iphone-13-pro-used",
  macbook: "/p/apple-macbook-air-with-m1-chip-2020",
};

for (const [name, path] of Object.entries(pages)) {
  const html = await fetch(base + path).then((r) => r.text());
  const prices = [...html.matchAll(/([0-9]{2,3}(?:[\s\u202f][0-9]{3})+) FCFA/g)].map((m) => m[1]);
  console.log(name, "→", prices.slice(0, 4).join(" | "));
}
