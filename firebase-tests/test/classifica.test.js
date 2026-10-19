// Passo 4 — classifica "ognuno registra solo il proprio risultato, una volta per partita".
// Regole PROPOSTE (regole/proposte.json) e di TRANSIZIONE (regole/transizione.json), solo sull'emulatore.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente } = require("./aiuti");

const VECCHIA = { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 };
function stanza(fase, vincitori, gameId) {
  return {
    gameId,
    phase: fase,
    winnerTeam: vincitori,
    players: {
      red: { name: "Anna", token: "t-a", uid: "u-anna" }, // squadra A
      green: { name: "Bruno", token: "t-b", uid: "u-bruno" }, // squadra B
      yellow: { name: "Robo", token: "BOT-yellow", isBot: true },
      blue: { name: "Robi", token: "BOT-blue", isBot: true },
    },
  };
}
async function semina(env) {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/R1").set(stanza("finished", "A", "g1"));
    await db.ref("games/R2").set(stanza("playing", null, "g2"));
    await db.ref("leaderboard/-vecchioAnna").set(VECCHIA);
  });
}
// Il risultato come lo scrive il gioco (creditMyResult): classifica + segno, nello stesso update.
function risultato(db, uid, { room = "R1", game = "g1", partite = 1, vinte = 1, vittorie = vinte, nome = "Anna", segno = true, classifica = true } = {}) {
  const upd = {};
  if (segno) upd[`credited/${room}/${game}/${uid}`] = true;
  if (classifica) upd[`leaderboard/${uid}`] = { nome, partite, vinte, vittorie, ultimaStanza: room, ultimaPartita: game };
  return db.ref().update(upd);
}

test.describe("regole PROPOSTE", () => {
  let env;
  test.before(async () => { env = await creaAmbiente("../regole/proposte.json"); });
  test.after(async () => { if (env) await env.cleanup(); });
  test.beforeEach(() => semina(env));
  const come = (uid) => env.authenticatedContext(uid).database();

  test("chi ha vinto registra +1 partita e +1 vittoria", async () => {
    await assertSucceeds(risultato(come("u-anna"), "u-anna"));
  });
  test("chi ha perso registra +1 partita e 0 vittorie", async () => {
    await assertSucceeds(risultato(come("u-bruno"), "u-bruno", { vinte: 0, nome: "Bruno" }));
  });
  test("chi ha perso NON può registrarsi una vittoria", async () => {
    await assertFails(risultato(come("u-bruno"), "u-bruno", { vinte: 1, nome: "Bruno" }));
  });
  test("la stessa partita non si registra due volte", async () => {
    await assertSucceeds(risultato(come("u-anna"), "u-anna"));
    await assertFails(risultato(come("u-anna"), "u-anna", { partite: 2, vinte: 2 }));
  });
  test("non si aggiungono più partite o vittorie del dovuto", async () => {
    await assertFails(risultato(come("u-anna"), "u-anna", { partite: 5, vinte: 5 }));
    await assertFails(risultato(come("u-anna"), "u-anna", { partite: 1, vinte: 1, vittorie: 9 }));
  });
  test("non si scrive il risultato di un altro", async () => {
    await assertFails(risultato(come("u-anna"), "u-bruno", { vinte: 0 }));
  });
  test("chi non era seduto non registra nulla", async () => {
    await assertFails(risultato(come("u-estraneo"), "u-estraneo"));
  });
  test("partita non finita o identificativo sbagliato: rifiutato", async () => {
    await assertFails(risultato(come("u-anna"), "u-anna", { room: "R2", game: "g2" }));
    await assertFails(risultato(come("u-anna"), "u-anna", { game: "vecchia" }));
  });
  test("classifica senza segno, o segno senza classifica: rifiutati", async () => {
    await assertFails(risultato(come("u-anna"), "u-anna", { segno: false }));
    await assertFails(risultato(come("u-anna"), "u-anna", { classifica: false }));
  });
  test("le voci VECCHIE della classifica non si toccano né si cancellano", async () => {
    await assertFails(come("u-anna").ref("leaderboard/-vecchioAnna/vittorie").set(99));
    await assertFails(come("u-anna").ref("leaderboard/-vecchioAnna").remove());
    await assertFails(env.unauthenticatedContext().database().ref("leaderboard/-vecchioAnna").remove());
  });
  test("la propria voce non si cancella e non si azzera", async () => {
    await assertSucceeds(risultato(come("u-anna"), "u-anna"));
    await assertFails(come("u-anna").ref("leaderboard/u-anna").remove());
    await assertFails(come("u-anna").ref("leaderboard/u-anna/partite").set(0));
  });
  test("senza login non si registra nulla", async () => {
    await assertFails(risultato(env.unauthenticatedContext().database(), "u-anna"));
  });
  test("LIMITE NOTO: chi è seduto può ancora dichiarare vinta la partita e registrarsela (serve il server)", async () => {
    const db = come("u-bruno");
    // lo stato della partita lo scrivono i giocatori: le regole non sanno se la vittoria è vera
    await assertSucceeds(db.ref("games/R2").update({ phase: "finished", winnerTeam: "B" }));
    await assertSucceeds(risultato(db, "u-bruno", { room: "R2", game: "g2", nome: "Bruno" }));
  });
});

test.describe("regole di TRANSIZIONE (le versioni vecchie e nuove funzionano insieme)", () => {
  let env;
  test.before(async () => { env = await creaAmbiente("../regole/transizione.json"); });
  test.after(async () => { if (env) await env.cleanup(); });
  test.beforeEach(() => semina(env));

  test("il gioco nuovo registra il proprio risultato", async () => {
    await assertSucceeds(risultato(env.authenticatedContext("u-anna").database(), "u-anna"));
  });
  test("il gioco vecchio (v6.16) registra come oggi", async () => {
    const db = env.unauthenticatedContext().database();
    await assertSucceeds(db.ref("games/R1/leaderboardClaimed").set(true));
    await assertSucceeds(db.ref().update({ "leaderboard/-vecchioAnna/partite": 21 }));
  });
  test("il segno della partita resta non riscrivibile", async () => {
    const db = env.authenticatedContext("u-anna").database();
    await assertSucceeds(db.ref("credited/R1/g1/u-anna").set(true));
    await assertFails(db.ref("credited/R1/g1/u-anna").set(true));
    await assertFails(env.authenticatedContext("u-x").database().ref("credited/R1/g1/u-anna").set(true));
  });
});
