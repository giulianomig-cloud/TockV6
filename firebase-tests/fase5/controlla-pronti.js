// Fase 5 — SOLO LETTURA: dice, da un export JSON della console, se si può fare il passo successivo.
//   node fase5/controlla-pronti.js export.json
// Passo "5A" (regole proposte.json): nessun telefono collegato con una versione più vecchia della v6.22.
// Passo "5B" (regole arbitro.json): arbitro acceso, nessun telefono collegato più vecchio della v6.23 e nessuna
// partita "di prima" (senza arbitro) ancora in corso. Non stampa nomi né carte: solo conteggi.
const fs = require("node:fs");

function versione(v) {
  return typeof v === "string" && /^v\d+(\.\d+)*$/.test(v) ? v.slice(1).split(".").map(Number) : null;
}
function confronta(a, b) {
  const pa = versione(a), pb = versione(b);
  if (!pa) return -1;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function analizza(dati, adesso = Date.now()) {
  const games = (dati && dati.games) || {};
  const presence = (dati && dati.presence) || {};
  const collegati = [];
  for (const colori of Object.values(presence)) {
    for (const conn of Object.values(colori || {})) {
      for (const v of Object.values(conn || {})) collegati.push(typeof v === "string" ? v : "(vecchia, senza versione)");
    }
  }
  const sotto = (min) => collegati.filter((v) => confronta(v, min) < 0).length;
  let classicheInCorso = 0, conArbitro = 0, classiche = 0;
  for (const g of Object.values(games)) {
    if (!g || typeof g !== "object") continue;
    if (g.arbitro === true) { conArbitro++; continue; }
    classiche++;
    const ferma = g.turnStartedAt && adesso - g.turnStartedAt > 24 * 3600000;
    if (g.phase && g.phase !== "lobby" && g.phase !== "finished" && !ferma) classicheInCorso++;
  }
  const arbitroAcceso = !!(dati && dati.config && dati.config.arbitro === true);
  const r = {
    collegati: collegati.length,
    sottoV622: sotto("v6.22"),
    sottoV623: sotto("v6.23"),
    stanze: Object.keys(games).length,
    stanzeConArbitro: conArbitro,
    stanzeDiPrima: classiche,
    partiteDiPrimaInCorso: classicheInCorso,
    arbitroAcceso,
    vociClassifica: Object.keys((dati && dati.leaderboard) || {}).length,
  };
  r.pronto5A = r.sottoV622 === 0;
  r.pronto5B = arbitroAcceso && r.sottoV623 === 0 && r.partiteDiPrimaInCorso === 0;
  return r;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error("uso: node fase5/controlla-pronti.js export.json"); process.exit(2); }
  const r = analizza(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(`Telefoni collegati ora: ${r.collegati} (più vecchi della v6.22: ${r.sottoV622}, della v6.23: ${r.sottoV623})`);
  console.log(`Stanze: ${r.stanze} · con l'arbitro: ${r.stanzeConArbitro} · di prima: ${r.stanzeDiPrima} (in corso nelle ultime 24 ore: ${r.partiteDiPrimaInCorso})`);
  console.log(`Arbitro acceso (config/arbitro): ${r.arbitroAcceso ? "SÌ" : "NO"} · voci in classifica: ${r.vociClassifica}`);
  console.log(`Pronto per le regole 5A (proposte.json): ${r.pronto5A ? "SÌ" : "NO"}`);
  console.log(`Pronto per le regole 5B (arbitro.json): ${r.pronto5B ? "SÌ" : "NO"}`);
  console.log("Nota: l'export mostra solo chi è collegato in quel momento: ripeterlo in orari diversi.");
}
module.exports = { analizza, confronta };
