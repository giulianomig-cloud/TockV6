// FASE D/E sull'emulatore: backup cifrato e verificato, rilascio selettivo delle regole, migrazione
// idempotente dei collegamenti (mai per nome), arresto e ripristino automatici. Solo dati FINTI.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { datiFinti } = require("../fase12/dati-finti");
const { emulatore, produzione, PRODUZIONE } = require("../rilascio/bersaglio");
const rtdb = require("../rilascio/rtdb");
const { faiBackup, verificaBackup, leggiBackup } = require("../rilascio/backup");
const { rilascia } = require("../rilascio/esegui");
const migr = require("../rilascio/migrazione-legacy");
const { leggiRegole, differenze } = require("../fase0/regole-util");

const REPO = path.resolve(__dirname, "../..");
const OGGI = path.join(REPO, "database.rules.json");
const TRANS = path.join(__dirname, "../regole/transizione.json");
const PROP = path.join(__dirname, "../regole/proposte.json");
const B = emulatore("rilascio-prova");
const VERIFICA = emulatore("rilascio-verifica");
const PASS = "passphrase-di-prova";
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "backup-"));
const UID_LIA = "uidLiaFinto0000000000000000a";

function datiConProfili() {
  const d = datiFinti();
  d.profiles = { [UID_LIA]: { nome: "Lia", creatoIl: 1, aggiornatoIl: 1 }, uidAltro00000000000000000000: { nome: "Lia", creatoIl: 1 } };
  d.seatKeys = { "AUTO-2": { green: { uid: UID_LIA, key: "K7PZ4Q" } } };
  d.leaderboard[UID_LIA] = { nome: "Lia", partite: 1, vinte: 1, vittorie: 1 };
  return d;
}
async function prepara(regole = OGGI, dati = datiConProfili()) {
  await rtdb.pubblicaRegole(B, "{\"rules\":{\".read\":false,\".write\":false}}");
  await rtdb.scriviEmulatore(B, "", dati);
  await rtdb.pubblicaRegole(B, fs.readFileSync(regole, "utf8"));
  return rtdb.leggi(B, ""); // come lo salva Firebase (gli oggetti vuoti spariscono)
}
const regoleOra = async () => rtdb.leggiRegole(B);
const uguali = async (file) => differenze(await regoleOra(), leggiRegole(file)).length === 0;
const LIA = { "-FINTOlia": { uid: UID_LIA, stanza: "AUTO-2", colore: "green", codice: "k7pz4q" } };

test.describe("bersaglio: la produzione si riconosce senza ambiguità", () => {
  const chiave = (progetto) => {
    const f = path.join(tmp(), "chiave.json");
    fs.writeFileSync(f, JSON.stringify({ type: "service_account", project_id: progetto, client_email: "x@y", private_key: "finta" }));
    return f;
  };
  const tutto = () => ({ TOCK_BERSAGLIO: "produzione", TOCK_PROGETTO: "tock-v6", TOCK_DB_URL: PRODUZIONE.url, GOOGLE_APPLICATION_CREDENTIALS: chiave("tock-v6") });
  for (const [nome, cambia] of [
    ["senza conferma esplicita", (e) => delete e.TOCK_BERSAGLIO],
    ["con un altro progetto", (e) => (e.TOCK_PROGETTO = "tock-v5")],
    ["con un altro indirizzo", (e) => (e.TOCK_DB_URL = "https://tock-v5-default-rtdb.firebaseio.com")],
    ["con l'emulatore al posto del database", (e) => (e.TOCK_DB_URL = "http://127.0.0.1:9000")],
    ["con la chiave di un altro progetto", (e) => (e.GOOGLE_APPLICATION_CREDENTIALS = chiave("tock-v5"))],
    ["senza chiave", (e) => delete e.GOOGLE_APPLICATION_CREDENTIALS],
  ]) {
    test(`rifiutata ${nome}`, async () => {
      const env = tutto();
      cambia(env);
      await assert.rejects(produzione(env), /NON confermato/);
    });
  }
  test("con tutte le condizioni il bersaglio è la produzione (nessun collegamento fatto qui)", async () => {
    const b = await produzione(tutto());
    assert.equal(b.tipo, "produzione");
    assert.equal(b.regole(), PRODUZIONE.url + "/.settings/rules.json");
  });
  test("l'emulatore accetta solo localhost e mai il nome del database vero", () => {
    assert.throws(() => emulatore("x", "https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app"), /localhost/);
    assert.throws(() => emulatore("tock-v6-default-rtdb"), /produzione/);
  });
});

