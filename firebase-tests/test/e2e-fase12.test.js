// Fasi 1-2 (preparazione) dal vivo: regole di TRANSIZIONE + dati FINTI come quelli veri.
// v6.16 (sul sito oggi) e v6.21 (correzione delle stanze bloccate). Solo emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");
const { autoGioca, fermaAutoGioca, mosseNelRegistro } = require("./e2e-aiuti-partita");
const { datiFinti, TOKEN_LIA } = require("../fase12/dati-finti");

const { telefono, errori } = preparaBanco("../regole/transizione.json");
const caricaDati = () => scrivi("", datiFinti());
const doppioni = (arr) => (arr || []).length !== new Set(arr || []).size;

test("v6.16: Gioca subito non usa la stanza bloccata (AUTO-1) né quella in corso (AUTO-2): ricicla AUTO-3", LIMITE, async () => {
  await caricaDati();
  const t = await telefono("Ugo-v616", { vecchia: true, giocatore: { id: "-FINTOugo", nome: "Ugo" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.equal(roomId, "AUTO-3");
  const a1 = await leggi("games/AUTO-1");
  assert.ok(doppioni(a1.draft.order), "AUTO-1 resta bloccata con la v6.16 (com'è oggi)");
  assert.deepEqual(await leggi("leaderboard"), datiFinti().leaderboard, "classifica intatta");
  assert.deepEqual(errori, []);
});

test("v6.16: chi ha una partita in corso (come Yaymaris in AUTO-2) ci rientra e continua a giocare", LIMITE, async () => {
  await caricaDati();
  const t = await telefono("Lia-v616", { vecchia: true, giocatore: { id: "-FINTOlia", nome: "Lia" } });
  await t.page.evaluate((tok) => {
    localStorage.setItem("tock-last-match", "AUTO-2");
    localStorage.setItem("tock-claim-AUTO-2-green", tok);
    localStorage.setItem("tock-mm-device", tok);
  }, TOKEN_LIA);
  await t.page.reload();
  await t.page.waitForSelector(".bx-resume", { timeout: 15000 });
  await t.page.click(".bx-resume");
  await finché(() => t.page.evaluate(() => myColor === "green" && !!currentState));
  const prima = mosseNelRegistro(await leggi("games/AUTO-2"));
  await autoGioca(t.page);
  await finché(async () => mosseNelRegistro(await leggi("games/AUTO-2")) >= prima + 3, 90000, 1000);
  await fermaAutoGioca(t.page);
  assert.deepEqual(errori, []);
});

test("v6.21+: Gioca subito ricicla la stanza bloccata AUTO-1 (si perde solo l'attesa bloccata)", LIMITE, async () => {
  await caricaDati();
  const t = await telefono("Ugo-v621", { giocatore: { id: "-FINTOugo", nome: "Ugo" } });
  assert.ok(await t.page.evaluate(() => compareAppVersions(APP_VERSION, "v6.21") >= 0), "serve la v6.21 o successiva");
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.equal(roomId, "AUTO-1");
  const a1 = await finché(async () => { const s = await leggi("games/AUTO-1"); return s.draft && !s.draft.pairDraw ? s : null; });
  assert.equal(a1.phase, "lobby");
  assert.ok(!doppioni(a1.draft.order));
  assert.deepEqual(Object.values(a1.draft.players), ["Ugo"]);
  assert.deepEqual(await leggi("games/AUTO-2/players/green"), datiFinti().games["AUTO-2"].players.green, "la partita in corso non si tocca");
  assert.deepEqual(await leggi("leaderboard"), datiFinti().leaderboard, "classifica intatta");
  assert.deepEqual(errori, []);
});

async function cadutaERientro(t) {
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  const token = await t.page.evaluate(() => mm.token);
  await finché(async () => { const s = await leggi(`games/${roomId}`); return s && s.draft && s.draft.players && s.draft.players[token]; });
  // la connessione cade: Firebase toglie il posto in attesa (come onDisconnect)...
  for (const k of ["players", "playerIds", "seen", "uids"]) await scrivi(`games/${roomId}/draft/${k}/${token}`, null);
  // ...e quando torna il telefono si risiede da solo
  await t.page.evaluate(({ r, tok }) => mmJoinRoom(r, null, tok), { r: roomId, tok: token });
  await finché(async () => { const s = await leggi(`games/${roomId}`); return s.draft.players && s.draft.players[token]; });
  await t.page.click(".mm-bot-btns button >> nth=0"); // "🤖 Normale", come una persona: compare solo a stanza ricevuta
  await aspetta(2500);
  return leggi(`games/${roomId}`);
}

test("causa di AUTO-1 riprodotta: con la v6.16 caduta + rientro = stesso telefono due volte e partita bloccata", LIMITE, async () => {
  const t = await telefono("Pino-v616", { vecchia: true, giocatore: { id: "-FINTOpino", nome: "Pino" } });
  const s = await cadutaERientro(t);
  assert.ok(doppioni(s.draft.order), "doppione nell'elenco");
  assert.equal(s.phase, "lobby", "la partita non parte");
  assert.equal(s.players, undefined);
});

test("con la v6.21 caduta + rientro = nessun doppione, la partita parte con 4 posti diversi", LIMITE, async () => {
  const t = await telefono("Pino-v621", { giocatore: { id: "-FINTOpino", nome: "Pino" } });
  const s = await cadutaERientro(t);
  assert.ok(!doppioni(s.draft.order));
  assert.notEqual(s.phase, "lobby");
  assert.equal(Object.keys(s.players).length, 4);
  assert.equal(new Set(Object.values(s.players).map((p) => p.token)).size, 4);
  assert.deepEqual(errori, []);
});
