// FASE 2 — controllo DOPO la pubblicazione (sola lettura, nessun collegamento a Firebase).
// Uso: node fase2/controlla-dopo.js <regole-copiate-dopo.json> <export-prima.json> <export-dopo.json>
// Esce con errore se: le regole pubblicate non sono esattamente la transizione, oppure manca qualcosa
// che c'era prima (voci di rubrica/profili/classifica/stanze) o una voce vecchia della classifica è scesa.
const fs = require("node:fs");
const path = require("node:path");
const { leggiRegole, differenze } = require("../fase0/regole-util");
const { contaDati } = require("../fase0/verifica");
const { confronta } = require("../rilascio/migrazione-legacy");

const [fileRegole, filePrima, fileDopo] = process.argv.slice(2);
if (!fileRegole || !filePrima || !fileDopo) {
  console.error("Uso: node fase2/controlla-dopo.js <regole-copiate-dopo.json> <export-prima.json> <export-dopo.json>");
  process.exit(2);
}
const leggiJson = (f) => JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
const diff = differenze(leggiRegole(fileRegole), leggiRegole(path.join(__dirname, "../regole/transizione.json")));
const prima = leggiJson(filePrima), dopo = leggiJson(fileDopo);
const perdite = confronta(prima, dopo);
const stanzeSparite = Object.keys(prima.games || {}).filter((k) => !(dopo.games || {})[k]);
const cp = contaDati(prima).classifica, cd = contaDati(dopo).classifica;
console.log(`Regole pubblicate = transizione: ${diff.length ? "NO (" + diff.length + " differenze, es. " + diff[0].percorso + ")" : "SÌ"}`);
console.log(`Classifica prima: ${cp.voci} voci (vecchie: vittorie ${cp.totaliVecchie.vittorie} · partite ${cp.totaliVecchie.partite} · vinte ${cp.totaliVecchie.vinte})`);
console.log(`Classifica dopo:  ${cd.voci} voci (vecchie: vittorie ${cd.totaliVecchie.vittorie} · partite ${cd.totaliVecchie.partite} · vinte ${cd.totaliVecchie.vinte})`);
console.log(`Voci sparite o scese: ${perdite.length ? perdite.join(", ") : "nessuna"}`);
console.log(`Stanze sparite: ${stanzeSparite.length ? stanzeSparite.join(", ") + " (normale solo se riciclate/abbandonate: controllare)" : "nessuna"}`);
if (diff.length || perdite.length) { console.error("✗ FERMARSI: rimettere le regole del backup (vedi FASI-1-2.md)"); process.exit(1); }
console.log("✓ Fase 2 confermata");
