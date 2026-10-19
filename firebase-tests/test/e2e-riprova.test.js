// v6.22 — "La mossa non è stata salvata… Riprova": un solo tentativo automatico in più quando il
// telefono non ha ancora la stanza in memoria. La mossa NON deve mai essere applicata due volte.
// Solo emulatore, regole di transizione.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE, richiede } = require("./e2e-banco");

const { telefono, errori } = preparaBanco("../regole/transizione.json");
const STANZA = { gameId: "g1", roomMode: "manual", phase: "playing", turnColor: "red", contatore: 0, log: ["inizio"] };

// Un telefono che NON ha mai ascoltato la stanza: Firebase non ce l'ha in memoria (come subito
// dopo l'inizio della partita). La modifica conta quante volte il mutatore è stato APPLICATO.
async function telefonoFresco(nome) {
  const t = await telefono(nome);
  await t.page.evaluate(() => { window.__applicazioni = 0; });
  return t;
}
const incrementa = (t, stanza = "PROVA1") =>
  t.page.evaluate((r) => updateState(r, (s) => { s.contatore = (s.contatore || 0) + 1; s.log.push("+1"); })
    .then(() => "ok", (e) => "errore: " + (e.code || "") + " " + e.message), stanza);

test("stanza non in memoria: la modifica riesce da sola ed è applicata UNA sola volta", richiede("v6.22"), async () => {
  await scrivi("games/PROVA1", STANZA);
  const t = await telefonoFresco("Fresco");
  assert.equal(await incrementa(t), "ok");
  const s = await leggi("games/PROVA1");
  assert.equal(s.contatore, 1, "applicata una volta sola");
  assert.deepEqual(s.log, ["inizio", "+1"]);
  assert.deepEqual(errori, []);
});

test("stanza che non esiste: errore 'non esiste più', nessun tentativo a vuoto, niente creato", LIMITE, async () => {
  const t = await telefonoFresco("Fresco");
  const esito = await incrementa(t, "NONESISTE");
  assert.match(esito, /ROOM_MISSING/);
  assert.equal(await leggi("games/NONESISTE"), null);
});

test("una mossa che dà errore NON viene ripetuta (il mutatore parte una volta)", richiede("v6.22"), async () => {
  await scrivi("games/PROVA1", STANZA);
  const t = await telefonoFresco("Fresco");
  const esito = await t.page.evaluate(() => {
    window.__chiamate = 0;
    return updateState("PROVA1", () => { window.__chiamate++; throw new Error("mossa non valida"); })
      .then(() => "ok", (e) => e.message);
  });
  assert.equal(esito, "mossa non valida");
  assert.equal(await t.page.evaluate(() => window.__chiamate), 1);
  assert.equal((await leggi("games/PROVA1")).contatore, 0);
});

test("due telefoni insieme (uno senza stanza in memoria): ogni modifica applicata una volta, totale 2", richiede("v6.22"), async () => {
  await scrivi("games/PROVA1", STANZA);
  const a = await telefonoFresco("A-fresco");
  const b = await telefono("B-in-ascolto");
  await b.page.evaluate(() => watchRoom("PROVA1", () => {}));
  await aspetta(800);
  const [ea, eb] = await Promise.all([incrementa(a), incrementa(b)]);
  assert.deepEqual([ea, eb], ["ok", "ok"]);
  const s = await finché(async () => { const x = await leggi("games/PROVA1"); return x.contatore === 2 ? x : null; }, 5000);
  assert.equal(s.log.filter((r) => r === "+1").length, 2);
  await aspetta(1000);
  assert.equal((await leggi("games/PROVA1")).contatore, 2, "nessuna applicazione in più");
});
