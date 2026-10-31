const base = "https://bingo-8itp.onrender.com";
const contact = await fetch(base + "/contact").then((r) => r.text());
const product = await fetch(base + "/p/infinix-smart-20").then((r) => r.text());

console.log("contact +971:", contact.includes("+971"), "| +226:", contact.includes("+226"));
console.log("wa.me 971:", /wa\.me\/971568934905/.test(product));
console.log("tel:", /tel:\+22676950089/.test(contact));
