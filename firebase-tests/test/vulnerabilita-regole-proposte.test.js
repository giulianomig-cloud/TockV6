// Le stesse falle di vulnerabilita-regole-attuali.test.js, ripetute con le regole PROPOSTE.
// "CHIUSA" = ora rifiutata. "RESTA" = limite noto che richiede un controllo sul server.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente, partitaDiProva } = require("./aiuti");

let env;
test.before(async () => { env = await creaAmbiente("../regole/proposte.json"); });
test.after(async () => { if (env) await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    const p = partitaDiProva();
    for (const c of Object.keys(p.players)) p.players[c].uid = "u-" + c;
    await db.ref("games/AMICI1").set(p);
    await db.ref("games/AUTO-1").set(p);
    await db.ref("leaderboard/p-anna").set({ nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
    await db.ref("players/p-anna").set({ nome: "Anna", creatoIl: 1 });
    await db.ref("presence/AMICI1/red/c1").set("v6.20");
    await db.ref("stats/roomsCreated").set(5);
    await db.ref("codes/AMICI1").set("room");
  });
});
const sconosciuto = () => env.unauthenticatedContext().database();
const collegato = () => env.authenticatedContext("u-estraneo").database();

test("CHIUSA: cambiare la classifica di un altro", async () => {
  await assertFails(sconosciuto().ref("leaderboard/p-anna/vittorie").set(9999));
  await assertFails(collegato().ref("leaderboard/p-anna/vittorie").set(9999));
});
test("CHIUSA: cancellare la classifica di un altro", async () => {
  await assertFails(collegato().ref("leaderboard/p-anna").remove());
});
test("CHIUSA: inventare un giocatore in classifica", async () => {
  await assertFails(collegato().ref("leaderboard/finto").set({ nome: "Finto", vittorie: 500, partite: 500, vinte: 500 }));
  await assertFails(collegato().ref("leaderboard/u-estraneo").set({ nome: "Io", vittorie: 500, partite: 500, vinte: 500, ultimaStanza: "AMICI1", ultimaPartita: "x" }));
});
test("CHIUSA: cancellare una stanza", async () => {
  await assertFails(collegato().ref("games/AMICI1").remove());
});
test("CHIUSA: accredito ripetuto della stessa partita (segno per gameId)", async () => {
  // il vecchio segno leaderboardClaimed non serve più; vedi classifica.test.js
  await assertFails(collegato().ref("credited/AMICI1/g/u-red").set(true));
});
test("CHIUSA: prendersi il posto di un altro (token o uid)", async () => {
  await assertFails(collegato().ref("games/AMICI1/players/red/token").set("tok-ladro"));
  await assertFails(collegato().ref("games/AMICI1/players/red/uid").set("u-estraneo"));
});
test("CHIUSA: versione finta nella presenza di un altro colore", async () => {
  await assertFails(collegato().ref("presence/AMICI1/green/finta").set("v99.99"));
});
test("CHIUSA: cambiare a piacere stats/ e codes/", async () => {
  await assertFails(collegato().ref("stats/roomsCreated").set(-1));
  await assertFails(collegato().ref("codes/AMICI1").remove());
});
test("RIDOTTA: rubrica dei nomi (senza login niente, nomi enormi rifiutati; chi è collegato può ancora creare voci brevi)", async () => {
  await assertFails(sconosciuto().ref("players/spam1").set({ nome: "x" }));
  await assertFails(collegato().ref("players/spam2").set({ nome: "x".repeat(5000) }));
  await assertSucceeds(collegato().ref("players/spam3").set({ nome: "x" }));
});
test("CHIUSA: senza login non si scrive niente", async () => {
  await assertFails(sconosciuto().ref("games/AMICI1/turnColor").set("green"));
  await assertFails(sconosciuto().ref("presence/AMICI1/red/x").set(true));
});
test("RESTA: dichiarare vinta una partita (lo stato lo scrivono i giocatori)", async () => {
  await assertSucceeds(collegato().ref("games/AMICI1").update({ winnerTeam: "A", phase: "finished" }));
});
test("RESTA: leggere le carte in mano e il mazzo", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/hands").get());
});
test("RESTA: testo libero nella chat delle stanze AUTO", async () => {
  await assertSucceeds(collegato().ref("games/AUTO-1/chat/1").set({ id: 2, color: "red", text: "testo libero qualsiasi" }));
});
