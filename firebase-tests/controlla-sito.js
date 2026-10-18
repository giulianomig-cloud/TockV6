// Costruisce il sito come GitHub Pages (Jekyll 3.10, installato SOLO in firebase-tests/.gems)
// e controlla che firebase-tests/ NON finisca fra i file pubblicati.
// Prima volta: gem install --no-document --install-dir .gems jekyll:3.10.0 kramdown-parser-gfm webrick
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const gems = path.join(__dirname, ".gems");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "sito-"));
execFileSync(path.join(gems, "bin", "jekyll"), ["build", "-q", "-s", path.join(__dirname, ".."), "-d", out], {
  env: { ...process.env, GEM_HOME: gems, GEM_PATH: gems },
  stdio: "inherit",
});
const pubblicati = fs.readdirSync(out);
fs.rmSync(out, { recursive: true, force: true });
if (pubblicati.includes("firebase-tests")) {
  console.error("ERRORE: firebase-tests/ verrebbe pubblicata sul sito");
  process.exit(1);
}
if (!pubblicati.includes("index.html")) {
  console.error("ERRORE: index.html manca dal sito costruito");
  process.exit(1);
}
console.log("OK: firebase-tests/ non viene pubblicata. File del sito:", pubblicati.join(", "));
