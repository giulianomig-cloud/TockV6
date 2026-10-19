// FASE 2 — prova generale della pubblicazione delle regole di TRANSIZIONE, SOLO sull'emulatore.
// Dati: BACKUP_DATI=<export.json> (una copia di quelli veri, caricata SOLO nell'emulatore) oppure i dati finti.
// Regole di partenza: BACKUP_REGOLE=<file> (copia di quelle pubblicate) oppure database.rules.json.
// Verifica: backup cifrato leggibile e ripristinabile, rilascio con lo stesso strumento del workflow, dati
// IDENTICI prima/dopo (le regole non cambiano i dati), v6.16 che lavora come oggi, ritorno indietro esatto.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { emulatore } = require("../rilascio/bersaglio");
const rtdb = require("../rilascio/rtdb");
const { rilascia } = require("../rilascio/esegui");
const { leggiBackup } = require("../rilascio/backup");
const { leggiRegole, differenze, togliCommenti } = require("../fase0/regole-util");
const { contaDati } = require("../fase0/verifica");
const { datiFinti } = require("../fase12/dati-finti");

const REPO = path.resolve(__dirname, "../..");
const REGOLE_PARTENZA = process.env.BACKUP_REGOLE || path.join(REPO, "database.rules.json");
const DATI = process.env.BACKUP_DATI ? JSON.parse(fs.readFileSync(process.env.BACKUP_DATI, "utf8").replace(/^﻿/, "")) : datiFinti();
const TRANS = path.join(__dirname, "../regole/transizione.json");
const B = emulatore("prova-fase2");
const V = emulatore("prova-fase2-verifica");
const PASS = "passphrase-solo-per-la-prova";
const impronta = (x) => crypto.createHash("sha256").update(JSON.stringify(ordina(x))).digest("hex");
function ordina(x) {
  if (Array.isArray(x)) return x.map(ordina);
  if (x && typeof x === "object") return Object.fromEntries(Object.keys(x).sort().map((k) => [k, ordina(x[k])]));
  return x;
}
const OWNER = { Authorization: "Bearer owner" };
// scritture SENZA login, come fa la v6.16
const v616 = (metodo, p, v) => fetch(B.indirizzo(p), { method: metodo, body: JSON.stringify(v) });
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), "fase2-"));

let prima, conteggiPrima, backupDir;

test.before(async () => {
  await rtdb.pubblicaRegole(B, '{"rules":{".read":false,".write":false}}');
  await rtdb.scriviEmulatore(B, "", DATI);
  await rtdb.pubblicaRegole(B, fs.readFileSync(REGOLE_PARTENZA, "utf8"));
  prima = await rtdb.leggi(B, "");
  conteggiPrima = contaDati(prima);
});

test("1. regole di partenza = quelle del backup (se no, la Fase 2 si ferma)", async () => {
  assert.deepEqual(differenze(await rtdb.leggiRegole(B), leggiRegole(REGOLE_PARTENZA)), []);
  assert.deepEqual(differenze(leggiRegole(REGOLE_PARTENZA), leggiRegole(path.join(REPO, "database.rules.json"))), [],
    "le regole pubblicate devono essere quelle del repository");
});

test("2. rilascio della transizione: backup cifrato verificato, regole pubblicate e rilette", async () => {
  backupDir = dir();
  const r = await rilascia({ bersaglio: B, regoleAttese: REGOLE_PARTENZA, regoleNuove: TRANS, prova: false,
    cartellaBackup: backupDir, passphrase: PASS, emulatoreVerifica: V });
  assert.equal(r.esito, "ok", r.errore);
  assert.deepEqual(differenze(await rtdb.leggiRegole(B), leggiRegole(TRANS)), []);
  const b = leggiBackup(backupDir, { passphrase: PASS });
  assert.equal(impronta(b.dati), impronta(prima), "il backup contiene esattamente i dati di prima");
  assert.deepEqual(b.manifesto.conteggi, conteggiPrima);
});

test("3. le regole NON toccano i dati: partite, profili, classifica identici bit per bit", async () => {
  const dopo = await rtdb.leggi(B, "");
  assert.equal(impronta(dopo), impronta(prima));
  for (const ramo of ["games", "leaderboard", "players", "profiles", "presence", "codes", "stats"]) {
    assert.deepEqual(dopo[ramo], prima[ramo], ramo);
  }
});

test("4. con la transizione la v6.16 fa tutto quello che fa oggi (senza login)", async () => {
  const esiti = {
    "crea una stanza": await v616("PUT", "games/PROVA-F2", { phase: "lobby", roomMode: "manual" }),
    "fa una mossa": await v616("PATCH", "games/PROVA-F2", { turnColor: "green" }),
    "segna la presenza": await v616("PUT", "presence/PROVA-F2/red/c1", "v6.16"),
    "toglie la presenza": await v616("DELETE", "presence/PROVA-F2/red/c1"),
    "registra la classifica come oggi": await v616("PATCH", "", { "games/PROVA-F2/leaderboardClaimed": true, "leaderboard/-pF2/partite": 1, "leaderboard/-pF2/nome": "F2" }),
    "crea un nome in rubrica": await v616("PUT", "players/-pF2", { nome: "F2", creatoIl: 1 }),
    "conta le stanze": await v616("PUT", "stats/roomsCreated", 1),
    "scrive l'indice dei codici": await v616("PUT", "codes/PROVA-F2", "room"),
  };
  const negate = Object.entries(esiti).filter(([, r]) => r.status !== 200).map(([n, r]) => `${n} (${r.status})`);
  assert.deepEqual(negate, [], "operazioni della v6.16 rifiutate: " + negate.join(", "));
  // pulizia: tolgo le prove (come se non fossero mai esistite)
  for (const p of ["games/PROVA-F2", "leaderboard/-pF2", "players/-pF2", "codes/PROVA-F2"]) {
    await fetch(B.indirizzo(p), { method: "DELETE", headers: OWNER });
  }
  await rtdb.scriviEmulatore(B, "stats", prima.stats || null);
});

test("5. i percorsi nuovi sono chiusi a chi non ha il login (come previsto dalla transizione)", async () => {
  assert.notEqual((await fetch(B.indirizzo("profiles/x"))).status, 200, "lettura profili senza login");
  assert.notEqual((await v616("PUT", "credited/AUTO-1/g/u1", true)).status, 200, "segno 'partita registrata' senza login");
  assert.notEqual((await v616("PUT", "seatKeys/AUTO-1/red", { uid: "x", key: "ABCDEF" })).status, 200, "codice di rientro senza login");
});

test("6. ritorno indietro: le regole del backup tornano identiche e i dati restano quelli di prima", async () => {
  const b = leggiBackup(backupDir, { passphrase: PASS });
  await rtdb.pubblicaRegole(B, b.regole);
  assert.deepEqual(differenze(await rtdb.leggiRegole(B), JSON.parse(togliCommenti(b.regole))), []);
  assert.deepEqual(differenze(await rtdb.leggiRegole(B), leggiRegole(REGOLE_PARTENZA)), []);
  assert.equal(impronta(await rtdb.leggi(B, "")), impronta(prima));
});

test("7. riepilogo per il rapporto (conteggi e impronte)", () => {
  const c = conteggiPrima.classifica;
  console.log(`# dati: ${process.env.BACKUP_DATI ? "copia dell'export reale" : "finti"} · impronta ${impronta(prima).slice(0, 16)}…`);
  console.log(`# classifica ${c.voci} voci · vittorie ${c.totali.vittorie} · partite ${c.totali.partite} · vinte ${c.totali.vinte} · stanze ${conteggiPrima.stanze}`);
});
