// Genera functions/motore-generato.js: il motore del gioco + l'intelligenza dei computer, presi DIRETTAMENTE da
// index.html (stesso codice dei telefoni e dei test). Il server (arbitro) usa questo file: nessuna copia a mano.
//   node functions/genera-motore.js          → riscrive il file
//   node functions/genera-motore.js --check  → errore se il file non corrisponde a index.html (usato dai controlli)
const fs = require("node:fs");
const path = require("node:path");

const RADICE = path.join(__dirname, "..");
const USCITA = path.join(__dirname, "motore-generato.js");
// Funzioni dell'app (fuori dal blocco del motore) che servono al server: da qui si prendono anche,
// in automatico, tutte le funzioni e costanti che usano.
const RADICI = ["dealAndRevealDealer", "botTakeTurn", "botCardToGiveAway"];

function blocchi(html) {
  const tutti = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const tabellone = tutti.find((b) => b.includes("const BOARD ="));
  const motore = tutti.find((b) => b.includes("Tock — motore di gioco"));
  const app = tutti.find((b) => b.includes("App principale: lobby"));
  if (!tabellone || !motore || !app) throw new Error("blocchi del motore non trovati in index.html");
  return { tabellone, motore, app };
}

// Dichiarazioni al primo livello del blocco dell'app (il codice è sempre indentato allo stesso modo:
// una dichiarazione inizia a colonna 0 e una funzione finisce con "}" a colonna 0).
function dichiarazioni(codice) {
  const righe = codice.split("\n");
  const out = new Map();
  for (let i = 0; i < righe.length; i++) {
    const m = righe[i].match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(|^(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/);
    if (!m) continue;
    const nome = m[1] || m[2];
    let fine = i;
    if (m[1]) {
      const una = righe[i];
      const unaRiga = una.trimEnd().endsWith("}") && (una.match(/{/g) || []).length === (una.match(/}/g) || []).length;
      if (!unaRiga) while (fine < righe.length && righe[fine] !== "}") fine++;
    } else if (!/;\s*(\/\/.*)?$/.test(righe[i])) {
      while (fine < righe.length && !/^[\]})][^\n]*;\s*$/.test(righe[fine])) fine++;
    }
    out.set(nome, righe.slice(i, fine + 1).join("\n"));
    i = fine;
  }
  return out;
}

function genera() {
  const html = fs.readFileSync(path.join(RADICE, "index.html"), "utf8");
  const { tabellone, motore, app } = blocchi(html);
  const decl = dichiarazioni(app);
  const giaNelMotore = new Set([...dichiarazioni(motore).keys()]);
  const presi = new Set();
  const coda = [...RADICI];
  while (coda.length) {
    const n = coda.shift();
    if (presi.has(n) || giaNelMotore.has(n)) continue;
    if (!decl.has(n)) throw new Error("dichiarazione non trovata nell'app: " + n);
    presi.add(n);
    const corpo = decl.get(n);
    for (const id of new Set(corpo.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || [])) {
      if (id !== n && decl.has(id) && !presi.has(id) && !giaNelMotore.has(id)) coda.push(id);
    }
  }
  // Nell'ordine in cui compaiono in index.html (le costanti devono esistere prima di essere usate al caricamento).
  const ordinati = [...decl.keys()].filter((n) => presi.has(n));
  const vietati = /\b(document|window|localStorage|navigator|myColor|myRoomId|currentState|playSound|showToast)\b/;
  for (const n of ordinati) {
    if (vietati.test(decl.get(n))) throw new Error(`${n} usa cose del telefono (${decl.get(n).match(vietati)[0]}): non può girare sul server`);
  }
  const testo = [
    "// FILE GENERATO da functions/genera-motore.js a partire da index.html: NON modificarlo a mano.",
    "// Contiene il motore del gioco e l'intelligenza dei computer, identici a quelli dei telefoni.",
    "/* eslint-disable */",
    "\"use strict\";",
    "const motore = (function () {",
    "const module = { exports: {} };",
    tabellone,
    motore.replace(/\nif \(typeof module !== "undefined"\) \{[\s\S]*$/, "\n"),
    "// ---- dall'app: estrazione del mazziere e computer ----",
    ...ordinati.map((n) => decl.get(n)),
    "return { BOARD, COLORS, TEAM_OF, PARTNER_OF, NEXT_COLOR, newGameId, newGameState, normalizeState, dealNewHand,",
    "  submitExchangeCard, postChatMessage, legalMovesForCard, jackableTargets, sevenValidateDistribution, anyLegalMove,",
    "  applyMove, checkWin, resetForNewGame, burnOneCard, advanceTurn, activeColorFor, compareAppVersions,",
    "  botChooseCardAndMove, botChooseCardAndMoveEasy, " + RADICI.join(", ") + " };",
    "})();",
    "module.exports = motore;",
    "",
  ].join("\n");
  return { testo, funzioni: ordinati };
}

if (require.main === module) {
  const { testo, funzioni } = genera();
  if (process.argv.includes("--check")) {
    const attuale = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, "utf8") : "";
    if (attuale !== testo) {
      console.error("functions/motore-generato.js NON corrisponde a index.html: lancia `node functions/genera-motore.js`");
      process.exit(1);
    }
    console.log("motore del server allineato a index.html (" + funzioni.length + " funzioni dell'app)");
  } else {
    fs.writeFileSync(USCITA, testo);
    console.log("scritto " + path.relative(RADICE, USCITA) + " · funzioni prese dall'app: " + funzioni.join(", "));
  }
}
module.exports = { genera };
