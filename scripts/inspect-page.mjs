const base = "https://bingo-8itp.onrender.com";
const html = await fetch(base + "/").then((r) => r.text());

const srcs = [...html.matchAll(/<img[^>]+src="(\/uploads\/[^"]+)"/g)].map((m) => m[1]);
console.log("image srcs found:", srcs.length);
console.log(srcs.slice(0, 5));

for (const src of srcs.slice(0, 3)) {
  const res = await fetch(base + src);
  const buf = await res.arrayBuffer();
  console.log(src, res.status, res.headers.get("content-type"), buf.byteLength);
}
