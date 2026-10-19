// Dopo un rilascio: il sito pubblicato deve avere la stessa versione di index.html/sw.js del repository,
// e i file indispensabili (manifest, service worker) devono rispondere. Riprova per 15 minuti.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const SITO = process.env.SITO || "https://giulianomig-cloud.github.io/TockV6/";
const atteso = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/APP_VERSION\s*=\s*"([^"]+)"/)[1];
const LIMITE = Number(process.env.LIMITE_MS || 15 * 60 * 1000);

async function controlla() {
  const testo = async (f) => { const r = await fetch(SITO + f + "?nocache=" + Date.now()); if (!r.ok) throw new Error(`${f}: ${r.status}`); return r.text(); };
  const html = await testo("");
  const v = (html.match(/APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
  if (v !== atteso) throw new Error(`il sito mostra ${v}, atteso ${atteso}`);
  const sw = await testo("sw.js");
  if (!sw.includes(`"${atteso.replace(".", "-")}"`)) throw new Error("sw.js del sito non ha la versione attesa");
  JSON.parse(await testo("manifest.json"));
}

(async () => {
  const fine = Date.now() + LIMITE;
  for (;;) {
    try { await controlla(); console.log(`✓ il sito pubblica ${atteso}`); return; }
    catch (e) {
      if (Date.now() > fine) { console.error("✗ " + e.message); process.exit(1); }
      console.log("… " + e.message + " — riprovo fra 30 s");
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
})();
