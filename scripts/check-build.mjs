import fs from "node:fs";

const local = fs.existsSync(".next/BUILD_ID") ? fs.readFileSync(".next/BUILD_ID", "utf8").trim() : "none";
const html = await fetch("https://bingo-8itp.onrender.com/").then((r) => r.text());
const m = html.match(/"buildId":"([^"]+)"/);
const chunks = [...html.matchAll(/\/_next\/static\/chunks\/([A-Za-z0-9_-]+)\.js/g)].slice(0, 3).map((x) => x[1]);

console.log("local buildId:", local);
console.log("live buildId:", m ? m[1] : "not exposed");
console.log("live chunks:", chunks);
