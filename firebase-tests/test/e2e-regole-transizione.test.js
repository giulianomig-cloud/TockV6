// Prova "dal vivo" con le regole di TRANSIZIONE (regole/transizione.json): quelle da pubblicare
// INSIEME alla versione nuova del gioco, finché tutti non hanno aggiornato.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");
const { conRiprova } = require("./e2e-aiuti-partita");

const { telefono, errori } = preparaBanco("../regole/transizione.json");

test("Transizione: profilo, codice di rientro, 'Sono io' col codice e classifica funzionano già", LIMITE, async () => {
  await scrivi("leaderboard/-vecchioAnna", { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
  const a = await telefono("Fabio", { giocatore: { id: "p-fabio", nome: "Fabio" } });
  await a.page.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="name-input" value="Fabio">');
    myColor = "red";
    await claimRoomMode("AMICI1", "manual");
    await joinManualRoom("AMICI1");
  });
  const uidA = await a.page.evaluate(() => myUid);
  const chiave = await finché(() => a.page.evaluate(() => mySeatKey));
  assert.equal((await finché(() => leggi(`profiles/${uidA}`))).nome, "Fabio");

  const b = await telefono("Fabio-2");
  b.page.on("dialog", (d) => d.accept(chiave));
  await b.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  const uidB = await b.page.evaluate(() => myUid);
  await finché(async () => (await leggi("games/AMICI1")).players.red.uid === uidB);
  await finché(() => b.page.evaluate(() => !!(currentState && myColor === "red"))); // il telefono ha caricato la stanza

  // classifica: fine partita simulata dal telefono che ora siede
  await conRiprova(() => b.page.evaluate(() => updateState(myRoomId, (s) => { s.phase = "finished"; s.winnerTeam = TEAM_OF[myColor]; })));
  const v = await finché(async () => { const x = await leggi(`leaderboard/${uidB}`); return x && x.partite === 1 ? x : null; });
  assert.equal(v.vinte, 1);
  assert.deepEqual(await leggi("leaderboard/-vecchioAnna"), { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
  assert.deepEqual(errori, []);
});
