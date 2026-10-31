const candidates = [
  "https://bingo.onrender.com",
  "https://bingo-shop.onrender.com",
  "https://bingo-1.onrender.com",
  "https://bingo-app.onrender.com",
  "https://bingo-web.onrender.com",
  "https://bingo-ecommerce.onrender.com",
];

for (const base of candidates) {
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(15000) });
    const text = (await res.text()).slice(0, 120);
    console.log(base, "=>", res.status, text);
  } catch (e) {
    console.log(base, "=> ERR", e.name === "TimeoutError" ? "timeout" : e.message);
  }
}