test.describe("backup", () => {
  test("cifrato: senza la passphrase giusta non si legge; verificato e riletto uguale nell'emulatore", async () => {
    const dati = await prepara();
    const dir = tmp();
    const m = await faiBackup(B, dir, { passphrase: PASS });
    assert.ok(!fs.existsSync(path.join(dir, "dati.json")), "i dati in chiaro non devono esistere");
    assert.ok(!fs.readFileSync(path.join(dir, "dati.json.enc"), "utf8").includes("FINTOlia"), "il file cifrato non deve mostrare i dati");
    assert.throws(() => leggiBackup(dir, { passphrase: "sbagliata" }));
    await verificaBackup(dir, { passphrase: PASS, emulatore: VERIFICA });
    assert.deepEqual(leggiBackup(dir, { passphrase: PASS }).dati, dati);
    assert.equal(m.conteggi.classifica.voci, 3);
  });
  test("un backup manomesso non passa la verifica", async () => {
    await prepara();
    const dir = tmp();
    await faiBackup(B, dir);
    const f = path.join(dir, "dati.json");
    fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace('"partite":3', '"partite":30'));
    await assert.rejects(verificaBackup(dir), /impronta/);
  });
  test("si decifra a mano per il ripristino, solo fuori dal repository", async () => {
    const dati = await prepara();
    const dir = tmp(), out = tmp();
    await faiBackup(B, dir, { passphrase: PASS });
    const { execFileSync } = require("node:child_process");
    const cli = path.join(__dirname, "../rilascio/backup.js");
    execFileSync("node", [cli, "decifra", dir, out], { env: { ...process.env, TOCK_BACKUP_PASSPHRASE: PASS } });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, "dati.json"), "utf8")), dati);
    assert.throws(() => execFileSync("node", [cli, "decifra", dir, path.join(REPO, "x")], { env: { ...process.env, TOCK_BACKUP_PASSPHRASE: PASS }, stdio: "pipe" }));
  });
  test("mai dentro il repository", async () => {
    await assert.rejects(faiBackup(B, path.join(REPO, "firebase-tests", "backup-x")), /repository/);
  });
});

test.describe("rilascio delle regole", () => {
  test("PROVA: dice cosa farebbe e non scrive nulla", async () => {
    const dati = await prepara();
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, migrazione: LIA, prova: true, cartellaBackup: tmp() });
    assert.equal(r.esito, "ok", r.errore);
    assert.ok(await uguali(OGGI));
    assert.deepEqual(await rtdb.leggi(B, ""), dati);
  });
  test("pubblica la transizione, verifica, niente perso; rieseguito non fa nulla", async () => {
    await prepara();
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, prova: false, cartellaBackup: tmp(), emulatoreVerifica: VERIFICA, passphrase: PASS });
    assert.equal(r.esito, "ok", r.errore);
    assert.ok(await uguali(TRANS));
    const r2 = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, prova: false, cartellaBackup: tmp() });
    assert.equal(r2.esito, "ok");
    assert.equal(r2.passi.find((p) => p.nome === "regole").esito, "saltato");
  });
  test("se le regole pubblicate non sono quelle attese si ferma PRIMA di scrivere", async () => {
    const dati = await prepara(PROP);
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, prova: false, cartellaBackup: tmp() });
    assert.equal(r.esito, "fallito");
    assert.match(r.errore, /NON sono quelle attese/);
    assert.equal(r.ripristino, "non serviva (nessuna scrittura)");
    assert.ok(await uguali(PROP));
    assert.deepEqual(await rtdb.leggi(B, ""), dati);
  });
  test("un file di regole non provato dai controlli non si pubblica", async () => {
    await prepara();
    const f = path.join(tmp(), "regole.json");
    fs.writeFileSync(f, JSON.stringify({ rules: { ".read": true, ".write": true } }));
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: f, prova: false, cartellaBackup: tmp() });
    assert.equal(r.esito, "fallito");
    assert.ok(await uguali(OGGI));
  });
  test("guasto dopo la pubblicazione → ripristino automatico delle regole del backup", async () => {
    await prepara();
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, prova: false, cartellaBackup: tmp(), guasto: "dopo-regole" });
    assert.equal(r.esito, "fallito");
    assert.match(r.ripristino, /^fatto/);
    assert.ok(await uguali(OGGI));
  });
});

