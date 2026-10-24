// Costruisce il sito come GitHub Pages (Jekyll 3.10) e controlla che i test (firebase-tests/), il codice del server
// (functions/) e le cartelle
// tecniche NON finiscano fra i file pubblicati, e che index.html ci sia.
// Uso: GEMS=<cartella delle gem> node .github/scripts/controlla-sito.js
// Prima volta: gem install --no-document --install-dir <GEMS> jekyll:3.10.0 kramdown-parser-gfm webrick
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const gems = path.resolve(process.env.GEMS || path.join(ROOT, "firebase-tests", ".gems"));
const out = fs.mkdtempSync(path.join(os.tmpdir(), "sito-"));
execFileSync(path.join(gems, "bin", "jekyll"), ["build", "-q", "-s", ROOT, "-d", out], {
  env: { ...process.env, GEM_HOME: gems, GEM_PATH: gems },
  stdio: "inherit",
});
const pubblicati = fs.readdirSync(out);
fs.rmSync(out, { recursive: true, force: true });
const vietati = ["firebase-tests", "functions", "firebase.json", ".github", ".claude", "node_modules"].filter((d) => pubblicati.includes(d));
if (vietati.length) { console.error("ERRORE: verrebbero pubblicati sul sito: " + vietati.join(", ")); process.exit(1); }
if (!pubblicati.includes("index.html")) { console.error("ERRORE: index.html manca dal sito costruito"); process.exit(1); }
console.log("OK: test e cartelle tecniche non vengono pubblicati. File del sito:", pubblicati.join(", "));
