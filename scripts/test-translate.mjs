const text = "The iPhone 13 Pro is a powerful smartphone with a stunning display.";
const endpoints = [
  "https://libretranslate.de/translate",
  "https://translate.argosopentech.com/translate",
  "https://translate.terraprint.co/translate",
  "https://lt.vern.cc/translate",
  "https://libretranslate.eownerdead.dedyn.io/translate",
];

for (const url of endpoints) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: "fr", format: "text" }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    console.log(url, res.status, Date.now() - started + "ms", JSON.stringify(data).slice(0, 160));
  } catch (e) {
    console.log(url, "ERR", e.message);
  }
}