test.describe("migrazione dei collegamenti (Fase D)", () => {
  test("col codice di rientro giusto collega la voce vecchia; rieseguita non riscrive; classifica intatta", async () => {
    const prima = await prepara(TRANS);
    const r = await rilascia({ bersaglio: B, regoleAttese: TRANS, migrazione: LIA, prova: false, cartellaBackup: tmp() });
    assert.equal(r.esito, "ok", r.errore);
    assert.equal(await rtdb.leggi(B, "legacyClaims/-FINTOlia"), UID_LIA);
    assert.deepEqual(await rtdb.leggi(B, "leaderboard"), prima.leaderboard);
    const r2 = await rilascia({ bersaglio: B, regoleAttese: TRANS, migrazione: LIA, prova: false, cartellaBackup: tmp() });
    assert.equal(r2.esito, "ok");
    assert.match(r2.passi.find((p) => p.nome === "migrazione").dettagli, /^0 collegamenti scritti, 1 già presenti/);
  });
  test("guasto durante la migrazione → collegamenti annullati e regole ripristinate", async () => {
    await prepara();
    const r = await rilascia({ bersaglio: B, regoleAttese: OGGI, regoleNuove: TRANS, migrazione: LIA, prova: false, cartellaBackup: tmp(), guasto: "dopo-migrazione" });
    assert.equal(r.esito, "fallito");
    assert.match(r.ripristino, /^fatto: 1 collegamenti annullati/);
    assert.equal(await rtdb.leggi(B, "legacyClaims"), null);
    assert.ok(await uguali(OGGI));
  });
  for (const [nome, richiesta, motivo] of [
    ["solo col nome (nessun codice)", { "-FINTOlia": { uid: "uidAltro00000000000000000000" } }, /codice di rientro/],
    ["col codice di un altro", { "-FINTOlia": { uid: "uidAltro00000000000000000000", stanza: "AUTO-2", colore: "green", codice: "K7PZ4Q" } }, /non corrisponde/],
    ["con il codice sbagliato", { "-FINTOlia": { ...LIA["-FINTOlia"], codice: "AAAAAA" } }, /non corrisponde/],
    ["per un uid senza profilo", { "-FINTOlia": { ...LIA["-FINTOlia"], uid: "uidSconosciuto00000000000000" } }, /profilo/],
    ["per una voce nuova", { [UID_LIA]: LIA["-FINTOlia"] }, /voce vecchia/],
    ["per una voce inesistente", { "-NONCE": LIA["-FINTOlia"] }, /non presente/],
  ]) {
    test(`rifiutata ${nome}: nessuna scrittura`, async () => {
      const dati = await prepara(TRANS);
      const r = await rilascia({ bersaglio: B, regoleAttese: TRANS, migrazione: richiesta, prova: false, cartellaBackup: tmp() });
      assert.equal(r.esito, "fallito");
      assert.match(r.errore, motivo);
      assert.deepEqual(await rtdb.leggi(B, ""), dati);
    });
  }
  test("collegamento già presente verso un ALTRO uid: si ferma", async () => {
    const d = datiConProfili();
    d.legacyClaims = { "-FINTOlia": "uidAltro00000000000000000000" };
    await prepara(TRANS, d);
    const r = await rilascia({ bersaglio: B, regoleAttese: TRANS, migrazione: LIA, prova: false, cartellaBackup: tmp() });
    assert.equal(r.esito, "fallito");
    assert.match(r.errore, /ALTRO uid/);
    assert.equal(await rtdb.leggi(B, "legacyClaims/-FINTOlia"), "uidAltro00000000000000000000");
  });
  test("il confronto finale si accorge di una perdita", () => {
    const prima = datiConProfili();
    const dopo = JSON.parse(JSON.stringify(prima));
    dopo.leaderboard["-FINTOlia"].vittorie = 2;
    delete dopo.players["-FINTOpino"];
    assert.deepEqual(migr.confronta(prima, dopo).sort(), ["leaderboard/-FINTOlia/vittorie sceso", "players/-FINTOpino sparita"]);
  });
});
