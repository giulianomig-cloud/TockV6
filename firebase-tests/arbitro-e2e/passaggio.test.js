// Passaggio graduale con le regole della Fase 5A (regole/proposte.json): l'arbitro si accende (config/arbitro)
// mentre ci sono ancora stanze "di prima". Le stanze vecchie continuano come prima, quelle nuove usano il server.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("../test/e2e-banco");
const { sedutoConAmici } = require("../test/e2e-aiuti-partita");
const { conTelefono, posizioneVincente, senzaArbitro } = require("./aiuti");

const SALTA = senzaArbitro();
const { telefono, errori } = preparaBanco("../regole/proposte.json");
const { erroriConsole, apriConArbitro } = conTelefono(telefono);

test("arbitro acceso a metà: la stanza creata prima resta 'di prima' e si gioca come sempre", { ...LIMITE, skip: SALTA }, async () => {
  const a = await telefono("Primo");
  await aspetta(1000);
  assert.equal(await a.page.evaluate(() => ARBITRO_ATTIVO), false);
  await sedutoConAmici(a.page, "Primo", "red", "VECCHIA1");
  assert.equal((await leggi("games/VECCHIA1")).arbitro, undefined);
  // si accende l'arbitro: chi arriva dopo lo vede acceso, ma la stanza resta com'era
  await scrivi("config/arbitro", true);
  const b = await apriConArbitro("Secondo");
  await sedutoConAmici(b.page, "Secondo", "green", "VECCHIA1");
  await b.page.evaluate(async () => {
    await assignBotToColor(myRoomId, "yellow", () => {}, "easy");
    await assignBotToColor(myRoomId, "blue", () => {}, "easy");
  });
  await finché(async () => Object.keys((await leggi("games/VECCHIA1")).players || {}).length === 4);
  await b.page.evaluate(() => startGame());
  const st = await finché(async () => { const s = await leggi("games/VECCHIA1"); return s.phase === "exchanging" ? s : null; });
  assert.equal(st.hands.red.length, 5, "partita di prima: carte distribuite dal telefono come sempre");
  assert.equal(await leggi("arbitro/VECCHIA1"), null, "il server non c'entra");
  await a.page.evaluate(() => sendExchangeCard(currentState.hands.red[0]));
  await finché(async () => !!(await leggi("games/VECCHIA1")).pendingExchange.red);
  assert.deepEqual(errori, []);
});

test("con le regole 5A e l'arbitro acceso: Gioca subito passa dal server e la classifica la scrive il server", { ...LIMITE, skip: SALTA }, async () => {
  await scrivi("config/arbitro", true);
  const t = await apriConArbitro("Ugo");
  await t.page.evaluate(() => { localStorage.setItem("tock-player", JSON.stringify({ id: null, nome: "Ugo" })); startMatchmaking(); });
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.click(".mm-bot-btns button >> nth=0");
  const s = await finché(async () => { const x = await leggi("arbitro/" + roomId + "/stato"); return x && x.phase === "exchanging" ? x : null; }, 30000);
  const seat = (await leggi("games/" + roomId)).players;
  const mio = await t.page.evaluate(() => myColor);
  assert.equal(seat[mio].uid, await t.page.evaluate(() => myUid));
  // per arrivare in fretta alla fine: il telefono di Ugo gioca la mossa vincente (colore deciso a caso)
  const scelta = posizioneVincente(s, mio);
  assert.ok(scelta, "posizione vincente trovata");
  await scrivi("arbitro/" + roomId + "/stato", { ...scelta.stato, players: s.players, rev: 50 });
  await t.page.evaluate(({ carta, mossa }) => chiamaArbitroMossa("mossa", { carta, mossa }), { carta: scelta.carta, mossa: scelta.mossa });
  const uid = await t.page.evaluate(() => myUid);
  const lb = await finché(() => leggi("leaderboard/" + uid));
  assert.equal(lb.partite, 1);
  assert.equal(lb.vinte, 1);
  assert.deepEqual(errori, []);
  assert.deepEqual(erroriConsole.splice(0), []);
});

test("arbitro acceso con le regole 5A: una sala d'attesa 'di prima' con una persona VIVA non si tocca (si entra come prima)", { ...LIMITE, skip: SALTA }, async () => {
  await scrivi("config/arbitro", true);
  await scrivi("games/AUTO-1", {
    roomMode: "draw", phase: "lobby", gameId: "vecchia", dealerColor: "red",
    draft: { players: { "tok-viva": "Viva" }, order: ["tok-viva"], seen: { "tok-viva": Date.now() } },
  });
  const t = await apriConArbitro("Ugo");
  await t.page.evaluate(() => { localStorage.setItem("tock-player", JSON.stringify({ id: null, nome: "Ugo" })); startMatchmaking(); });
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId), 30000);
  assert.equal(roomId, "AUTO-1", "va con chi aspetta");
  const s = await finché(async () => { const x = await leggi("games/AUTO-1"); return x && x.draft && Object.keys(x.draft.players || {}).length === 2 ? x : null; });
  assert.equal(s.arbitro, undefined, "la stanza resta 'di prima'");
  assert.ok(s.draft.players["tok-viva"], "chi aspettava è ancora lì");
  assert.deepEqual(errori, []);
});
