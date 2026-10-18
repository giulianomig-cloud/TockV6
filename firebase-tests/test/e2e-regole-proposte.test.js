// Prova "dal vivo" con le regole PROPOSTE (regole/proposte.json), solo sull'emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");

const { telefono, errori } = preparaBanco("../regole/proposte.json");

// Dati "vecchi" come quelli di oggi in produzione: non devono cambiare.
const VECCHI = {
  players: { "-vecchioAnna": { nome: "Anna", creatoIl: 1 } },
  leaderboard: { "-vecchioAnna": { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 } },
};

test("Passo 3: ogni telefono ha il suo profilo; stesso nome = due profili; i dati vecchi restano intatti", LIMITE, async () => {
  await scrivi("players", VECCHI.players);
  await scrivi("leaderboard", VECCHI.leaderboard);
  const a = await telefono("Anna-1", { giocatore: { id: "-vecchioAnna", nome: "Anna" } });
  const b = await telefono("Anna-2", { giocatore: { id: "-vecchioAnna", nome: "Anna" } });
  await a.page.evaluate(() => startMatchmaking());
  await b.page.evaluate(() => startMatchmaking());
  const uidA = await finché(() => a.page.evaluate(() => myUid));
  const uidB = await finché(() => b.page.evaluate(() => myUid));
  assert.notEqual(uidA, uidB);
  const prof = await finché(async () => {
    const p = await leggi("profiles");
    return p && p[uidA] && p[uidB] ? p : null;
  });
  assert.equal(prof[uidA].nome, "Anna");
  assert.equal(prof[uidB].nome, "Anna");
  assert.ok(prof[uidA].creatoIl > 0 && prof[uidA].aggiornatoIl > 0);

  // cambio nome: si aggiorna solo il proprio profilo
  await a.page.evaluate(() => saveMyProfile("Anna Rossi"));
  const p2 = await finché(async () => {
    const p = await leggi("profiles");
    return p[uidA].nome === "Anna Rossi" ? p : null;
  });
  assert.equal(p2[uidB].nome, "Anna");
  assert.equal(p2[uidA].creatoIl, prof[uidA].creatoIl, "la data di creazione non cambia");

  assert.deepEqual(await leggi("players/-vecchioAnna"), VECCHI.players["-vecchioAnna"]);
  assert.deepEqual(await leggi("leaderboard/-vecchioAnna"), VECCHI.leaderboard["-vecchioAnna"]);
  assert.deepEqual(errori, []);
});
