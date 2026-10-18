// FASE 0 — controllo delle copie fatte dalla console (SOLO LETTURA, nessun collegamento a Firebase).
// Uso: node fase0/verifica.js <regole-pubblicate.json> <export-dati.json> [cartella-rapporto]
// Il rapporto si scrive FUORI dal repository (per default accanto al file dei dati).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { leggiRegole, differenze } = require("./regole-util");
const { analizza } = require("../migrazione/analizza-classifica");

const REPO = path.resolve(__dirname, "../..");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

function contaDati(d) {
  d = d || {};
  const lb = d.leaderboard || {};
  const voci = Object.entries(lb);
  const vecchie = voci.filter(([k]) => k.startsWith("-"));
  const nuove = voci.filter(([k]) => !k.startsWith("-"));
  const somma = (arr) => arr.reduce((t, [, v]) => ({
    vittorie: t.vittorie + Number((v && v.vittorie) || 0),
    partite: t.partite + Number((v && v.partite) || 0),
    vinte: t.vinte + Number((v && v.vinte) || 0),
  }), { vittorie: 0, partite: 0, vinte: 0 });
  const games = d.games || {};
  const noti = ["games", "presence", "players", "leaderboard", "codes", "stats", "profiles", "credited", "seatKeys", "seatClaims", "tournaments", "tournamentWins"];
  return {
    percorsiPrincipali: Object.keys(d).sort(),
    percorsiSconosciuti: Object.keys(d).filter((k) => !noti.includes(k)).sort(),
    rubricaPlayers: Object.keys(d.players || {}).length,
    profili: Object.keys(d.profiles || {}).length,
    classifica: {
      voci: voci.length,
      vociVecchie: vecchie.length,
      vociNuove: nuove.length,
      totali: somma(voci),
      totaliVecchie: somma(vecchie),
    },
    stanze: Object.keys(games).length,
    stanzeAuto: Object.keys(games).filter((k) => k.startsWith("AUTO-")).length,
    stanzePresenza: Object.keys(d.presence || {}).length,
    codici: Object.keys(d.codes || {}).length,
    stats: d.stats || {},
    credited: Object.keys(d.credited || {}).length,
    seatKeys: Object.keys(d.seatKeys || {}).length,
  };
}

function main() {
  const [fileRegole, fileDati, cartella] = process.argv.slice(2);
  if (!fileRegole || !fileDati) {
    console.error("Uso: node fase0/verifica.js <regole-pubblicate.json> <export-dati.json> [cartella-rapporto]");
    process.exit(2);
  }
  const outDir = path.resolve(cartella || path.dirname(path.resolve(fileDati)));
  if ((outDir + path.sep).startsWith(REPO + path.sep)) {
    console.error("ERRORE: il rapporto (con dati veri) non va scritto dentro il repository: " + outDir);
    process.exit(2);
  }
  const reali = leggiRegole(fileRegole);
  const repo = leggiRegole(path.join(REPO, "database.rules.json"));
  const transizione = leggiRegole(path.join(__dirname, "../regole/transizione.json"));
  const vsRepo = differenze(reali, repo);
  // La transizione deve essere: regole reali + SOLO i percorsi nuovi.
  const nuovi = ["profiles", "credited", "seatKeys", "seatClaims"];
  const transSenzaNuovi = JSON.parse(JSON.stringify(transizione));
  for (const k of nuovi) delete transSenzaNuovi.rules[k];
  const vsTransizione = differenze(reali, transSenzaNuovi);
  const conflitti = nuovi.filter((k) => reali.rules && reali.rules[k] !== undefined);

  const dati = JSON.parse(fs.readFileSync(fileDati, "utf8").replace(/^﻿/, ""));
  const rapporto = {
    creato: new Date().toISOString(),
    file: {
      regole: { nome: path.basename(fileRegole), sha256: sha(fileRegole), byte: fs.statSync(fileRegole).size },
      dati: { nome: path.basename(fileDati), sha256: sha(fileDati), byte: fs.statSync(fileDati).size },
    },
    regole: {
      ugualiAlRepository: vsRepo.length === 0,
      differenzeDalRepository: vsRepo,
      transizioneCompatibile: vsTransizione.length === 0 && conflitti.length === 0,
      differenzeDallaTransizione: vsTransizione,
      percorsiNuoviGiaPresenti: conflitti,
    },
    dati: contaDati(dati),
    controlloClassifica: (({ voci, ...r }) => r)(analizza(dati)),
  };
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "rapporto-fase0.json");
  fs.writeFileSync(out, JSON.stringify(rapporto, null, 2));

  const c = rapporto.dati.classifica;
  console.log("Regole reali = repository:", rapporto.regole.ugualiAlRepository ? "SÌ" : "NO (" + vsRepo.length + " differenze)");
  console.log("Transizione costruita sulle regole reali:", rapporto.regole.transizioneCompatibile ? "SÌ" : "NO → FERMARSI");
  console.log(`Rubrica: ${rapporto.dati.rubricaPlayers} · Profili: ${rapporto.dati.profili} · Classifica: ${c.voci} voci (${c.vociVecchie} vecchie, ${c.vociNuove} nuove)`);
  console.log(`Totali classifica: vittorie ${c.totali.vittorie}, partite ${c.totali.partite}, vinte ${c.totali.vinte}`);
  console.log(`Stanze: ${rapporto.dati.stanze} (AUTO ${rapporto.dati.stanzeAuto}) · percorsi sconosciuti: ${rapporto.dati.percorsiSconosciuti.join(", ") || "nessuno"}`);
  console.log("SHA-256 regole:", rapporto.file.regole.sha256);
  console.log("SHA-256 dati:  ", rapporto.file.dati.sha256);
  console.log("Rapporto completo:", out);
  if (!rapporto.regole.ugualiAlRepository || !rapporto.regole.transizioneCompatibile) process.exitCode = 1;
}

module.exports = { contaDati };
if (require.main === module) main();
