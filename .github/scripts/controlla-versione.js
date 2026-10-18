// APP_VERSION (index.html) e CACHE_VERSION (sw.js) devono essere allineati: "v6.22" ↔ "v6-22".
// Con un secondo argomento (versione di main) controlla anche che la versione SALGA.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const app = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/APP_VERSION\s*=\s*"(v\d+\.\d+)"/) || [])[1];
const cache = (fs.readFileSync(path.join(ROOT, "sw.js"), "utf8").match(/CACHE_VERSION\s*=\s*"(v\d+-\d+)"/) || [])[1];
const numero = (v) => { const [a, b] = v.replace(/^v/, "").split(/[.-]/).map(Number); return a * 100 + b; };
let errore = null;
if (!app || !cache) errore = "APP_VERSION o CACHE_VERSION non trovati";
else if (app.replace(".", "-") !== cache) errore = `versioni non allineate: index.html ${app}, sw.js ${cache}`;
const base = process.argv[2];
if (!errore && base && numero(app) <= numero(base)) errore = `la versione deve salire: ${app} non è più alta di ${base}`;
if (errore) { console.error("✗ " + errore); process.exit(1); }
console.log(`✓ versione ${app} (sw.js ${cache})${base ? `, più alta di ${base}` : ""}`);
