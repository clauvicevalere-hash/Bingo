const base = "https://bingo-8itp.onrender.com";
const html = await fetch(base + "/p/iphone-13-pro-used").then((r) => r.text());

const og = html.match(/property="og:image" content="([^"]+)"/);
const title = html.match(/<title>([^<]+)<\/title>/);
const jsonld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

console.log("title:", title ? title[1] : "none");
console.log("og:image:", og ? og[1] : "none");
if (jsonld) {
  try {
    const data = JSON.parse(jsonld[1]);
    console.log("jsonld:", data["@type"], "| prix:", data.offers?.price, data.offers?.priceCurrency, "| note:", data.aggregateRating?.ratingValue ?? "aucune");
  } catch {
    console.log("jsonld: parse error");
  }
}
