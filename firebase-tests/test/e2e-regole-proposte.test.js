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

async function partitaColComputer(t) {
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.evaluate(() => mmFillWithBots("easy", null));
  await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby";
  });
  await finché(() => t.page.evaluate(() => !!(currentState && myColor)));
  return roomId;
}
const finisci = (t, vinco) =>
  t.page.evaluate((v) => updateState(myRoomId, (s) => {
    s.phase = "finished";
    s.winnerTeam = v ? TEAM_OF[myColor] : TEAM_OF[myColor] === "A" ? "B" : "A";
  }), vinco);

test("Passo 4: a fine partita ognuno registra il PROPRIO risultato, una volta sola; rivincita = partita nuova", LIMITE, async () => {
  await scrivi("leaderboard", VECCHI.leaderboard);
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  const roomId = await partitaColComputer(t);
  const uid = await t.page.evaluate(() => myUid);
  const g1 = (await leggi(`games/${roomId}`)).gameId;
  assert.ok(g1, "la partita ha un identificativo");

  await finisci(t, true);
  const v1 = await finché(async () => { const v = await leggi(`leaderboard/${uid}`); return v && v.partite === 1 ? v : null; });
  assert.deepEqual({ partite: v1.partite, vinte: v1.vinte, vittorie: v1.vittorie, nome: v1.nome }, { partite: 1, vinte: 1, vittorie: 1, nome: "Elena" });
  assert.equal(await leggi(`credited/${roomId}/${g1}/${uid}`), true);
  assert.equal(await leggi("leaderboard/p-elena"), null, "niente più accrediti sulla chiave della rubrica");

  // stesso risultato registrato di nuovo (come riaprendo la partita finita): nessun doppio conteggio
  await t.page.evaluate(() => { _leaderboardClaimAttempted = false; return creditMyResult(currentState); });
  await aspetta(1500);
  assert.equal((await leggi(`leaderboard/${uid}`)).partite, 1);

  // rivincita: nuovo identificativo, si perde → partite 2, vinte resta 1
  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  const g2 = await finché(async () => { const s = await leggi(`games/${roomId}`); return s.phase !== "finished" && s.gameId !== g1 ? s.gameId : null; });
  await finisci(t, false);
  const v2 = await finché(async () => { const v = await leggi(`leaderboard/${uid}`); return v && v.partite === 2 ? v : null; });
  assert.equal(v2.vinte, 1);
  assert.equal(v2.ultimaPartita, g2);

  assert.deepEqual(await leggi("leaderboard/-vecchioAnna"), VECCHI.leaderboard["-vecchioAnna"], "voce vecchia intatta");
  assert.deepEqual(errori, []);
});
