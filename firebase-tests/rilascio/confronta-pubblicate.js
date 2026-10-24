// FASE C — quali regole sono DAVVERO pubblicate? Le legge (sola lettura) e le confronta con i file del
// repository. Non scrive nulla. Esce con errore se non coincidono con nessun file noto.
// Bersaglio: produzione (con le stesse condizioni di bersaglio.js) oppure emulatore (TOCK_EMULATORE_NS).
const path = require("node:path");
const fs = require("node:fs");
const rtdb = require("./rtdb");
const { leggiRegole, differenze } = require("../fase0/regole-util");

const FILE = {
  "attuali (database.rules.json)": path.resolve(__dirname, "../../database.rules.json"),
  "transizione": path.resolve(__dirname, "../regole/transizione.json"),
  "definitive (proposte)": path.resolve(__dirname, "../regole/proposte.json"),
  "arbitro (5B)": path.resolve(__dirname, "../regole/arbitro.json"),
};

async function confronta(b) {
  const pubblicate = await rtdb.leggiRegole(b);
  const esiti = Object.entries(FILE).map(([nome, f]) => ({ nome, differenze: differenze(pubblicate, leggiRegole(f)).length }));
  return { coincide: (esiti.find((e) => e.differenze === 0) || {}).nome || null, esiti };
}
module.exports = { confronta };

if (require.main === module) {
  (async () => {
    const { produzione, emulatore } = require("./bersaglio");
    const b = process.env.TOCK_BERSAGLIO === "produzione" ? await produzione() : emulatore(process.env.TOCK_EMULATORE_NS || "rilascio-locale");
    const r = await confronta(b);
    const righe = [`Bersaglio: ${b.descrizione}`, ...r.esiti.map((e) => `- ${e.nome}: ${e.differenze ? e.differenze + " differenze" : "IDENTICHE"}`),
      r.coincide ? `Pubblicate = ${r.coincide}` : "ATTENZIONE: le regole pubblicate non coincidono con nessun file del repository"];
    console.log(righe.join("\n"));
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, righe.join("\n") + "\n");
    if (!r.coincide) process.exit(1);
  })().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
}
