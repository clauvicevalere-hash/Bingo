const base = "https://bingo-8itp.onrender.com";
const [manifest, contact, catalogue, home] = await Promise.all([
  fetch(base + "/manifest.webmanifest").then((r) => r.json()),
  fetch(base + "/contact").then((r) => r.text()),
  fetch(base + "/catalogue?min=200000&max=300000").then((r) => r.text()),
  fetch(base + "/").then((r) => r.text()),
]);

console.log("shortcuts:", manifest.shortcuts?.length, "| screenshots:", manifest.screenshots?.length);
console.log("contact form:", /c-message/.test(contact), "| filtres:", /f-min/.test(catalogue));
console.log("organisation jsonld:", /"@type":"Organization"/.test(home), "| searchaction:", /SearchAction/.test(home));
