// Regole di TRANSIZIONE: la versione VECCHIA (v6.16) deve continuare a funzionare come oggi,
// anche nella stessa stanza con la v6.20. Solo emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE, richiede } = require("./e2e-banco");
const { autoGioca, fermaAutoGioca, mosseNelRegistro, sedutoConAmici, conRiprova } = require("./e2e-aiuti-partita");

const { telefono, errori } = preparaBanco("../regole/transizione.json");

test("v6.16 con le regole di transizione: Gioca subito coi computer, mosse, classifica come oggi, rivincita", LIMITE, async () => {
  await scrivi("leaderboard/p-ugo", { nome: "Ugo", vittorie: 3, partite: 5, vinte: 3 });
  const t = await telefono("Ugo-v616", { vecchia: true, giocatore: { id: "p-ugo", nome: "Ugo" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.click(".mm-bot-btns button >> nth=0"); // "🤖 Normale", come una persona: compare solo a stanza ricevuta
  await finché(async () => { const s = await leggi(`games/${roomId}`); return s && s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby"; });
  await finché(() => t.page.evaluate(() => !!(currentState && myColor)));
  await autoGioca(t.page);
  await finché(async () => mosseNelRegistro(await leggi(`games/${roomId}`)) >= 8, 90000, 1000);
  await fermaAutoGioca(t.page);
  await aspetta(1500);
  await conRiprova(() => t.page.evaluate(() => updateState(myRoomId, (s) => { s.phase = "finished"; s.winnerTeam = TEAM_OF[myColor]; })));
  const lb = await finché(async () => { const v = await leggi("leaderboard/p-ugo"); return v && v.partite === 6 ? v : null; });
  assert.equal(lb.vinte, 4, "la v6.16 registra come oggi (voce della rubrica)");
  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  await finché(async () => (await leggi(`games/${roomId}`)).phase !== "finished");
  assert.deepEqual(errori, []);
});

test("v6.16 con le regole di transizione: con gli amici e 'Sono io' funzionano come oggi", LIMITE, async () => {
  const a = await telefono("Gino-v616", { vecchia: true });
  await sedutoConAmici(a.page, "Gino", "green", "AMICI2");
  await finché(async () => { const s = await leggi("games/AMICI2"); return s && s.players && s.players.green; });
  const b = await telefono("Gino-v616-tel2", { vecchia: true });
  await b.page.evaluate(() => recoverByName("AMICI2", "Gino", null));
  const tokB = await finché(() => b.page.evaluate(() => localStorage.getItem("tock-claim-AMICI2-green")));
  await finché(async () => (await leggi("games/AMICI2")).players.green.token === tokB);
  assert.deepEqual(errori, []);
});

test("Stanza mista: versione nuova e v6.16 insieme; la v6.16 vede l'avviso 'aggiorna' e non cancella l'uid della v6.20", richiede("v6.20"), async () => {
  const nuovo = await telefono("Fabio-v620");
  await sedutoConAmici(nuovo.page, "Fabio", "red", "MISTA1");
  const uidF = await nuovo.page.evaluate(() => myUid);
  await finché(async () => { const s = await leggi("games/MISTA1"); return s && s.players && s.players.red && s.players.red.uid === uidF; });
  const vecchio = await telefono("Gino-v616", { vecchia: true });
  await sedutoConAmici(vecchio.page, "Gino", "green", "MISTA1");
  const s = await finché(async () => { const x = await leggi("games/MISTA1"); return x.players.green ? x : null; });
  assert.equal(s.players.red.uid, uidF, "la scrittura della v6.16 ha mantenuto l'uid di Fabio");
  assert.equal(s.players.green.uid, undefined);
  await finché(() => vecchio.page.evaluate(() => !!document.getElementById("version-banner")), 20000);
  const testo = await vecchio.page.evaluate(() => document.getElementById("version-banner").innerText);
  assert.ok(testo.includes(await nuovo.page.evaluate(() => APP_VERSION)), "l'avviso nomina la versione nuova: " + testo);
  assert.deepEqual(errori, []);
});

test("v6.16 legge senza problemi una classifica con voci vecchie e voci nuove della v6.20 (utile anche per il ripristino)", LIMITE, async () => {
  await scrivi("leaderboard", {
    "-vecchioAnna": { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 },
    "uidNuovoAnna": { nome: "Anna", vittorie: 1, partite: 2, vinte: 1, ultimaStanza: "AUTO-1", ultimaPartita: "abc" },
  });
  const t = await telefono("Lettore-v616", { vecchia: true });
  const righe = await t.page.evaluate(() => loadLeaderboard());
  assert.equal(righe.length, 2);
  assert.deepEqual(righe.map((r) => r.vittorie).sort((a, b) => a - b), [1, 12]);
  assert.deepEqual(errori, []);
});
